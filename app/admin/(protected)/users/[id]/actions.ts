'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { pool } from '@/lib/db';
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
	await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [
		isActive,
		userId,
	]);
	revalidatePath(`/admin/users/${userId}`);
}

export async function toggleUserPremiumAction(
	userId: string,
	isPremiumUser: boolean,
) {
	await assertIsAdmin();
	await pool.query('UPDATE users SET is_premium_user = $1 WHERE id = $2', [
		isPremiumUser,
		userId,
	]);
	revalidatePath(`/admin/users/${userId}`);
}
