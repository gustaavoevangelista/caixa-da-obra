CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email TEXT UNIQUE NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT true,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Migrate a users table created by an earlier revision (username +
-- password_hash) to the current email-only shape.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'users' AND column_name = 'username'
	) THEN
		ALTER TABLE users RENAME COLUMN username TO email;
	END IF;
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'users' AND column_name = 'password_hash'
	) THEN
		ALTER TABLE users DROP COLUMN password_hash;
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
	user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
	company_name TEXT NOT NULL DEFAULT '',
	company_logo TEXT,
	selected_project TEXT NOT NULL DEFAULT 'general',
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
	id TEXT NOT NULL,
	user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
	position BIGSERIAL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (user_id, id)
);

-- position is set explicitly by callers (not auto-incrementing): new
-- categories are prepended, so inserts use a value lower than the current
-- minimum for that user+type instead of always increasing.
CREATE TABLE IF NOT EXISTS categories (
	id TEXT NOT NULL,
	user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
	label TEXT NOT NULL,
	tag TEXT NOT NULL,
	position BIGINT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (user_id, type, id)
);

CREATE TABLE IF NOT EXISTS transactions (
	id TEXT NOT NULL,
	user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
	amount NUMERIC(12, 2) NOT NULL,
	category TEXT NOT NULL,
	category_label TEXT NOT NULL,
	category_tag TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	project_id TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (user_id, id)
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS photo TEXT;

-- Table originally created with an auto-incrementing position; callers now
-- set position explicitly (see comment above), so drop the old default.
ALTER TABLE categories ALTER COLUMN position DROP DEFAULT;

CREATE INDEX IF NOT EXISTS transactions_user_created_idx
	ON transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transactions_user_project_idx
	ON transactions (user_id, project_id);

CREATE TABLE IF NOT EXISTS invoices (
	id TEXT NOT NULL,
	user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	number INTEGER NOT NULL,
	client_name TEXT NOT NULL,
	client_nif TEXT NOT NULL,
	description TEXT NOT NULL,
	total NUMERIC(12, 2) NOT NULL,
	project_id TEXT,
	issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS invoice_transactions (
	user_id UUID NOT NULL,
	invoice_id TEXT NOT NULL,
	transaction_id TEXT NOT NULL,
	PRIMARY KEY (user_id, invoice_id, transaction_id),
	FOREIGN KEY (user_id, invoice_id) REFERENCES invoices (user_id, id) ON DELETE CASCADE,
	FOREIGN KEY (user_id, transaction_id) REFERENCES transactions (user_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS invoices_user_number_idx ON invoices (user_id, number);
