import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

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
	const { status } = body ?? {};

	if (status !== 'active' && status !== 'ended') {
		return NextResponse.json(
			{ error: 'Invalid project payload' },
			{ status: 400 },
		);
	}

	const result = await pool.query(
		'UPDATE projects SET status = $1 WHERE id = $2 AND user_id = $3',
		[status, id, user.id],
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
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			'DELETE FROM projects WHERE id = $1 AND user_id = $2',
			[id, user.id],
		);
		await client.query(
			'UPDATE transactions SET project_id = NULL WHERE project_id = $1 AND user_id = $2',
			[id, user.id],
		);
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}

	return NextResponse.json({ ok: true });
}
