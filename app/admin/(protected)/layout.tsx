import type { ReactNode } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { NotAuthorized } from '../_components/not-authorized';
import { AdminNav } from '../_components/admin-nav';

export default async function ProtectedAdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	const user = await currentUser();
	const email =
		user?.emailAddresses.find(
			(e) => e.id === user.primaryEmailAddressId,
		)?.emailAddress ?? null;

	if (!isAdminEmail(email)) {
		return <NotAuthorized email={email} />;
	}

	return (
		<div>
			<AdminNav />
			<main className='px-6 py-8'>{children}</main>
		</div>
	);
}
