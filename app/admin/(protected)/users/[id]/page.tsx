import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { profiles, projects, transactions, users } from '@/lib/schema';
import { ToggleActiveButton } from './toggle-active-button';
import { TogglePremiumButton } from './toggle-premium-button';

type Params = { id: string };

async function getUser(id: string) {
	const [row] = await db
		.select({
			id: users.id,
			email: users.email,
			isActive: users.isActive,
			isPremiumUser: users.isPremiumUser,
			createdAt: users.createdAt,
			companyName: profiles.companyName,
			selectedProject: profiles.selectedProject,
		})
		.from(users)
		.leftJoin(profiles, eq(profiles.userId, users.id))
		.where(eq(users.id, id));
	return row ?? null;
}

async function getProjects(userId: string) {
	return db
		.select({
			id: projects.id,
			name: projects.name,
			status: projects.status,
			createdAt: projects.createdAt,
		})
		.from(projects)
		.where(eq(projects.userId, userId))
		.orderBy(projects.position);
}

async function getRecentTransactions(userId: string) {
	return db
		.select({
			id: transactions.id,
			type: transactions.type,
			amount: transactions.amount,
			categoryLabel: transactions.categoryLabel,
			description: transactions.description,
			projectId: transactions.projectId,
			createdAt: transactions.createdAt,
		})
		.from(transactions)
		.where(eq(transactions.userId, userId))
		.orderBy(desc(transactions.createdAt))
		.limit(50);
}

export default async function AdminUserDetailPage({
	params,
}: {
	params: Promise<Params>;
}) {
	const { id } = await params;
	const user = await getUser(id);
	if (!user) notFound();

	const [projectRows, transactionRows] = await Promise.all([
		getProjects(id),
		getRecentTransactions(id),
	]);

	return (
		<div className='flex flex-col gap-8'>
			<div className='flex items-start justify-between gap-4'>
				<div>
					<h1 className='text-lg font-semibold text-slate-100'>
						{user.email}
					</h1>
					<p className='text-sm text-slate-400'>
						Empresa: {user.companyName || '—'} · Cliente desde{' '}
						{user.createdAt.toLocaleDateString('pt-PT')}
					</p>
				</div>
			</div>

			<div className='flex items-center gap-2'>
				<TogglePremiumButton
					userId={user.id}
					isPremiumUser={user.isPremiumUser}
				/>
				<ToggleActiveButton userId={user.id} isActive={user.isActive} />
			</div>

			<section className='flex flex-col gap-3'>
				<h2 className='text-sm font-semibold text-slate-100'>
					Obras ({projectRows.length})
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
							{projectRows.map((project) => (
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
							{projectRows.length === 0 ? (
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
							{transactionRows.map((tx) => (
								<tr
									key={tx.id}
									className='border-b border-slate-900 last:border-0'
								>
									<td className='px-4 py-3 text-slate-400'>
										{tx.createdAt.toLocaleDateString('pt-PT')}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.type === 'income' ? 'Entrada' : 'Saída'}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.categoryLabel}
									</td>
									<td className='px-4 py-3 text-slate-400'>
										{tx.description || '—'}
									</td>
									<td className='px-4 py-3 text-right text-slate-100'>
										{Number(tx.amount).toLocaleString('pt-PT', {
											style: 'currency',
											currency: 'EUR',
										})}
									</td>
								</tr>
							))}
							{transactionRows.length === 0 ? (
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
