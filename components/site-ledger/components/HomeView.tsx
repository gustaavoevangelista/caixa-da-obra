import { Plus } from 'lucide-react';
import type { Project, Transaction } from '../types';
import { BalanceCard } from './BalanceCard';
import { ProjectSelector } from './ProjectSelector';
import { TransactionList } from './TransactionList';

export function HomeView({
	balance,
	monthIncome,
	monthExpense,
	projects,
	selectedProject,
	onSelectProject,
	onAddProject,
	onManageProjects,
	grouped,
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
	balance: number;
	monthIncome: number;
	monthExpense: number;
	projects: Project[];
	selectedProject: string;
	onSelectProject: (id: string) => void;
	onAddProject: () => void;
	onManageProjects: () => void;
	grouped: Array<{ key: string; dateStr: string; items: Transaction[] }>;
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
			<BalanceCard
				balance={balance}
				monthIncome={monthIncome}
				monthExpense={monthExpense}
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
