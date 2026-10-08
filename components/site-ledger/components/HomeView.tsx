import { Plus } from 'lucide-react';
import type { Project, Transaction } from '../types';
import { BalanceCard } from './BalanceCard';
import { MonthNavigator } from './MonthNavigator';
import { ProjectSelector } from './ProjectSelector';
import { TransactionList } from './TransactionList';

export function HomeView({
	monthLabel,
	monthOffset,
	onChangeMonthOffset,
	monthNet,
	monthIncome,
	monthExpense,
	totalBalance,
	projects,
	selectedProject,
	onSelectProject,
	onAddProject,
	onManageProjects,
	grouped,
	hasAnyTransactions,
	now,
	longPressId,
	deletingId,
	onRowClick,
	onStartLongPress,
	onCancelLongPress,
	onCancelDeleteConfirm,
	onConfirmDelete,
	onOpenSheet,
}: {
	monthLabel: string;
	monthOffset: number;
	onChangeMonthOffset: (updater: (offset: number) => number) => void;
	monthNet: number;
	monthIncome: number;
	monthExpense: number;
	totalBalance: number;
	projects: Project[];
	selectedProject: string;
	onSelectProject: (id: string) => void;
	onAddProject: () => void;
	onManageProjects: () => void;
	grouped: Array<{ key: string; dateStr: string; items: Transaction[] }>;
	hasAnyTransactions: boolean;
	now: Date;
	longPressId: string | null;
	deletingId: string | null;
	onRowClick: (t: Transaction) => void;
	onStartLongPress: (id: string) => void;
	onCancelLongPress: () => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (id: string) => void;
	onOpenSheet: () => void;
}) {
	return (
		<>
			<MonthNavigator
				label={monthLabel}
				monthOffset={monthOffset}
				onChangeMonthOffset={onChangeMonthOffset}
				className='mx-5 mb-4'
			/>

			<BalanceCard
				monthNet={monthNet}
				monthIncome={monthIncome}
				monthExpense={monthExpense}
				totalBalance={totalBalance}
			/>

			<ProjectSelector
				projects={projects}
				selectedProject={selectedProject}
				onSelect={onSelectProject}
				showActions
				onAddProject={onAddProject}
				onManage={onManageProjects}
			/>

			<TransactionList
				grouped={grouped}
				hasAnyTransactions={hasAnyTransactions}
				now={now}
				longPressId={longPressId}
				deletingId={deletingId}
				projects={projects}
				selectedProject={selectedProject}
				onRowClick={onRowClick}
				onStartLongPress={onStartLongPress}
				onCancelLongPress={onCancelLongPress}
				onCancelDeleteConfirm={onCancelDeleteConfirm}
				onConfirmDelete={onConfirmDelete}
			/>

			{/* FAB */}
			<button
				onClick={onOpenSheet}
				className='absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center shadow-lg'
				style={{
					width: 64,
					height: 64,
					background: 'var(--yellow)',
					boxShadow: '0 8px 24px rgba(244,196,48,0.35)',
				}}>
				<Plus size={28} color='#1c1b19' strokeWidth={2.5} />
			</button>
		</>
	);
}
