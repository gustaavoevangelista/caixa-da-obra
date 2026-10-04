import { NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { invoices, invoiceTransactions, transactions } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';
import { isUserPremium } from '@/lib/premium';
import { nextInvoiceNumber, sumTransactionAmounts } from '@/components/invoices';

const createInvoiceSchema = z.object({
	clientName: z.string().trim().min(1),
	clientNif: z.string().trim().min(1),
	description: z.string().trim().min(1),
	transactionIds: z.array(z.string()).min(1),
	projectId: z.string().optional(),
});

export async function GET() {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!(await isUserPremium(user.id))) {
		return NextResponse.json({ error: 'Premium required' }, { status: 403 });
	}

	const rows = await db
		.select({
			id: invoices.id,
			number: invoices.number,
			clientName: invoices.clientName,
			total: invoices.total,
			issuedAt: invoices.issuedAt,
		})
		.from(invoices)
		.where(eq(invoices.userId, user.id))
		.orderBy(desc(invoices.number));

	return NextResponse.json({
		invoices: rows.map((row) => ({ ...row, total: Number(row.total) })),
	});
}

class TransactionsNotFoundError extends Error {}
class AlreadyInvoicedError extends Error {
	transactionIds: string[];
	constructor(transactionIds: string[]) {
		super('One or more transactions are already invoiced');
		this.transactionIds = transactionIds;
	}
}

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!(await isUserPremium(user.id))) {
		return NextResponse.json({ error: 'Premium required' }, { status: 403 });
	}

	const parsed = createInvoiceSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid invoice payload' },
			{ status: 400 },
		);
	}
	const { clientName, clientNif, description, transactionIds, projectId } =
		parsed.data;
	const uniqueTransactionIds = Array.from(new Set(transactionIds));

	try {
		const result = await db.transaction(async (tx) => {
			const txRows = await tx
				.select({ id: transactions.id, amount: transactions.amount })
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, user.id),
						eq(transactions.type, 'income'),
						inArray(transactions.id, uniqueTransactionIds),
					),
				);
			if (txRows.length !== uniqueTransactionIds.length) {
				throw new TransactionsNotFoundError();
			}

			const alreadyInvoicedRows = await tx
				.select({ transactionId: invoiceTransactions.transactionId })
				.from(invoiceTransactions)
				.where(
					and(
						eq(invoiceTransactions.userId, user.id),
						inArray(invoiceTransactions.transactionId, uniqueTransactionIds),
					),
				);
			if (alreadyInvoicedRows.length > 0) {
				throw new AlreadyInvoicedError(
					alreadyInvoicedRows.map((row) => row.transactionId),
				);
			}

			const total = sumTransactionAmounts(
				txRows.map((row) => ({ id: row.id, amount: Number(row.amount) })),
			);

			const numberRows = await tx
				.select({ number: invoices.number })
				.from(invoices)
				.where(eq(invoices.userId, user.id));
			const number = nextInvoiceNumber(numberRows.map((row) => row.number));

			const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			const [inserted] = await tx
				.insert(invoices)
				.values({
					id,
					userId: user.id,
					number,
					clientName,
					clientNif,
					description,
					total: String(total),
					projectId: projectId ?? null,
				})
				.returning({ issuedAt: invoices.issuedAt });

			await tx.insert(invoiceTransactions).values(
				uniqueTransactionIds.map((transactionId) => ({
					userId: user.id,
					invoiceId: id,
					transactionId,
				})),
			);

			return {
				id,
				number,
				clientName,
				clientNif,
				description,
				total,
				projectId: projectId ?? null,
				issuedAt: inserted.issuedAt,
			};
		});

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof TransactionsNotFoundError) {
			return NextResponse.json(
				{ error: 'One or more transactions were not found' },
				{ status: 400 },
			);
		}
		if (error instanceof AlreadyInvoicedError) {
			return NextResponse.json(
				{
					error: 'One or more transactions are already invoiced',
					transactionIds: error.transactionIds,
				},
				{ status: 409 },
			);
		}
		// A unique-index violation here means a concurrent request won the
		// race (double-submit billing the same transaction twice, or two
		// invoices landing on the same per-user number) — the checks above
		// already passed for both requests before either committed.
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			(error as { code?: string }).code === '23505'
		) {
			return NextResponse.json(
				{ error: 'One or more transactions are already invoiced' },
				{ status: 409 },
			);
		}
		throw error;
	}
}
