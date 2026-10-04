'use client';

import { useTransition } from 'react';
import { toggleUserPremiumAction } from './actions';

export function TogglePremiumButton({
	userId,
	isPremiumUser,
}: {
	userId: string;
	isPremiumUser: boolean;
}) {
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type='button'
			disabled={isPending}
			onClick={() =>
				startTransition(() =>
					toggleUserPremiumAction(userId, !isPremiumUser),
				)
			}
			className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
				isPremiumUser
					? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60'
					: 'bg-slate-800 text-slate-300 hover:bg-slate-700'
			}`}
		>
			{isPremiumUser ? 'Premium · remover' : 'Padrão · tornar premium'}
		</button>
	);
}
