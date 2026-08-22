'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const APP_REDIRECT_STORAGE_KEY = 'flux_app_redirect';

// The native app opens /pricing?app_redirect=<url> via
// WebBrowser.openAuthSessionAsync. Clerk's newSubscriptionRedirectUrl on
// PricingTable is a fixed string, so it can't carry that query param
// through the Stripe Checkout redirect chain — stashing it in localStorage
// here lets /pricing/success read it back same-origin, after the redirect.
export function CaptureAppRedirect() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const appRedirect = searchParams.get('app_redirect');
		if (appRedirect) {
			localStorage.setItem(APP_REDIRECT_STORAGE_KEY, appRedirect);
		}
	}, [searchParams]);

	return null;
}
