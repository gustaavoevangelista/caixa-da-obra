import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';

export function AdminNav() {
	return (
		<nav className='flex items-center justify-between border-b border-slate-800 px-6 py-4'>
			<div className='flex items-center gap-6'>
				<Link
					href='/admin'
					className='text-sm font-semibold text-slate-100'
				>
					Flux Finance — Admin
				</Link>
				<Link
					href='/admin/users'
					className='text-sm text-slate-400 hover:text-slate-100'
				>
					Clientes
				</Link>
				<Link
					href='/admin/create-user'
					className='text-sm text-slate-400 hover:text-slate-100'
				>
					Novo cliente
				</Link>
			</div>
			<SignOutButton redirectUrl='/admin/sign-in'>
				<button className='text-sm text-slate-400 hover:text-slate-100'>
					Sair
				</button>
			</SignOutButton>
		</nav>
	);
}
