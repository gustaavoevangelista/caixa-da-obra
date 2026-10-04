import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExportReportMode } from '../../export-options';
import type { ReportData } from '../../reporting';
import type { Project } from '../types';
import { formatMoney } from '../utils';
import { CategoryBarList } from './CategoryBarList';
import { ExportMenuButton } from './ExportMenuButton';
import { ProjectSelector } from './ProjectSelector';

export function ReportsView({
	reportMonthDate,
	monthOffset,
	onChangeMonthOffset,
	projects,
	selectedProject,
	onSelectProject,
	onAddProject,
	onManageProjects,
	exportMenuOpen,
	onToggleExportMenu,
	onExport,
	exportError,
	reportData,
}: {
	reportMonthDate: Date;
	monthOffset: number;
	onChangeMonthOffset: (updater: (offset: number) => number) => void;
	projects: Project[];
	selectedProject: string;
	onSelectProject: (id: string) => void;
	onAddProject: () => void;
	onManageProjects: () => void;
	exportMenuOpen: boolean;
	onToggleExportMenu: () => void;
	onExport: (mode: ExportReportMode) => void;
	exportError: boolean;
	reportData: ReportData;
}) {
	return (
		<div className='flex-1 overflow-y-auto sl-scrollbar-none px-5 pb-10 sl-fade-enter'>
			<div className='flex items-center justify-between mb-5'>
				<button
					onClick={() => onChangeMonthOffset((o) => o - 1)}
					className='w-9 h-9 rounded-full flex items-center justify-center'
					style={{
						background: 'var(--bg-raised)',
						border: '1px solid var(--line)',
					}}>
					<ChevronLeft size={16} />
				</button>
				<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
					{reportMonthDate
						.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
						.toUpperCase()}
				</div>
				<button
					onClick={() => onChangeMonthOffset((o) => Math.min(0, o + 1))}
					disabled={monthOffset === 0}
					className='w-9 h-9 rounded-full flex items-center justify-center'
					style={{
						background: 'var(--bg-raised)',
						border: '1px solid var(--line)',
						opacity: monthOffset === 0 ? 0.35 : 1,
					}}>
					<ChevronRight size={16} />
				</button>
			</div>

			<div className='-mx-5'>
				<ProjectSelector
					projects={projects}
					selectedProject={selectedProject}
					onSelect={onSelectProject}
					showActions={false}
					onAddProject={onAddProject}
					onManage={onManageProjects}
				/>
			</div>

			<ExportMenuButton
				exportMenuOpen={exportMenuOpen}
				onToggleMenu={onToggleExportMenu}
				onExport={onExport}
				exportError={exportError}
			/>

			<div className='grid grid-cols-3 gap-2 mb-6'>
				<div
					className='rounded-xl p-3'
					style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
					<div
						className='text-[9px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						RECEITA
					</div>
					<div className='text-base font-semibold mt-1' style={{ color: 'var(--green)' }}>
						€{formatMoney(reportData.income)}
					</div>
				</div>
				<div
					className='rounded-xl p-3'
					style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
					<div
						className='text-[9px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						DESPESA
					</div>
					<div className='text-base font-semibold mt-1' style={{ color: 'var(--orange)' }}>
						€{formatMoney(reportData.expense)}
					</div>
				</div>
				<div
					className='rounded-xl p-3'
					style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
					<div
						className='text-[9px] tracking-widest'
						style={{ color: 'var(--text-dim)' }}>
						SALDO LÍQUIDO
					</div>
					<div
						className='text-base font-semibold mt-1'
						style={{ color: reportData.net < 0 ? 'var(--orange)' : 'var(--text)' }}>
						€{formatMoney(reportData.net)}
					</div>
				</div>
			</div>

			<CategoryBarList
				title='RECEITA POR CATEGORIA'
				emptyMessage='Sem receitas registradas para este mês.'
				items={reportData.incomeCatArr}
				max={reportData.maxIncomeCat}
				barColor='var(--green)'
				listClassName='space-y-3 mb-6'
			/>

			<CategoryBarList
				title='DESPESAS POR CATEGORIA'
				emptyMessage='Sem despesas registradas para este mês.'
				items={reportData.catArr}
				max={reportData.maxCat}
				barColor='var(--orange)'
				listClassName='space-y-3 mb-4'
			/>

			<div
				className='text-[11px] tracking-widest mt-6'
				style={{ color: 'var(--text-dim)' }}>
				{reportData.count} {reportData.count === 1 ? 'ENTRADA' : 'ENTRADAS'} ESTE
				MÊS
			</div>
		</div>
	);
}
