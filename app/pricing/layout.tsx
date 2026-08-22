import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

// Clerk is scoped to this subtree only, same isolation pattern as
// app/admin/layout.tsx — the legacy customer app never imports Clerk.
//
// The NEXT_PUBLIC_CLERK_SIGN_IN_URL / _FORCE_REDIRECT_URL env vars are
// already set repo-wide for the /admin ClerkProvider (pointing at
// /admin/sign-in and /admin). signInUrl/signUpUrl below override where an
// unauthenticated visitor gets sent to authenticate — without them this
// subtree still falls back to those env vars and routes a customer through
// the "Admin" sign-in page mid-checkout (confirmed happening in testing).
// The FallbackRedirectUrl props separately control where they land *after*
// auth completes — both are needed, one doesn't cover the other.
export default function PricingLayout({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider
			signInUrl='/pricing/sign-up'
			signUpUrl='/pricing/sign-up'
			signInFallbackRedirectUrl='/pricing'
			signUpFallbackRedirectUrl='/pricing'
		>
			{children}
		</ClerkProvider>
	);
}
