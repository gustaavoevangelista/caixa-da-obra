import { sql } from 'drizzle-orm';
import {
	bigint,
	bigserial,
	boolean,
	check,
	foreignKey,
	index,
	integer,
	numeric,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';

// Canonical schema. Edit this file to change the schema, then:
//   npx drizzle-kit generate   (writes a new SQL file under drizzle/)
//   npm run db:migrate         (applies pending files under drizzle/)
// db/schema.sql no longer exists — see docs/superpowers/plans/2026-10-04-drizzle-orm-integration.md.

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	isActive: boolean('is_active').notNull().default(true),
	isPremiumUser: boolean('is_premium_user').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	companyName: text('company_name').notNull().default(''),
	companyLogo: text('company_logo'),
	selectedProject: text('selected_project').notNull().default('general'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
	'projects',
	{
		id: text('id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		status: text('status').notNull().default('active'),
		position: bigserial('position', { mode: 'number' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.id] }),
		statusCheck: check('projects_status_check', sql`${t.status} in ('active', 'ended')`),
	}),
);

export const categories = pgTable(
	'categories',
	{
		id: text('id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		label: text('label').notNull(),
		tag: text('tag').notNull(),
		position: bigint('position', { mode: 'number' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.type, t.id] }),
		typeCheck: check('categories_type_check', sql`${t.type} in ('expense', 'income')`),
	}),
);

export const transactions = pgTable(
	'transactions',
	{
		id: text('id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
		category: text('category').notNull(),
		categoryLabel: text('category_label').notNull(),
		categoryTag: text('category_tag').notNull(),
		description: text('description').notNull().default(''),
		projectId: text('project_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		photo: text('photo'),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.id] }),
		typeCheck: check('transactions_type_check', sql`${t.type} in ('expense', 'income')`),
		userCreatedIdx: index('transactions_user_created_idx').on(t.userId, t.createdAt.desc()),
		userProjectIdx: index('transactions_user_project_idx').on(t.userId, t.projectId),
	}),
);

export const invoices = pgTable(
	'invoices',
	{
		id: text('id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		number: integer('number').notNull(),
		clientName: text('client_name').notNull(),
		clientNif: text('client_nif').notNull(),
		description: text('description').notNull(),
		total: numeric('total', { precision: 12, scale: 2 }).notNull(),
		projectId: text('project_id'),
		issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.id] }),
		userNumberIdx: index('invoices_user_number_idx').on(t.userId, t.number),
		// Redundant with userNumberUniq below (same two columns) — both already
		// exist in production (the unique index was added later, in a hardening
		// pass, without dropping the plain one). Preserved as-is: this migration
		// is about tooling, not schema optimization.
		userNumberUniq: uniqueIndex('invoices_user_number_uniq').on(t.userId, t.number),
	}),
);

export const invoiceTransactions = pgTable(
	'invoice_transactions',
	{
		userId: uuid('user_id').notNull(),
		invoiceId: text('invoice_id').notNull(),
		transactionId: text('transaction_id').notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.invoiceId, t.transactionId] }),
		invoiceFk: foreignKey({
			columns: [t.userId, t.invoiceId],
			foreignColumns: [invoices.userId, invoices.id],
			name: 'invoice_transactions_invoice_fk',
		}).onDelete('cascade'),
		transactionFk: foreignKey({
			columns: [t.userId, t.transactionId],
			foreignColumns: [transactions.userId, transactions.id],
			name: 'invoice_transactions_transaction_fk',
		}).onDelete('cascade'),
		userTxUniq: uniqueIndex('invoice_transactions_user_tx_uniq').on(t.userId, t.transactionId),
	}),
);
