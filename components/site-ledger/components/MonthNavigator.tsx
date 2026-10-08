import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MonthNavigator({
	label,
	monthOffset,
	onChangeMonthOffset,
	className = 'mb-5',
}: {
	label: string;
	monthOffset: number;
	onChangeMonthOffset: (updater: (offset: number) => number) => void;
	className?: string;
}) {
	return (
		<div className={`flex items-center justify-between ${className}`}>
			<button
				onClick={() => onChangeMonthOffset((o) => o - 1)}
				aria-label='Mês anterior'
				className='w-9 h-9 rounded-full flex items-center justify-center'
				style={{
					background: 'var(--bg-raised)',
					border: '1px solid var(--line)',
				}}>
				<ChevronLeft size={16} />
			</button>
			<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
				{label.toUpperCase()}
			</div>
			<button
				onClick={() => onChangeMonthOffset((o) => Math.min(0, o + 1))}
				disabled={monthOffset === 0}
				aria-label='Mês seguinte'
				className='w-9 h-9 rounded-full flex items-center justify-center'
				style={{
					background: 'var(--bg-raised)',
					border: '1px solid var(--line)',
					opacity: monthOffset === 0 ? 0.35 : 1,
				}}>
				<ChevronRight size={16} />
			</button>
		</div>
	);
}
