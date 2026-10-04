import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	categories,
	invoiceTransactions,
	profiles,
	projects,
	transactions,
} from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

export async function GET() {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [txRows, projRows, catRows, profileRows, invoicedRows] = await Promise.all([
		db
			.select({
				id: transactions.id,
				type: transactions.type,
				amount: transactions.amount,
				category: transactions.category,
				categoryLabel: transactions.categoryLabel,
				categoryTag: transactions.categoryTag,
				description: transactions.description,
				projectId: transactions.projectId,
				createdAt: transactions.createdAt,
				photo: transactions.photo,
			})
			.from(transactions)
			.where(eq(transactions.userId, user.id))
			.orderBy(desc(transactions.createdAt)),
		db
			.select({ id: projects.id, name: projects.name, status: projects.status })
			.from(projects)
			.where(eq(projects.userId, user.id))
			.orderBy(projects.position),
		db
			.select({
				id: categories.id,
				type: categories.type,
				label: categories.label,
				tag: categories.tag,
			})
			.from(categories)
			.where(eq(categories.userId, user.id))
			.orderBy(categories.position),
		db
			.select({
				companyName: profiles.companyName,
				companyLogo: profiles.companyLogo,
				selectedProject: profiles.selectedProject,
			})
			.from(profiles)
			.where(eq(profiles.userId, user.id)),
		db
			.select({ transactionId: invoiceTransactions.transactionId })
			.from(invoiceTransactions)
			.where(eq(invoiceTransactions.userId, user.id)),
	]);

	const categoriesByType: {
		expense: { id: string; label: string; tag: string }[];
		income: { id: string; label: string; tag: string }[];
	} = { expense: [], income: [] };
	for (const row of catRows) {
		categoriesByType[row.type as 'expense' | 'income'].push({
			id: row.id,
			label: row.label,
			tag: row.tag,
		});
	}

	const profile = profileRows[0] ?? {
		companyName: '',
		companyLogo: null,
		selectedProject: 'general',
	};

	return NextResponse.json({
		transactions: txRows.map((row) => ({
			...row,
			amount: Number(row.amount),
			createdAt: row.createdAt.toISOString(),
		})),
		projects: projRows,
		categories: categoriesByType,
		companyName: profile.companyName,
		companyLogo: profile.companyLogo,
		selectedProject: profile.selectedProject,
		invoicedTransactionIds: invoicedRows.map((row) => row.transactionId),
	});
}
