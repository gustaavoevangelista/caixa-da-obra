import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login'];
const PUBLIC_PATH_PREFIXES = ['/pricing'];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
	const { pathname } = request.nextUrl;

	// The admin dashboard is a separate surface with its own Clerk-based
	// auth (see lib/admin-auth.ts) — it never touches the jose-cookie
	// session logic below, and a missing/broken Clerk config can only ever
	// break /admin/*, never the customer-facing routes. Constructed lazily
	// (not at module scope) to keep that isolation.
	if (pathname.startsWith('/admin')) {
		const { clerkMiddleware, createRouteMatcher } = await import(
			'@clerk/nextjs/server'
		);
		const isPublicAdminRoute = createRouteMatcher(['/admin/sign-in(.*)']);
		const adminMiddleware = clerkMiddleware(async (auth, req) => {
			if (!isPublicAdminRoute(req)) {
				await auth.protect();
			}
		});
		return adminMiddleware(request, event);
	}

	if (
		PUBLIC_PATHS.some((path) => pathname === path) ||
		PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
		pathname.startsWith('/api/auth/')
	) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE)?.value;
	const session = token ? await verifySessionToken(token) : null;

	if (!session) {
		if (pathname.startsWith('/api/')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const loginUrl = new URL('/login', request.url);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)',
	],
};
