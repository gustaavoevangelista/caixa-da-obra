import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { transactions } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';
import { isUserPremium } from '@/lib/premium';
import { MAX_RECEIPT_PHOTO_DATA_URL_LENGTH } from '@/components/receipt-photo';

const createTransactionSchema = z.object({
	id: z.string().min(1),
	type: z.enum(['expense', 'income']),
	amount: z.number(),
	category: z.string(),
	categoryLabel: z.string(),
	categoryTag: z.string(),
	description: z.string().optional(),
	createdAt: z.string().optional(),
	projectId: z.string().optional(),
	photo: z.string().max(MAX_RECEIPT_PHOTO_DATA_URL_LENGTH).nullable().optional(),
});

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	const premium = await isUserPremium(user.id);

	const parsed = createTransactionSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid transaction payload' },
			{ status: 400 },
		);
	}
	const {
		id,
		type,
		amount,
		category,
		categoryLabel,
		categoryTag,
		description,
		createdAt,
		projectId,
		photo,
	} = parsed.data;

	await db.insert(transactions).values({
		id,
		userId: user.id,
		type,
		amount: String(amount),
		category,
		categoryLabel,
		categoryTag,
		description: description ?? '',
		projectId: projectId ?? null,
		createdAt: createdAt ? new Date(createdAt) : new Date(),
		photo: premium && photo ? photo : null,
	});

	return NextResponse.json({ ok: true });
}
