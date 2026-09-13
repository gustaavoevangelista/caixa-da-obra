import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET() {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [txRes, projRes, catRes, profileRes, invoicedRes] = await Promise.all([
		pool.query(
			`SELECT id, type, amount, category,
				category_label AS "categoryLabel",
				category_tag AS "categoryTag",
				description, project_id AS "projectId", created_at AS "createdAt",
				photo
			FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`,
			[user.id],
		),
		pool.query(
			'SELECT id, name, status FROM projects WHERE user_id = $1 ORDER BY position ASC',
			[user.id],
		),
		pool.query(
			'SELECT id, type, label, tag FROM categories WHERE user_id = $1 ORDER BY position ASC',
			[user.id],
		),
		pool.query(
			`SELECT company_name AS "companyName", company_logo AS "companyLogo",
				selected_project AS "selectedProject"
			FROM profiles WHERE user_id = $1`,
			[user.id],
		),
		pool.query(
			'SELECT transaction_id FROM invoice_transactions WHERE user_id = $1',
			[user.id],
		),
	]);

	const categories: {
		expense: { id: string; label: string; tag: string }[];
		income: { id: string; label: string; tag: string }[];
	} = { expense: [], income: [] };
	for (const row of catRes.rows) {
		categories[row.type as 'expense' | 'income'].push({
			id: row.id,
			label: row.label,
			tag: row.tag,
		});
	}

	const profile = profileRes.rows[0] ?? {
		companyName: '',
		companyLogo: null,
		selectedProject: 'general',
	};

	return NextResponse.json({
		transactions: txRes.rows.map((row) => ({
			...row,
			amount: Number(row.amount),
			createdAt: new Date(row.createdAt).toISOString(),
		})),
		projects: projRes.rows,
		categories,
		companyName: profile.companyName,
		companyLogo: profile.companyLogo,
		selectedProject: profile.selectedProject,
		invoicedTransactionIds: invoicedRes.rows.map((row) => row.transaction_id),
	});
}
