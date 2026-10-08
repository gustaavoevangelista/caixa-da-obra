import type { ExportReportMode } from '../../export-options';
import type { ReportData } from '../../reporting';
import type { Project } from '../types';
import { formatMoney } from '../utils';
import { CategoryBarList } from './CategoryBarList';
import { ExportMenuButton } from './ExportMenuButton';
import { MonthNavigator } from './MonthNavigator';
import { ProjectSelector } from './ProjectSelector';

export function ReportsView({
	monthLabel,
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
	monthLabel: string;
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
			<MonthNavigator
				label={monthLabel}
				monthOffset={monthOffset}
				onChangeMonthOffset={onChangeMonthOffset}
			/>

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
