import {
	EXPORT_REPORT_LABEL,
	EXPORT_REPORT_OPTIONS,
	type ExportReportMode,
} from '../../export-options';

export function ExportMenuButton({
	exportMenuOpen,
	onToggleMenu,
	onExport,
	exportError,
}: {
	exportMenuOpen: boolean;
	onToggleMenu: () => void;
	onExport: (mode: ExportReportMode) => void;
	exportError: boolean;
}) {
	return (
		<>
			<div className='relative mb-4'>
				<button
					onClick={onToggleMenu}
					className='w-full rounded-lg px-3 py-3 text-[11px] font-semibold tracking-widest'
					style={{ background: 'var(--yellow)', color: '#1c1b19' }}>
					{EXPORT_REPORT_LABEL}
				</button>
				{exportMenuOpen && (
					<div
						className='absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg'
						style={{
							background: 'var(--bg-raised)',
							border: '1px solid var(--line)',
							boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
						}}>
						{EXPORT_REPORT_OPTIONS.map((option) => (
							<button
								key={option.mode}
								onClick={() => onExport(option.mode)}
								className='w-full px-4 py-3 text-left text-xs font-semibold'
								style={{
									color: 'var(--text)',
									borderBottom:
										option.mode === 'week' || option.mode === 'month'
											? '1px solid var(--line)'
											: 'none',
								}}>
								{option.label}
							</button>
						))}
					</div>
				)}
			</div>
			{exportError && (
				<div className='text-xs mb-4' style={{ color: 'var(--orange)' }}>
					Nao foi possivel abrir a janela de impressao. Permita pop-ups
					para exportar o PDF.
				</div>
			)}
		</>
	);
}
