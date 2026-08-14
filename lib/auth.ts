import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
const SESSION_DURATION = '30d';

function getSecretKey() {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error('AUTH_SECRET environment variable is not set');
	}
	return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, email: string) {
	return new SignJWT({ sub: userId, email })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(SESSION_DURATION)
		.sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, getSecretKey());
		return payload;
	} catch {
		return null;
	}
}
