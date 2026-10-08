import type { Project, Transaction } from '../types';
import { dayLabel } from '../utils';
import { TransactionRow } from './TransactionRow';

export function TransactionList({
	grouped,
	hasAnyTransactions,
	now,
	longPressId,
	deletingId,
	projects,
	selectedProject,
	onRowClick,
	onStartLongPress,
	onCancelLongPress,
	onCancelDeleteConfirm,
	onConfirmDelete,
}: {
	grouped: Array<{ key: string; dateStr: string; items: Transaction[] }>;
	// Whether the scope has entries in any month — picks the empty-state copy.
	hasAnyTransactions: boolean;
	now: Date;
	longPressId: string | null;
	deletingId: string | null;
	projects: Project[];
	selectedProject: string;
	onRowClick: (t: Transaction) => void;
	onStartLongPress: (id: string) => void;
	onCancelLongPress: () => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (id: string) => void;
}) {
	return (
		<div className='flex-1 overflow-y-auto sl-scrollbar-none px-5 pb-32'>
			{grouped.length === 0 ? (
				<div className='text-center mt-16 px-6'>
					<div className='sl-display text-2xl' style={{ color: 'var(--text-dim)' }}>
						{hasAnyTransactions ? 'SEM ENTRADAS NESTE MÊS' : 'SEM ENTRADAS AINDA'}
					</div>
					{!hasAnyTransactions && (
						<div className='text-xs mt-2' style={{ color: 'var(--text-dim)' }}>
							TOQUE NO BOTÃO AMARELO PARA ADICIONAR UMA DESPESA OU RECEITA
						</div>
					)}
				</div>
			) : (
				grouped.map((g) => (
					<div key={g.key} className='mb-5'>
						<div
							className='text-[10px] tracking-widest mb-2'
							style={{ color: 'var(--text-dim)' }}>
							{dayLabel(g.dateStr, now)}
						</div>
						<div
							className='rounded-xl overflow-hidden'
							style={{ border: '1px solid var(--line)' }}>
							{g.items.map((t, i) => (
								<div key={t.id}>
									<TransactionRow
										t={t}
										isFirst={i === 0}
										isConfirmingDelete={longPressId === t.id}
										isDeleting={deletingId === t.id}
										isAnyDeleting={deletingId !== null}
										projects={projects}
										selectedProject={selectedProject}
										onRowClick={onRowClick}
										onStartLongPress={onStartLongPress}
										onCancelLongPress={onCancelLongPress}
										onCancelDeleteConfirm={onCancelDeleteConfirm}
										onConfirmDelete={onConfirmDelete}
									/>
								</div>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
}
