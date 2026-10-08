'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/schema';
import { isAdminEmail } from '@/lib/admin-auth';

async function assertIsAdmin() {
	const user = await currentUser();
	const email =
		user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
			?.emailAddress ?? null;

	if (!isAdminEmail(email)) {
		throw new Error('Forbidden');
	}
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
	await assertIsAdmin();
	await db.update(users).set({ isActive }).where(eq(users.id, userId));
	revalidatePath(`/admin/users/${userId}`);
}

export async function toggleUserPremiumAction(
	userId: string,
	isPremiumUser: boolean,
) {
	await assertIsAdmin();
	await db.update(users).set({ isPremiumUser }).where(eq(users.id, userId));
	revalidatePath(`/admin/users/${userId}`);
}
