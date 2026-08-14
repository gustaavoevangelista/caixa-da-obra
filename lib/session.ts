import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './auth';

export type SessionUser = { id: string; email: string };

export async function getSessionUser(): Promise<SessionUser | null> {
	const store = await cookies();
	const token = store.get(SESSION_COOKIE)?.value;
	if (!token) return null;

	const payload = await verifySessionToken(token);
	if (!payload || typeof payload.sub !== 'string') return null;

	return {
		id: payload.sub,
		email: typeof payload.email === 'string' ? payload.email : '',
	};
}
