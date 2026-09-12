import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
	const { email } = await request.json().catch(() => ({}));

	if (typeof email !== 'string' || !email.trim()) {
		return NextResponse.json(
			{ error: 'E-mail é obrigatório.' },
			{ status: 400 },
		);
	}

	const { rows } = await pool.query(
		'SELECT id, email, is_active FROM users WHERE email = $1',
		[email.trim().toLowerCase()],
	);
	const user = rows[0];

	if (!user) {
		return NextResponse.json(
			{ error: 'E-mail não encontrado.' },
			{ status: 401 },
		);
	}

	if (!user.is_active) {
		return NextResponse.json(
			{ error: 'Contacte o administrador para regularizar sua conta.' },
			{ status: 403 },
		);
	}

	const token = await createSessionToken(user.id, user.email);

	const response = NextResponse.json({ ok: true });
	response.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30,
	});
	return response;
}
