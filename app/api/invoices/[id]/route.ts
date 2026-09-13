import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	const result = await pool.query(
		`SELECT id, number, client_name AS "clientName", client_nif AS "clientNif",
			description, total, project_id AS "projectId", issued_at AS "issuedAt"
		FROM invoices WHERE id = $1 AND user_id = $2`,
		[id, user.id],
	);

	const invoice = result.rows[0];
	if (!invoice) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	return NextResponse.json({ ...invoice, total: Number(invoice.total) });
}
