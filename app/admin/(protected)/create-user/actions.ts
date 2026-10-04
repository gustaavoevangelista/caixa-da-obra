'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/drizzle';
import { provisionUser, UserAlreadyExistsError } from '@/lib/provision-user';

export type CreateUserState = { error: string | null; success: string | null };

export async function createUserAction(
	_prevState: CreateUserState,
	formData: FormData,
): Promise<CreateUserState> {
	const email = formData.get('email');
	if (typeof email !== 'string' || !email.trim().includes('@')) {
		return { error: 'Informe um email válido.', success: null };
	}

	try {
		const { email: createdEmail } = await provisionUser(db, email);
		revalidatePath('/admin/users');
		return { error: null, success: `Cliente "${createdEmail}" criado.` };
	} catch (err) {
		if (err instanceof UserAlreadyExistsError) {
			return { error: err.message, success: null };
		}
		throw err;
	}
}
