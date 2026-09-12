'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs/legacy';

// __clerk_ticket isn't passively consumed just by appearing in the URL —
// that's only wired into the <SignUp/> flow's own completion logic. A
// sign-in token has to be exchanged explicitly via signIn.create({strategy:
// 'ticket', ticket}), same pattern as the native app's SignInScreen/
// SignUpScreen. Doing it here (rather than on /pricing itself) avoids
// racing PricingTable's own "not signed in, redirect to sign-up" check —
// this page owns the exchange, then redirects to /pricing exactly once,
// success or failure.
function HandoffRedirect() {
	const { isLoaded, signIn, setActive } = useSignIn();
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!isLoaded) return;

		const appRedirect = searchParams.get('app_redirect');
		const target = appRedirect
			? `/pricing?app_redirect=${encodeURIComponent(appRedirect)}`
			: '/pricing';
		const ticket = searchParams.get('__clerk_ticket');

		if (!ticket) {
			router.replace(target);
			return;
		}

		signIn
			.create({ strategy: 'ticket', ticket })
			.then((result) => {
				console.log('[handoff] ticket sign-in status:', result.status);
				if (result.status === 'complete') {
					return setActive({ session: result.createdSessionId });
				}
			})
			.catch((error) => {
				console.error('[handoff] ticket sign-in failed:', error);
			})
			.finally(() => {
				router.replace(target);
			});
	}, [isLoaded, signIn, setActive, router, searchParams]);

	return null;
}

export default function CheckoutHandoffPage() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<Suspense fallback={null}>
				<HandoffRedirect />
			</Suspense>
			<p className='text-sm text-slate-400'>A preparar a sua sessão…</p>
		</div>
	);
}
