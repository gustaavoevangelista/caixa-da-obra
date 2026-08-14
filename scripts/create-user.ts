import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/default-categories';

loadEnvConfig(process.cwd());

async function main() {
	const [, , rawEmail] = process.argv;

	if (!rawEmail || !rawEmail.includes('@')) {
		console.error('Usage: npm run user:create -- <email>');
		process.exit(1);
	}

	const email = rawEmail.trim().toLowerCase();
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const pool = new Pool({ connectionString });
	const client = await pool.connect();
	try {
		const existing = await client.query(
			'SELECT id FROM users WHERE email = $1',
			[email],
		);
		if (existing.rows.length > 0) {
			console.error(`User "${email}" already exists.`);
			process.exit(1);
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
		console.log(`User "${email}" created (id: ${userId}).`);
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Failed to create user:', err);
	process.exit(1);
});
