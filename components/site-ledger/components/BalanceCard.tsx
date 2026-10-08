import { formatMoney } from '../utils';

export function BalanceCard({
	monthNet,
	monthIncome,
	monthExpense,
	totalBalance,
}: {
	monthNet: number;
	monthIncome: number;
	monthExpense: number;
	totalBalance: number;
}) {
	return (
		<div
			className='mx-5 rounded-2xl p-5 mb-5'
			style={{
				background: 'var(--bg-card)',
				border: '1px solid var(--line)',
			}}>
			<div
				className='text-[11px] tracking-widest'
				style={{ color: 'var(--text-dim)' }}>
				SALDO DO MÊS
			</div>
			<div
				className='sl-display text-5xl mt-1'
				style={{
					color: monthNet < 0 ? 'var(--orange)' : 'var(--text)',
				}}>
				€{formatMoney(monthNet)}
			</div>
			<div
				className='flex gap-5 mt-4 pt-4'
				style={{ borderTop: '1px solid var(--line)' }}>
				<div>
					<div
						className='text-[10px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						RECEITA
					</div>
					<div
						className='text-lg font-semibold mt-0.5'
						style={{ color: 'var(--green)' }}>
						€{formatMoney(monthIncome)}
					</div>
				</div>
				<div>
					<div
						className='text-[10px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						DESPESA
					</div>
					<div
						className='text-lg font-semibold mt-0.5'
						style={{ color: 'var(--orange)' }}>
						€{formatMoney(monthExpense)}
					</div>
				</div>
			</div>
			<div
				className='flex items-baseline justify-between mt-4 pt-3'
				style={{ borderTop: '1px solid var(--line)' }}>
				<div
					className='text-[10px] tracking-widest'
					style={{ color: 'var(--text-dim)' }}>
					SALDO TOTAL
				</div>
				<div
					className='text-sm font-semibold'
					style={{
						color: totalBalance < 0 ? 'var(--orange)' : 'var(--text)',
					}}>
					€{formatMoney(totalBalance)}
				</div>
			</div>
		</div>
	);
}
