import { pool } from './db';

export async function isUserPremium(userId: string): Promise<boolean> {
	const { rows } = await pool.query(
		'SELECT is_premium_user FROM users WHERE id = $1',
		[userId],
	);
	return rows[0]?.is_premium_user === true;
}
