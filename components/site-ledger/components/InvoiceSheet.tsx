import { X } from 'lucide-react';
import { formatMoney } from '../utils';
import { Spinner } from './Spinner';

export function InvoiceSheet({
	total,
	clientName,
	onChangeClientName,
	clientNif,
	onChangeClientNif,
	description,
	onChangeDescription,
	invoiceError,
	submitting,
	onGenerate,
	onClose,
}: {
	total: number;
	clientName: string;
	onChangeClientName: (value: string) => void;
	clientNif: string;
	onChangeClientNif: (value: string) => void;
	description: string;
	onChangeDescription: (value: string) => void;
	invoiceError: string | null;
	submitting: boolean;
	onGenerate: () => void;
	onClose: () => void;
}) {
	return (
		<div className='absolute inset-0 z-20 flex flex-col justify-end sl-fade-enter'>
			<div
				className='absolute inset-0'
				style={{ background: 'rgba(0,0,0,0.55)' }}
				onClick={onClose}
			/>
			<div
				className='relative rounded-t-3xl p-5 pb-8 sl-sheet-enter'
				style={{
					background: 'var(--bg-raised)',
					border: '1px solid var(--line)',
					borderBottom: 'none',
					maxHeight: '92dvh',
					overflowY: 'auto',
					WebkitOverflowScrolling: 'touch',
				}}>
				<div className='flex items-center justify-between mb-4'>
					<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
						GERAR FATURA
					</div>
					<button
						onClick={onClose}
						className='w-8 h-8 rounded-full flex items-center justify-center'
						style={{ background: 'var(--bg-card)' }}>
						<X size={16} />
					</button>
				</div>

				<div className='text-center mb-4'>
					<div className='text-[10px] tracking-widest' style={{ color: 'var(--text-dim)' }}>
						TOTAL
					</div>
					<div className='sl-display text-4xl'>€{formatMoney(total)}</div>
				</div>

				<input
					value={clientName}
					onChange={(e) => onChangeClientName(e.target.value)}
					placeholder='Nome do cliente'
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-3 outline-none'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}
				/>
				<input
					value={clientNif}
					onChange={(e) => onChangeClientNif(e.target.value)}
					placeholder='NIF do cliente'
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-3 outline-none'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}
				/>
				<textarea
					value={description}
					onChange={(e) => onChangeDescription(e.target.value)}
					placeholder='Descrição do trabalho realizado'
					rows={3}
					className='w-full rounded-lg px-3 py-2.5 text-sm mb-3 outline-none resize-none'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}
				/>

				{invoiceError && (
					<div className='text-xs mb-3 text-center' style={{ color: 'var(--orange)' }}>
						{invoiceError}
					</div>
				)}

				<button
					onClick={onGenerate}
					disabled={submitting}
					className='w-full rounded-xl py-3.5 text-sm font-bold tracking-widest flex items-center justify-center gap-2'
					style={{
						background: 'var(--yellow)',
						color: '#1c1b19',
						opacity: submitting ? 0.6 : 1,
						cursor: submitting ? 'not-allowed' : 'pointer',
					}}>
					{submitting && <Spinner />}
						{submitting ? 'GERANDO…' : 'GERAR E IMPRIMIR'}
				</button>
			</div>
		</div>
	);
}
