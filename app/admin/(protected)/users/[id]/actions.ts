'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db';

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
	await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [
		isActive,
		userId,
	]);
	revalidatePath(`/admin/users/${userId}`);
}
