import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { transactions } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';
import { isUserPremium } from '@/lib/premium';
import { MAX_RECEIPT_PHOTO_DATA_URL_LENGTH } from '@/components/receipt-photo';

const updateTransactionSchema = z.object({
	type: z.enum(['expense', 'income']),
	amount: z.number(),
	category: z.string(),
	categoryLabel: z.string(),
	categoryTag: z.string(),
	description: z.string().optional(),
	photo: z.string().max(MAX_RECEIPT_PHOTO_DATA_URL_LENGTH).nullable().optional(),
});

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const premium = await isUserPremium(user.id);

	const { id } = await params;
	const parsed = updateTransactionSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid transaction payload' },
			{ status: 400 },
		);
	}
	const { type, amount, category, categoryLabel, categoryTag, description, photo } =
		parsed.data;

	const values: Partial<typeof transactions.$inferInsert> = {
		type,
		amount: String(amount),
		category,
		categoryLabel,
		categoryTag,
		description: description ?? '',
	};
	// Only touch the photo column when premium — replaces the raw-SQL
	// `CASE WHEN $7 THEN $8::text ELSE photo END`: leaving the key out of
	// `.set()` entirely has the same effect (column untouched) as that
	// CASE's ELSE branch.
	if (premium) {
		values.photo = photo ?? null;
	}

	const result = await db
		.update(transactions)
		.set(values)
		.where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

	if (result.rowCount === 0) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
	return NextResponse.json({ ok: true });
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	await db
		.delete(transactions)
		.where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

	return NextResponse.json({ ok: true });
}
