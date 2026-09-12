'use client';

import { useTransition } from 'react';
import { toggleUserActiveAction } from './actions';

export function ToggleActiveButton({
	userId,
	isActive,
}: {
	userId: string;
	isActive: boolean;
}) {
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type='button'
			disabled={isPending}
			onClick={() =>
				startTransition(() => toggleUserActiveAction(userId, !isActive))
			}
			className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
				isActive
					? 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60'
					: 'bg-red-900/40 text-red-300 hover:bg-red-900/60'
			}`}
		>
			{isActive ? 'Ativo · desativar' : 'Inativo · ativar'}
		</button>
	);
}
