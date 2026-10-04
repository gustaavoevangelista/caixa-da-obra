import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

loadEnvConfig(process.cwd());

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const pool = new Pool({ connectionString });
	const db = drizzle(pool);
	try {
		await migrate(db, { migrationsFolder: './drizzle' });
		console.log('Migration applied successfully.');
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
