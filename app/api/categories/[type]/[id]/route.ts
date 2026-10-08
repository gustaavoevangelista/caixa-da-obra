import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { categories } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';

const typeParamSchema = z.enum(['expense', 'income']);

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ type: string; id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { type, id } = await params;
	const parsedType = typeParamSchema.safeParse(type);
	if (!parsedType.success) {
		return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
	}

	await db
		.delete(categories)
		.where(
			and(
				eq(categories.userId, user.id),
				eq(categories.type, parsedType.data),
				eq(categories.id, id),
			),
		);

	return NextResponse.json({ ok: true });
}
