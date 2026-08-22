import { Suspense } from 'react';
import { PricingTable } from '@clerk/nextjs';
import { CaptureAppRedirect } from './_components/capture-app-redirect';

export default function PricingPage() {
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
