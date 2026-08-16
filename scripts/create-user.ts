import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';
import { provisionUser, UserAlreadyExistsError } from '../lib/provision-user';

loadEnvConfig(process.cwd());

async function main() {
	const [, , rawEmail] = process.argv;

	if (!rawEmail || !rawEmail.includes('@')) {
		console.error('Usage: npm run user:create -- <email>');
		process.exit(1);
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const pool = new Pool({ connectionString });
	try {
		const { userId, email } = await provisionUser(pool, rawEmail);
		console.log(`User "${email}" created (id: ${userId}).`);
	} catch (err) {
		if (err instanceof UserAlreadyExistsError) {
			console.error(err.message);
			process.exit(1);
		}
		throw err;
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Failed to create user:', err);
	process.exit(1);
});
