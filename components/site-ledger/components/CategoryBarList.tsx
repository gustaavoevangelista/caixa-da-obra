import type { ReportCategoryTotal } from '../../reporting';
import { formatMoney } from '../utils';

export function CategoryBarList({
	title,
	emptyMessage,
	items,
	max,
	barColor,
	listClassName,
}: {
	title: string;
	emptyMessage: string;
	items: ReportCategoryTotal[];
	max: number;
	barColor: string;
	listClassName: string;
}) {
	return (
		<>
			<div
				className='text-[11px] tracking-widest mb-3'
				style={{ color: 'var(--text-dim)' }}>
				{title}
			</div>
			{items.length === 0 ? (
				<div className='text-xs mb-4' style={{ color: 'var(--text-dim)' }}>
					{emptyMessage}
				</div>
			) : (
				<div className={listClassName}>
					{items.map((c) => (
						<div key={c.label}>
							<div className='flex justify-between text-xs mb-1'>
								<span>{c.label}</span>
								<span style={{ color: 'var(--text-dim)' }}>
									€{formatMoney(c.total)}
								</span>
							</div>
							<div
								className='h-2 rounded-full overflow-hidden'
								style={{ background: 'var(--bg-raised)' }}>
								<div
									className='h-full rounded-full'
									style={{
										width: `${(c.total / max) * 100}%`,
										background: barColor,
									}}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
