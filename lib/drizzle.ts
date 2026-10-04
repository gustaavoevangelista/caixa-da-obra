import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './db';
import * as schema from './schema';

declare global {
	// eslint-disable-next-line no-var
	var __drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export const db = global.__drizzleDb ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== 'production') {
	global.__drizzleDb = db;
}

export type Database = typeof db;
