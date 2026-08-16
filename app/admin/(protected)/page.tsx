import Link from 'next/link';

export default function AdminHomePage() {
	return (
		<div className='flex flex-col gap-4'>
			<h1 className='text-lg font-semibold text-slate-100'>
				Painel de administração
			</h1>
			<div className='flex gap-4'>
				<Link
					href='/admin/users'
					className='rounded-lg border border-slate-800 px-4 py-3 text-sm text-slate-100 hover:bg-slate-900'
				>
					Ver clientes
				</Link>
				<Link
					href='/admin/create-user'
					className='rounded-lg border border-slate-800 px-4 py-3 text-sm text-slate-100 hover:bg-slate-900'
				>
					Cadastrar cliente
				</Link>
			</div>
		</div>
	);
}
