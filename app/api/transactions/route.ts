import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
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
	} = body ?? {};

	if (
		typeof id !== 'string' ||
		(type !== 'expense' && type !== 'income') ||
		typeof amount !== 'number' ||
		typeof category !== 'string' ||
		typeof categoryLabel !== 'string' ||
		typeof categoryTag !== 'string'
	) {
		return NextResponse.json(
			{ error: 'Invalid transaction payload' },
			{ status: 400 },
		);
	}

	await pool.query(
		`INSERT INTO transactions
			(id, user_id, type, amount, category, category_label, category_tag, description, project_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			id,
			user.id,
			type,
			amount,
			category,
			categoryLabel,
			categoryTag,
			typeof description === 'string' ? description : '',
			typeof projectId === 'string' ? projectId : null,
			typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
		],
	);

	return NextResponse.json({ ok: true });
}
