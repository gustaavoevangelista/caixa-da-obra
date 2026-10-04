import type { InvoiceSummary, Project, Transaction } from '../types';
import { InvoiceCandidateList } from './InvoiceCandidateList';
import { InvoiceHistoryList } from './InvoiceHistoryList';
import { InvoiceSelectionBar } from './InvoiceSelectionBar';
import { ProjectSelector } from './ProjectSelector';

export function InvoicesView({
	invoiceHistoryOpen,
	onToggleHistory,
	projects,
	selectedProject,
	onSelectProject,
	onAddProject,
	onManageProjects,
	invoiceError,
	invoiceSheetOpen,
	invoices,
	onOpenInvoice,
	invoiceCandidates,
	invoiceSelection,
	onToggleCandidate,
	selectedTotal,
	hasSelection,
	onGenerateInvoice,
}: {
	invoiceHistoryOpen: boolean;
	onToggleHistory: () => void;
	projects: Project[];
	selectedProject: string;
	onSelectProject: (id: string) => void;
	onAddProject: () => void;
	onManageProjects: () => void;
	invoiceError: string | null;
	invoiceSheetOpen: boolean;
	invoices: InvoiceSummary[];
	onOpenInvoice: (id: string) => void;
	invoiceCandidates: Transaction[];
	invoiceSelection: Set<string>;
	onToggleCandidate: (id: string) => void;
	selectedTotal: number;
	hasSelection: boolean;
	onGenerateInvoice: () => void;
}) {
	return (
		<>
			<div className='px-5 flex items-center justify-between mb-4'>
				<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
					FATURAS
				</div>
				<button
					onClick={onToggleHistory}
					className='text-[10px] tracking-widest px-3 py-2 rounded-lg'
					style={{
						background: 'var(--bg-card)',
						border: '1px solid var(--line)',
						color: 'var(--text)',
					}}>
					{invoiceHistoryOpen ? 'SELECIONAR' : 'HISTÓRICO'}
				</button>
			</div>

			<ProjectSelector
				projects={projects}
				selectedProject={selectedProject}
				onSelect={onSelectProject}
				showActions
				onAddProject={onAddProject}
				onManage={onManageProjects}
			/>

			<div className='flex-1 overflow-y-auto sl-scrollbar-none px-5 pb-32 sl-fade-enter'>
				{invoiceError && !invoiceSheetOpen && (
					<div className='text-xs mb-4' style={{ color: 'var(--orange)' }}>
						{invoiceError}
					</div>
				)}

				{invoiceHistoryOpen ? (
					<InvoiceHistoryList invoices={invoices} onOpenInvoice={onOpenInvoice} />
				) : (
					<InvoiceCandidateList
						candidates={invoiceCandidates}
						selection={invoiceSelection}
						onToggle={onToggleCandidate}
					/>
				)}
			</div>

			{!invoiceHistoryOpen && hasSelection && (
				<InvoiceSelectionBar total={selectedTotal} onGenerate={onGenerateInvoice} />
			)}
		</>
	);
}
