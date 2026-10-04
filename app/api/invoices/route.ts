import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { isUserPremium } from '@/lib/premium';
import { nextInvoiceNumber, sumTransactionAmounts } from '@/components/invoices';

export async function GET() {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!(await isUserPremium(user.id))) {
		return NextResponse.json({ error: 'Premium required' }, { status: 403 });
	}

	const result = await pool.query(
		`SELECT id, number, client_name AS "clientName", total, issued_at AS "issuedAt"
		FROM invoices WHERE user_id = $1 ORDER BY number DESC`,
		[user.id],
	);

	return NextResponse.json({
		invoices: result.rows.map((row) => ({
			...row,
			total: Number(row.total),
		})),
	});
}

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!(await isUserPremium(user.id))) {
		return NextResponse.json({ error: 'Premium required' }, { status: 403 });
	}

	const body = await request.json().catch(() => null);
	const { clientName, clientNif, description, transactionIds, projectId } =
		body ?? {};

	if (
		typeof clientName !== 'string' ||
		!clientName.trim() ||
		typeof clientNif !== 'string' ||
		!clientNif.trim() ||
		typeof description !== 'string' ||
		!description.trim() ||
		!Array.isArray(transactionIds) ||
		transactionIds.length === 0 ||
		!transactionIds.every((id) => typeof id === 'string')
	) {
		return NextResponse.json(
			{ error: 'Invalid invoice payload' },
			{ status: 400 },
		);
	}

	const uniqueTransactionIds = Array.from(new Set(transactionIds));

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		const txRes = await client.query(
			`SELECT id, amount FROM transactions
			WHERE user_id = $1 AND type = 'income' AND id = ANY($2::text[])`,
			[user.id, uniqueTransactionIds],
		);
		if (txRes.rows.length !== uniqueTransactionIds.length) {
			await client.query('ROLLBACK');
			return NextResponse.json(
				{ error: 'One or more transactions were not found' },
				{ status: 400 },
			);
		}

		const alreadyInvoicedRes = await client.query(
			`SELECT transaction_id FROM invoice_transactions
			WHERE user_id = $1 AND transaction_id = ANY($2::text[])`,
			[user.id, uniqueTransactionIds],
		);
		if (alreadyInvoicedRes.rows.length > 0) {
			await client.query('ROLLBACK');
			return NextResponse.json(
				{
					error: 'One or more transactions are already invoiced',
					transactionIds: alreadyInvoicedRes.rows.map(
						(row) => row.transaction_id,
					),
				},
				{ status: 409 },
			);
		}

		const total = sumTransactionAmounts(
			txRes.rows.map((row) => ({ id: row.id, amount: Number(row.amount) })),
		);

		const numberRes = await client.query(
			'SELECT number FROM invoices WHERE user_id = $1',
			[user.id],
		);
		const number = nextInvoiceNumber(
			numberRes.rows.map((row) => row.number as number),
		);

		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		const insertRes = await client.query(
			`INSERT INTO invoices
				(id, user_id, number, client_name, client_nif, description, total, project_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING issued_at AS "issuedAt"`,
			[
				id,
				user.id,
				number,
				clientName.trim(),
				clientNif.trim(),
				description.trim(),
				total,
				typeof projectId === 'string' ? projectId : null,
			],
		);

		for (const transactionId of uniqueTransactionIds) {
			await client.query(
				`INSERT INTO invoice_transactions (user_id, invoice_id, transaction_id)
				VALUES ($1, $2, $3)`,
				[user.id, id, transactionId],
			);
		}

		await client.query('COMMIT');

		return NextResponse.json({
			id,
			number,
			clientName: clientName.trim(),
			clientNif: clientNif.trim(),
			description: description.trim(),
			total,
			projectId: typeof projectId === 'string' ? projectId : null,
			issuedAt: insertRes.rows[0].issuedAt,
		});
	} catch (error) {
		await client.query('ROLLBACK');
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
	} finally {
		client.release();
	}
}
