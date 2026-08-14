import { loadEnvConfig } from '@next/env';
import { readFileSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';

loadEnvConfig(process.cwd());

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const schema = readFileSync(
		path.join(process.cwd(), 'db', 'schema.sql'),
		'utf8',
	);

	const pool = new Pool({ connectionString });
	try {
		await pool.query(schema);
		console.log('Migration applied successfully.');
	} finally {
		await pool.end();
	}
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
