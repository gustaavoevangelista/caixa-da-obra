import { Camera } from 'lucide-react';
import { GENERAL, type Project, type Transaction } from '../types';
import { formatMoney } from '../utils';
import { Spinner } from './Spinner';

export function TransactionRow({
	t,
	isFirst,
	isConfirmingDelete,
	isDeleting,
	isAnyDeleting,
	projects,
	selectedProject,
	onRowClick,
	onStartLongPress,
	onCancelLongPress,
	onCancelDeleteConfirm,
	onConfirmDelete,
}: {
	t: Transaction;
	isFirst: boolean;
	isConfirmingDelete: boolean;
	isDeleting: boolean;
	isAnyDeleting: boolean;
	projects: Project[];
	selectedProject: string;
	onRowClick: (t: Transaction) => void;
	onStartLongPress: (id: string) => void;
	onCancelLongPress: () => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (id: string) => void;
}) {
	if (isConfirmingDelete) {
		return (
			<div
				className='flex items-center justify-between px-4 py-3'
				style={{ background: 'var(--bg-raised)' }}>
				<span className='text-xs' style={{ color: 'var(--text-dim)' }}>
					Excluir esta entrada?
				</span>
				<div className='flex gap-2'>
					<button
						onClick={onCancelDeleteConfirm}
						disabled={isDeleting}
						className='text-xs px-3 py-1.5 rounded-md'
						style={{
							background: 'var(--bg-card)',
							color: 'var(--text)',
							opacity: isDeleting ? 0.6 : 1,
						}}>
						Cancelar
					</button>
					<button
						onClick={() => onConfirmDelete(t.id)}
						disabled={isAnyDeleting}
						className='text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5'
						style={{
							background: 'var(--orange)',
							color: '#1c1b19',
							opacity: isAnyDeleting ? 0.6 : 1,
							cursor: isAnyDeleting ? 'not-allowed' : 'pointer',
						}}>
						{isDeleting && <Spinner size={12} />}
						Excluir
					</button>
				</div>
			</div>
		);
	}

	return (
		<button
			onClick={() => onRowClick(t)}
			onPointerDown={() => onStartLongPress(t.id)}
			onPointerUp={onCancelLongPress}
			onPointerLeave={onCancelLongPress}
			onPointerCancel={onCancelLongPress}
			className='w-full flex items-center gap-3 px-4 py-3 text-left sl-row-enter select-none'
			style={{
				background: 'var(--bg-card)',
				borderTop: isFirst ? 'none' : '1px solid var(--line)',
				WebkitUserSelect: 'none',
				WebkitTouchCallout: 'none',
			}}>
			<div
				className='w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold'
				style={{
					background:
						t.type === 'income'
							? 'rgba(159,209,58,0.14)'
							: 'rgba(255,107,53,0.14)',
					color: t.type === 'income' ? 'var(--green)' : 'var(--orange)',
				}}>
				{t.categoryTag}
			</div>
			<div className='flex-1 min-w-0'>
				<div className='text-sm truncate'>
					{t.description || t.categoryLabel}
				</div>
				<div
					className='text-[10px] truncate'
					style={{ color: 'var(--text-dim)' }}>
					{t.description ? t.categoryLabel + ' · ' : ''}
					{new Date(t.createdAt).toLocaleTimeString('en-GB', {
						hour: '2-digit',
						minute: '2-digit',
					})}
					{selectedProject === GENERAL && t.projectId
						? ' · ' +
							(projects.find((p) => p.id === t.projectId)?.name || 'Projeto')
						: ''}
				</div>
			</div>
			{t.photo && (
				<div
					className='w-6 h-6 rounded-full flex items-center justify-center shrink-0'
					style={{ background: 'var(--bg-raised)' }}>
					<Camera size={12} color='var(--text-dim)' />
				</div>
			)}
			<div
				className='text-sm font-semibold shrink-0'
				style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--orange)' }}>
				{t.type === 'income' ? '+' : '−'}€{formatMoney(t.amount)}
			</div>
		</button>
	);
}
