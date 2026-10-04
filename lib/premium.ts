import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { users } from './schema';

export async function isUserPremium(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ isPremiumUser: users.isPremiumUser })
		.from(users)
		.where(eq(users.id, userId));
	return row?.isPremiumUser === true;
}
