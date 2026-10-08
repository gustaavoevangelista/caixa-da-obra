import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { profiles } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

const updateProfileSchema = z
	.object({
		companyName: z.string(),
		companyLogo: z.string().nullable(),
		selectedProject: z.string(),
	})
	.partial();

export async function PUT(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const parsed = updateProfileSchema.safeParse(
		await request.json().catch(() => ({})),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid profile payload' },
			{ status: 400 },
		);
	}

	const updates = parsed.data;
	if (Object.keys(updates).length === 0) {
		return NextResponse.json({ error: 'No fields provided' }, { status: 400 });
	}

	await db
		.update(profiles)
		.set({ ...updates, updatedAt: new Date() })
		.where(eq(profiles.userId, user.id));

	return NextResponse.json({ ok: true });
}
