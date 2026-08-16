import { SignOutButton } from '@clerk/nextjs';

export function NotAuthorized({ email }: { email: string | null }) {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center'>
			<h1 className='text-xl font-semibold text-slate-100'>
				Não autorizado
			</h1>
			<p className='max-w-sm text-sm text-slate-400'>
				{email
					? `A conta ${email} não tem acesso ao painel de administração.`
					: 'Esta conta não tem acesso ao painel de administração.'}
			</p>
			<SignOutButton redirectUrl='/admin/sign-in'>
				<button className='rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-900'>
					Sair
				</button>
			</SignOutButton>
		</div>
	);
}
