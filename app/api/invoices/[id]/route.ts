import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { invoices } from '@/lib/schema';
import { getSessionUser } from '@/lib/session';
import { isUserPremium } from '@/lib/premium';

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getSessionUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!(await isUserPremium(user.id))) {
		return NextResponse.json({ error: 'Premium required' }, { status: 403 });
	}

	const { id } = await params;
	const [invoice] = await db
		.select({
			id: invoices.id,
			number: invoices.number,
			clientName: invoices.clientName,
			clientNif: invoices.clientNif,
			description: invoices.description,
			total: invoices.total,
			projectId: invoices.projectId,
			issuedAt: invoices.issuedAt,
		})
		.from(invoices)
		.where(and(eq(invoices.id, id), eq(invoices.userId, user.id)));

	if (!invoice) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	return NextResponse.json({ ...invoice, total: Number(invoice.total) });
}
