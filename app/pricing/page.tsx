import { Suspense } from 'react';
import { PricingTable } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { CaptureAppRedirect } from './_components/capture-app-redirect';

export default async function PricingPage() {
	// TEMP diagnostic: the native app opens this page in the system
	// browser/Custom Tab via openAuthSessionAsync, which is a *separate*
	// session from the native app's own Clerk session — it can easily
	// still be signed in as whatever Clerk identity was last used in that
	// browser (e.g. an earlier manually-tested account), which would
	// explain PricingTable showing no Subscribe button (it hides that CTA
	// when the signed-in user already has the plan).
	const user = await currentUser();
	const email = user?.emailAddresses.find(
		(e) => e.id === user.primaryEmailAddressId,
	)?.emailAddress;

	return (
		<div className='flex min-h-screen flex-col items-center gap-8 px-6 py-16'>
			<Suspense fallback={null}>
				<CaptureAppRedirect />
			</Suspense>
			<div className='flex flex-col items-center gap-2 text-center'>
				<h1 className='text-2xl font-semibold text-slate-100'>
					Flux Finance
				</h1>
				<p className='max-w-sm text-sm text-slate-400'>
					Assine para começar a usar o app.
				</p>
			</div>
			<div className='w-full max-w-3xl'>
				<PricingTable
					for='user'
					highlightedPlan='standard'
					newSubscriptionRedirectUrl='/pricing/success'
				/>
			</div>
		</div>
	);
}
