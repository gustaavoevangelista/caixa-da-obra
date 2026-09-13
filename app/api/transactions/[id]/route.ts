import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { MAX_RECEIPT_PHOTO_DATA_URL_LENGTH } from '@/components/receipt-photo';

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	const body = await request.json().catch(() => null);
	const { type, amount, category, categoryLabel, categoryTag, description, photo } =
		body ?? {};

	if (
		(type !== 'expense' && type !== 'income') ||
		typeof amount !== 'number' ||
		typeof category !== 'string' ||
		typeof categoryLabel !== 'string' ||
		typeof categoryTag !== 'string' ||
		(photo !== undefined && photo !== null && typeof photo !== 'string') ||
		(typeof photo === 'string' &&
			photo.length > MAX_RECEIPT_PHOTO_DATA_URL_LENGTH)
	) {
		return NextResponse.json(
			{ error: 'Invalid transaction payload' },
			{ status: 400 },
		);
	}

	const result = await pool.query(
		`UPDATE transactions
		SET type = $1, amount = $2, category = $3, category_label = $4, category_tag = $5, description = $6, photo = $7
		WHERE id = $8 AND user_id = $9`,
		[
			type,
			amount,
			category,
			categoryLabel,
			categoryTag,
			typeof description === 'string' ? description : '',
			typeof photo === 'string' ? photo : null,
			id,
			user.id,
		],
	);

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
	await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [
		id,
		user.id,
	]);

	return NextResponse.json({ ok: true });
}
