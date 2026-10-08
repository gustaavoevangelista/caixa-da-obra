import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { projects, transactions } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

const updateProjectSchema = z.object({
	status: z.enum(['active', 'ended']),
});

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	const parsed = updateProjectSchema.safeParse(
		await request.json().catch(() => null),
	);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid project payload' },
			{ status: 400 },
		);
	}

	const result = await db
		.update(projects)
		.set({ status: parsed.data.status })
		.where(and(eq(projects.id, id), eq(projects.userId, user.id)));

	if (result.rowCount === 0) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}
	return NextResponse.json({ ok: true });
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	await db.transaction(async (tx) => {
		await tx
			.delete(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, user.id)));
		await tx
			.update(transactions)
			.set({ projectId: null })
			.where(
				and(eq(transactions.projectId, id), eq(transactions.userId, user.id)),
			);
	});

	return NextResponse.json({ ok: true });
}
