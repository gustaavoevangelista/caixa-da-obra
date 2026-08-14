import { Pool } from 'pg';

declare global {
	// eslint-disable-next-line no-var
	var __pgPool: Pool | undefined;
}

function createPool() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	return new Pool({ connectionString });
}

export const pool = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
	global.__pgPool = pool;
}
