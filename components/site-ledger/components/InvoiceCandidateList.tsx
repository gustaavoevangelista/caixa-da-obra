import type { Transaction } from '../types';
import { formatMoney } from '../utils';

export function InvoiceCandidateList({
	candidates,
	selection,
	onToggle,
}: {
	candidates: Transaction[];
	selection: Set<string>;
	onToggle: (id: string) => void;
}) {
	if (candidates.length === 0) {
		return (
			<div className='text-xs' style={{ color: 'var(--text-dim)' }}>
				Sem receitas disponíveis para faturar.
			</div>
		);
	}

	return (
		<div className='space-y-2 mb-24'>
			{candidates.map((t) => (
				<button
					key={t.id}
					onClick={() => onToggle(t.id)}
					className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left'
					style={{
						background: selection.has(t.id)
							? 'rgba(244,196,48,0.14)'
							: 'var(--bg-card)',
						border:
							'1px solid ' +
							(selection.has(t.id) ? 'var(--yellow)' : 'var(--line)'),
					}}>
					<div
						className='w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold'
						style={{
							background: selection.has(t.id) ? 'var(--yellow)' : 'transparent',
							color: '#1c1b19',
							border:
								'1px solid ' +
								(selection.has(t.id) ? 'var(--yellow)' : 'var(--line)'),
						}}>
						{selection.has(t.id) ? '✓' : ''}
					</div>
					<div className='flex-1 min-w-0'>
						<div className='text-sm truncate'>
							{t.description || t.categoryLabel}
						</div>
						<div className='text-[10px]' style={{ color: 'var(--text-dim)' }}>
							{new Date(t.createdAt).toLocaleDateString('pt-PT')}
						</div>
					</div>
					<div
						className='text-sm font-semibold shrink-0'
						style={{ color: 'var(--green)' }}>
						€{formatMoney(t.amount)}
					</div>
				</button>
			))}
		</div>
	);
}
