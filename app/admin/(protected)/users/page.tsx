import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { profiles, users } from '@/lib/schema';

async function getUsers() {
	return db
		.select({
			id: users.id,
			email: users.email,
			companyName: profiles.companyName,
			createdAt: users.createdAt,
		})
		.from(users)
		.leftJoin(profiles, eq(profiles.userId, users.id))
		.orderBy(desc(users.createdAt));
}

export default async function AdminUsersPage() {
	const rows = await getUsers();

	return (
		<div className='flex flex-col gap-4'>
			<h1 className='text-lg font-semibold text-slate-100'>Clientes</h1>
			<div className='overflow-x-auto rounded-lg border border-slate-800'>
				<table className='w-full text-left text-sm'>
					<thead className='border-b border-slate-800 text-slate-400'>
						<tr>
							<th className='px-4 py-3 font-medium'>Email</th>
							<th className='px-4 py-3 font-medium'>Empresa</th>
							<th className='px-4 py-3 font-medium'>Criado em</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.id}
								className='border-b border-slate-900 last:border-0'
							>
								<td className='px-4 py-3'>
									<Link
										href={`/admin/users/${row.id}`}
										className='text-slate-100 hover:underline'
									>
										{row.email}
									</Link>
								</td>
								<td className='px-4 py-3 text-slate-400'>
									{row.companyName || '—'}
								</td>
								<td className='px-4 py-3 text-slate-400'>
									{row.createdAt.toLocaleDateString('pt-BR')}
								</td>
							</tr>
						))}
						{rows.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className='px-4 py-6 text-center text-slate-500'
								>
									Nenhum cliente cadastrado ainda.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	);
}
