import type { Category } from '@/lib/default-categories';

export type TransactionType = 'expense' | 'income';

export type Transaction = {
	id: string;
	type: TransactionType;
	amount: number;
	category: string;
	categoryLabel: string;
	categoryTag: string;
	description: string;
	createdAt: string;
	projectId: string | null;
	photo: string | null;
};

export type Project = {
	id: string;
	name: string;
	status: 'active' | 'ended';
};

export type InvoiceSummary = {
	id: string;
	number: number;
	clientName: string;
	total: number;
	issuedAt: string;
};

export type InvoiceDetail = InvoiceSummary & {
	clientNif: string;
	description: string;
	projectId: string | null;
};

export type SavedCategories = {
	expense: Category[];
	income: Category[];
};

export const GENERAL = 'general';
