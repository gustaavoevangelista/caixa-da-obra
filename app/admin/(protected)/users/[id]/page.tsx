import { notFound } from 'next/navigation';
import { pool } from '@/lib/db';

type Params = { id: string };

async function getUser(id: string) {
	const { rows } = await pool.query(
		`SELECT u.id, u.email, u.created_at, p.company_name, p.selected_project
		 FROM users u
		 LEFT JOIN profiles p ON p.user_id = u.id
		 WHERE u.id = $1`,
		[id],
	);
	return rows[0] ?? null;
}

async function getProjects(userId: string) {
	const { rows } = await pool.query(
		`SELECT id, name, status, created_at
		 FROM projects
		 WHERE user_id = $1
		 ORDER BY position ASC`,
		[userId],
	);
	return rows;
}

async function getRecentTransactions(userId: string) {
	const { rows } = await pool.query(
		`SELECT id, type, amount, category_label, description, project_id, created_at
		 FROM transactions
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 50`,
		[userId],
	);
	return rows;
}

export default async function AdminUserDetailPage({
	params,
}: {
	params: Promise<Params>;
}) {
	const { id } = await params;
	const user = await getUser(id);
	if (!user) notFound();

	const [projects, transactions] = await Promise.all([
		getProjects(id),
		getRecentTransactions(id),
	]);

	return (
		<div className='flex flex-col gap-8'>
			<div>
				<h1 className='text-lg font-semibold text-slate-100'>
					{user.email}
				</h1>
				<p className='text-sm text-slate-400'>
					Empresa: {user.company_name || '—'} · Cliente desde{' '}
					{new Date(user.created_at).toLocaleDateString('pt-BR')}
				</p>
			</div>

			<section className='flex flex-col gap-3'>
				<h2 className='text-sm font-semibold text-slate-100'>
					Obras ({projects.length})
				</h2>
				<div className='overflow-x-auto rounded-lg border border-slate-800'>
					<table className='w-full text-left text-sm'>
						<thead className='border-b border-slate-800 text-slate-400'>
							<tr>
								<th className='px-4 py-3 font-medium'>Nome</th>
								<th className='px-4 py-3 font-medium'>Status</th>
							</tr>
						</thead>
						<tbody>
							{projects.map((project) => (
								<tr
									key={project.id}
									className='border-b border-slate-900 last:border-0'
								>
									<td className='px-4 py-3 text-slate-100'>
										{project.name}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{project.status}
									</td>
								</tr>
							))}
							{projects.length === 0 ? (
								<tr>
									<td
										colSpan={2}
										className='px-4 py-6 text-center text-slate-500'
									>
										Nenhuma obra cadastrada.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</section>

			<section className='flex flex-col gap-3'>
				<h2 className='text-sm font-semibold text-slate-100'>
					Transações recentes
				</h2>
				<div className='overflow-x-auto rounded-lg border border-slate-800'>
					<table className='w-full text-left text-sm'>
						<thead className='border-b border-slate-800 text-slate-400'>
							<tr>
								<th className='px-4 py-3 font-medium'>Data</th>
								<th className='px-4 py-3 font-medium'>Tipo</th>
								<th className='px-4 py-3 font-medium'>Categoria</th>
								<th className='px-4 py-3 font-medium'>Descrição</th>
								<th className='px-4 py-3 text-right font-medium'>
									Valor
								</th>
							</tr>
						</thead>
						<tbody>
							{transactions.map((tx) => (
								<tr
									key={tx.id}
									className='border-b border-slate-900 last:border-0'
								>
									<td className='px-4 py-3 text-slate-400'>
										{new Date(tx.created_at).toLocaleDateString(
											'pt-BR',
										)}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.type === 'income' ? 'Entrada' : 'Saída'}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.category_label}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.description || '—'}
									</td>
									<td className='px-4 py-3 text-right text-slate-100'>
										{Number(tx.amount).toLocaleString('pt-BR', {
											style: 'currency',
											currency: 'BRL',
										})}
									</td>
								</tr>
							))}
							{transactions.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className='px-4 py-6 text-center text-slate-500'
									>
										Nenhuma transação registrada.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
