import { formatMoney } from '../utils';

export function InvoiceSelectionBar({
	total,
	onGenerate,
}: {
	total: number;
	onGenerate: () => void;
}) {
	return (
		<div
			className='absolute bottom-0 left-0 right-0 flex justify-center px-5 pb-6 pt-4'
			style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>
			<div className='w-full flex items-center gap-3'>
				<div className='flex-1'>
					<div
						className='text-[10px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						TOTAL SELECIONADO
					</div>
					<div className='text-lg font-semibold'>€{formatMoney(total)}</div>
				</div>
				<button
					onClick={onGenerate}
					className='rounded-xl px-5 py-3 text-xs font-bold tracking-widest'
					style={{ background: 'var(--yellow)', color: '#1c1b19' }}>
					GERAR FATURA
				</button>
			</div>
		</div>
	);
}
