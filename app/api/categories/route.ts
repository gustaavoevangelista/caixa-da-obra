import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { categories } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

const createCategorySchema = z.object({
	id: z.string().min(1),
	type: z.enum(['expense', 'income']),
	label: z.string().trim().min(1),
	tag: z.string(),
});

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const parsed = createCategorySchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid category payload' },
			{ status: 400 },
		);
	}
	const { id, type, label, tag } = parsed.data;

	await db.insert(categories).values({
		id,
		userId: user.id,
		type,
		label,
		tag,
		position: sql`coalesce((select min(position) from categories where user_id = ${user.id} and type = ${type}), 0) - 1`,
	});

	return NextResponse.json({ ok: true });
}
