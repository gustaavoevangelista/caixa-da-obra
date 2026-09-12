import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { pool } from '@/lib/db';

const PUBLIC_PATHS = ['/login'];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
	const { pathname } = request.nextUrl;

	// /admin and /pricing are both Clerk-based surfaces with their own
	// scoped <ClerkProvider> — neither touches the jose-cookie session
	// logic below. Both need clerkMiddleware() to have run, even though
	// only /admin is actually protected here: server-side auth()/
	// currentUser() calls throw without it, even on a route that's meant
	// to stay public (Clerk's own <SignIn/>/<SignUp/> and PricingTable
	// handle /pricing's auth entirely client-side). Constructed lazily
	// (not at module scope) to keep both surfaces isolated from the
	// customer-facing routes below.
	if (pathname.startsWith('/admin') || pathname.startsWith('/pricing')) {
		const { clerkMiddleware, createRouteMatcher } = await import(
			'@clerk/nextjs/server'
		);
		const isPublicAdminRoute = createRouteMatcher(['/admin/sign-in(.*)']);
		const isAdminRoute = createRouteMatcher(['/admin(.*)']);
		const clerkScopedMiddleware = clerkMiddleware(async (auth, req) => {
			if (isAdminRoute(req) && !isPublicAdminRoute(req)) {
				await auth.protect();
			}
		});
		return clerkScopedMiddleware(request, event);
	}

	if (
		PUBLIC_PATHS.some((path) => pathname === path) ||
		pathname.startsWith('/api/auth/')
	) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE)?.value;
	const session = token ? await verifySessionToken(token) : null;

	if (!session || typeof session.sub !== 'string') {
		if (pathname.startsWith('/api/')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const loginUrl = new URL('/login', request.url);
		return NextResponse.redirect(loginUrl);
	}

	// Live check (proxy.ts runs on the Node.js runtime, so a DB round-trip
	// here is fine) so a deactivated account is locked out immediately,
	// not just on its next login.
	const { rows } = await pool.query(
		'SELECT is_active FROM users WHERE id = $1',
		[session.sub],
	);

	if (!rows[0]?.is_active) {
		if (pathname.startsWith('/api/')) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('inactive', '1');
		const response = NextResponse.redirect(loginUrl);
		response.cookies.delete(SESSION_COOKIE);
		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)',
	],
};
