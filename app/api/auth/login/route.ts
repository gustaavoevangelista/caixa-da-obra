import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/schema';

const loginSchema = z.object({
	email: z.string().trim().min(1),
});

export async function POST(request: Request) {
	const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'E-mail é obrigatório.' },
			{ status: 400 },
		);
	}

	const [user] = await db
		.select({ id: users.id, email: users.email, isActive: users.isActive })
		.from(users)
		.where(eq(users.email, parsed.data.email.toLowerCase()));

	if (!user) {
		return NextResponse.json(
			{ error: 'E-mail não encontrado.' },
			{ status: 401 },
		);
	}

	if (!user.isActive) {
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
