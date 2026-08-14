import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const { id, name, status } = body ?? {};

	if (
		typeof id !== 'string' ||
		typeof name !== 'string' ||
		!name.trim() ||
		(status !== 'active' && status !== 'ended')
	) {
		return NextResponse.json(
			{ error: 'Invalid project payload' },
			{ status: 400 },
		);
	}

	await pool.query(
		'INSERT INTO projects (id, user_id, name, status) VALUES ($1, $2, $3, $4)',
		[id, user.id, name.trim(), status],
	);

	return NextResponse.json({ ok: true });
}
