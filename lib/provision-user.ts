import type { Pool } from 'pg';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './default-categories';

export class UserAlreadyExistsError extends Error {
	constructor(email: string) {
		super(`User "${email}" already exists.`);
		this.name = 'UserAlreadyExistsError';
	}
}

// Shared by scripts/create-user.ts (CLI) and the admin "create customer"
// form — both need the exact same insert-user/insert-profile/seed-categories
// transaction, so it lives here once instead of twice.
export async function provisionUser(pool: Pool, rawEmail: string) {
	const email = rawEmail.trim().toLowerCase();
	const client = await pool.connect();
	try {
		const existing = await client.query(
			'SELECT id FROM users WHERE email = $1',
			[email],
		);
		if (existing.rows.length > 0) {
			throw new UserAlreadyExistsError(email);
		}

		await client.query('BEGIN');

		const { rows } = await client.query(
			'INSERT INTO users (email) VALUES ($1) RETURNING id',
			[email],
		);
		const userId = rows[0].id;

		await client.query(
			'INSERT INTO profiles (user_id, company_name, company_logo, selected_project) VALUES ($1, $2, $3, $4)',
			[userId, '', null, 'general'],
		);

		for (const [index, cat] of EXPENSE_CATEGORIES.entries()) {
			await client.query(
				'INSERT INTO categories (id, user_id, type, label, tag, position) VALUES ($1, $2, $3, $4, $5, $6)',
				[cat.id, userId, 'expense', cat.label, cat.tag, index],
			);
		}
		for (const [index, cat] of INCOME_CATEGORIES.entries()) {
			await client.query(
				'INSERT INTO categories (id, user_id, type, label, tag, position) VALUES ($1, $2, $3, $4, $5, $6)',
				[cat.id, userId, 'income', cat.label, cat.tag, index],
			);
		}

		await client.query('COMMIT');
		return { userId, email };
	} catch (err) {
		if (!(err instanceof UserAlreadyExistsError)) {
			await client.query('ROLLBACK');
		}
		throw err;
	} finally {
		client.release();
	}
}
