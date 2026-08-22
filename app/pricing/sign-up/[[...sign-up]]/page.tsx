import { SignIn, SignUp } from '@clerk/nextjs';

// Clerk's <SignIn/> handles the combined sign-in-or-up flow (an
// unrecognized email creates an account here too) — this is the one auth
// entry point for the /pricing checkout flow, kept separate from
// /admin/sign-in so a customer never sees an "Admin" branded page mid-checkout.
export default function PricingSignUpPage() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<SignUp />
		</div>
	);
}
