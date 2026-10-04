import { Flag, RotateCcw, Trash2 } from 'lucide-react';
import type { Project } from '../types';

export function ManageProjectsSection({
	projects,
	manageConfirmId,
	onRequestDeleteConfirm,
	onCancelDeleteConfirm,
	onConfirmDelete,
	onToggleEnd,
}: {
	projects: Project[];
	manageConfirmId: string | null;
	onRequestDeleteConfirm: (id: string) => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (id: string) => void;
	onToggleEnd: (id: string) => void;
}) {
	return (
		<div className='space-y-2'>
			{projects.map((p) => (
				<div
					key={p.id}
					className='rounded-xl overflow-hidden'
					style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
					{manageConfirmId === p.id ? (
						<div className='flex items-center justify-between px-4 py-3'>
							<span className='text-xs' style={{ color: 'var(--text-dim)' }}>
								Excluir "{p.name}"? As entradas permanecerão em Geral.
							</span>
							<div className='flex gap-2 shrink-0 ml-2'>
								<button
									onClick={onCancelDeleteConfirm}
									className='text-xs px-3 py-1.5 rounded-md'
									style={{ background: 'var(--bg-raised)', color: 'var(--text)' }}>
									Cancelar
								</button>
								<button
									onClick={() => onConfirmDelete(p.id)}
									className='text-xs px-3 py-1.5 rounded-md'
									style={{ background: 'var(--orange)', color: '#1c1b19' }}>
									Excluir
								</button>
							</div>
						</div>
					) : (
						<div className='flex items-center justify-between px-4 py-3'>
							<div className='min-w-0'>
								<div className='text-sm truncate'>{p.name}</div>
								<div
									className='text-[10px]'
									style={{
										color: p.status === 'ended' ? 'var(--text-dim)' : 'var(--green)',
									}}>
									{p.status === 'ended' ? 'ENDED' : 'ACTIVE'}
								</div>
							</div>
							<div className='flex gap-2 shrink-0 ml-2'>
								<button
									onClick={() => onToggleEnd(p.id)}
									className='w-8 h-8 rounded-lg flex items-center justify-center'
									style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)' }}
									title={p.status === 'ended' ? 'Reactivate' : 'End project'}>
									{p.status === 'ended' ? (
										<RotateCcw size={14} color='var(--text-dim)' />
									) : (
										<Flag size={14} color='var(--text-dim)' />
									)}
								</button>
								<button
									onClick={() => onRequestDeleteConfirm(p.id)}
									className='w-8 h-8 rounded-lg flex items-center justify-center'
									style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)' }}
									title='Excluir projeto'>
									<Trash2 size={14} color='var(--orange)' />
								</button>
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
