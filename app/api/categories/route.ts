import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const { id, type, label, tag } = body ?? {};

	if (
		typeof id !== 'string' ||
		(type !== 'expense' && type !== 'income') ||
		typeof label !== 'string' ||
		!label.trim() ||
		typeof tag !== 'string'
	) {
		return NextResponse.json(
			{ error: 'Invalid category payload' },
			{ status: 400 },
		);
	}

	await pool.query(
		`INSERT INTO categories (id, user_id, type, label, tag, position)
		VALUES ($1, $2, $3, $4, $5,
			COALESCE((SELECT MIN(position) FROM categories WHERE user_id = $2 AND type = $3), 0) - 1)`,
		[id, user.id, type, label.trim(), tag],
	);

	return NextResponse.json({ ok: true });
}
