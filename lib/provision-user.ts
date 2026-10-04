import { eq } from 'drizzle-orm';
import type { Database } from './drizzle';
import { categories, profiles, users } from './schema';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './default-categories';

export class UserAlreadyExistsError extends Error {
	constructor(email: string) {
		super(`User "${email}" already exists.`);
		this.name = 'UserAlreadyExistsError';
	}
}

// Shared by scripts/create-user.ts (CLI) and the admin "create customer"
// form — both need the exact same insert-user/insert-profile/seed-categories
// transaction, so it lives here once instead of twice.
export async function provisionUser(db: Database, rawEmail: string) {
	const email = rawEmail.trim().toLowerCase();

	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email));
	if (existing) {
		throw new UserAlreadyExistsError(email);
	}

	return db.transaction(async (tx) => {
		const [{ id: userId }] = await tx
			.insert(users)
			.values({ email })
			.returning({ id: users.id });

		await tx.insert(profiles).values({
			userId,
			companyName: '',
			companyLogo: null,
			selectedProject: 'general',
		});

		await tx.insert(categories).values([
			...EXPENSE_CATEGORIES.map((cat, index) => ({
				id: cat.id,
				userId,
				type: 'expense' as const,
				label: cat.label,
				tag: cat.tag,
				position: index,
			})),
			...INCOME_CATEGORIES.map((cat, index) => ({
				id: cat.id,
				userId,
				type: 'income' as const,
				label: cat.label,
				tag: cat.tag,
				position: index,
			})),
		]);

		return { userId, email };
	});
}
