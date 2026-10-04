import { formatMoney } from '../utils';

export function BalanceCard({
	balance,
	monthIncome,
	monthExpense,
}: {
	balance: number;
	monthIncome: number;
	monthExpense: number;
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
				SALDO ATUAL
			</div>
			<div
				className='sl-display text-5xl mt-1'
				style={{
					color: balance < 0 ? 'var(--orange)' : 'var(--text)',
				}}>
				€{formatMoney(balance)}
			</div>
			<div
				className='flex gap-5 mt-4 pt-4'
				style={{ borderTop: '1px solid var(--line)' }}>
				<div>
					<div
						className='text-[10px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						RECEITA - ESTE MÊS
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
						DESPESA - ESTE MÊS
					</div>
					<div
						className='text-lg font-semibold mt-0.5'
						style={{ color: 'var(--orange)' }}>
						€{formatMoney(monthExpense)}
					</div>
				</div>
			</div>
		</div>
	);
}
