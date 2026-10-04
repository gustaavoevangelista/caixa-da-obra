import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { projects } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

const createProjectSchema = z.object({
	id: z.string().min(1),
	name: z.string().trim().min(1),
	status: z.enum(['active', 'ended']),
});

export async function POST(request: Request) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const parsed = createProjectSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid project payload' },
			{ status: 400 },
		);
	}
	const { id, name, status } = parsed.data;

	await db.insert(projects).values({ id, userId: user.id, name, status });

	return NextResponse.json({ ok: true });
}
