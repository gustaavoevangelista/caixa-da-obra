import Link from 'next/link';
import { pool } from '@/lib/db';

type UserRow = {
	id: string;
	email: string;
	company_name: string | null;
	created_at: string;
};

async function getUsers(): Promise<UserRow[]> {
	const { rows } = await pool.query(
		`SELECT u.id, u.email, p.company_name, u.created_at
		 FROM users u
		 LEFT JOIN profiles p ON p.user_id = u.id
		 ORDER BY u.created_at DESC`,
	);
	return rows;
}

export default async function AdminUsersPage() {
	const users = await getUsers();

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
						{users.map((user) => (
							<tr
								key={user.id}
								className='border-b border-slate-900 last:border-0'
							>
								<td className='px-4 py-3'>
									<Link
										href={`/admin/users/${user.id}`}
										className='text-slate-100 hover:underline'
									>
										{user.email}
									</Link>
								</td>
								<td className='px-4 py-3 text-slate-400'>
									{user.company_name || '—'}
								</td>
								<td className='px-4 py-3 text-slate-400'>
									{new Date(user.created_at).toLocaleDateString(
										'pt-BR',
									)}
								</td>
							</tr>
						))}
						{users.length === 0 ? (
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
