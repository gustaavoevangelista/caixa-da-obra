import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ type: string; id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { type, id } = await params;
	if (type !== 'expense' && type !== 'income') {
		return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
	}

	await pool.query(
		'DELETE FROM categories WHERE user_id = $1 AND type = $2 AND id = $3',
		[user.id, type, id],
	);

	return NextResponse.json({ ok: true });
}
