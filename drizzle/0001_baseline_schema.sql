CREATE TABLE "categories" (
	"id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"tag" text NOT NULL,
	"position" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_user_id_type_id_pk" PRIMARY KEY("user_id","type","id"),
	CONSTRAINT "categories_type_check" CHECK ("categories"."type" in ('expense', 'income'))
);
--> statement-breakpoint
CREATE TABLE "invoice_transactions" (
	"user_id" uuid NOT NULL,
	"invoice_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	CONSTRAINT "invoice_transactions_user_id_invoice_id_transaction_id_pk" PRIMARY KEY("user_id","invoice_id","transaction_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"client_name" text NOT NULL,
	"client_nif" text NOT NULL,
	"description" text NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"project_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"company_logo" text,
	"selected_project" text DEFAULT 'general' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"position" bigserial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_user_id_id_pk" PRIMARY KEY("user_id","id"),
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" in ('active', 'ended'))
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" text NOT NULL,
	"category_label" text NOT NULL,
	"category_tag" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"photo" text,
	CONSTRAINT "transactions_user_id_id_pk" PRIMARY KEY("user_id","id"),
	CONSTRAINT "transactions_type_check" CHECK ("transactions"."type" in ('expense', 'income'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_premium_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_transactions" ADD CONSTRAINT "invoice_transactions_invoice_fk" FOREIGN KEY ("user_id","invoice_id") REFERENCES "public"."invoices"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_transactions" ADD CONSTRAINT "invoice_transactions_transaction_fk" FOREIGN KEY ("user_id","transaction_id") REFERENCES "public"."transactions"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_transactions_user_tx_uniq" ON "invoice_transactions" USING btree ("user_id","transaction_id");--> statement-breakpoint
CREATE INDEX "invoices_user_number_idx" ON "invoices" USING btree ("user_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_user_number_uniq" ON "invoices" USING btree ("user_id","number");--> statement-breakpoint
CREATE INDEX "transactions_user_created_idx" ON "transactions" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transactions_user_project_idx" ON "transactions" USING btree ("user_id","project_id");