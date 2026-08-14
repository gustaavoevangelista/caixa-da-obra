import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function PUT(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const sets: string[] = [];
	const values: unknown[] = [];

	if ('companyName' in body) {
		values.push(typeof body.companyName === 'string' ? body.companyName : '');
		sets.push(`company_name = $${values.length}`);
	}
	if ('companyLogo' in body) {
		values.push(
			typeof body.companyLogo === 'string' ? body.companyLogo : null,
		);
		sets.push(`company_logo = $${values.length}`);
	}
	if ('selectedProject' in body) {
		values.push(
			typeof body.selectedProject === 'string'
				? body.selectedProject
				: 'general',
		);
		sets.push(`selected_project = $${values.length}`);
	}

	if (sets.length === 0) {
		return NextResponse.json({ error: 'No fields provided' }, { status: 400 });
	}

	values.push(user.id);
	await pool.query(
		`UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $${values.length}`,
		values,
	);

	return NextResponse.json({ ok: true });
}
