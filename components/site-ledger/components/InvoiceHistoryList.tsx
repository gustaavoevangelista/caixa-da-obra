import type { InvoiceSummary } from '../types';
import { formatMoney } from '../utils';

export function InvoiceHistoryList({
	invoices,
	onOpenInvoice,
}: {
	invoices: InvoiceSummary[];
	onOpenInvoice: (id: string) => void;
}) {
	if (invoices.length === 0) {
		return (
			<div className='text-xs' style={{ color: 'var(--text-dim)' }}>
				Nenhuma fatura gerada ainda.
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			{invoices.map((inv) => (
				<button
					key={inv.id}
					onClick={() => onOpenInvoice(inv.id)}
					className='w-full flex items-center justify-between px-4 py-3 rounded-xl text-left'
					style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
					<div>
						<div className='text-sm'>
							Fatura #{inv.number} · {inv.clientName}
						</div>
						<div className='text-[10px]' style={{ color: 'var(--text-dim)' }}>
							{new Date(inv.issuedAt).toLocaleDateString('pt-PT')}
						</div>
					</div>
					<div className='text-sm font-semibold' style={{ color: 'var(--green)' }}>
						€{formatMoney(inv.total)}
					</div>
				</button>
			))}
		</div>
	);
}
