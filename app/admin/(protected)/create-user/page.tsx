'use client';

import { useActionState } from 'react';
import { createUserAction, type CreateUserState } from './actions';

const initialState: CreateUserState = { error: null, success: null };

export default function CreateUserPage() {
	const [state, formAction, pending] = useActionState(
		createUserAction,
		initialState,
	);

	return (
		<div className='flex max-w-md flex-col gap-4'>
			<h1 className='text-lg font-semibold text-slate-100'>
				Cadastrar cliente
			</h1>
			<p className='text-sm text-slate-400'>
				Cria a conta, o perfil e as categorias padrão para um novo
				cliente. Lembre-se de também adicionar este email como usuário no
				Clerk do app.
			</p>
			<form
				action={formAction}
				className='flex flex-col gap-3'
			>
				<input
					type='email'
					name='email'
					required
					placeholder='cliente@email.com'
					className='rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500'
				/>
				<button
					type='submit'
					disabled={pending}
					className='rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950 disabled:opacity-60'
				>
					{pending ? 'Criando…' : 'Criar cliente'}
				</button>
			</form>
			{state.error ? (
				<p className='text-sm text-red-400'>{state.error}</p>
			) : null}
			{state.success ? (
				<p className='text-sm text-emerald-400'>{state.success}</p>
			) : null}
		</div>
	);
}
