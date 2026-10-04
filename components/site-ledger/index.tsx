'use client';

import { useMemo, useState } from 'react';
import { AddProjectModal } from './components/AddProjectModal';
import { GlobalStyles } from './components/GlobalStyles';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { InvoiceSheet } from './components/InvoiceSheet';
import { InvoicesView } from './components/InvoicesView';
import { ManageModal } from './components/ManageModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { ProfileModal } from './components/ProfileModal';
import { ReportsView } from './components/ReportsView';
import { TransactionSheet } from './components/TransactionSheet';
import { useCategoryManagement } from './hooks/useCategoryManagement';
import { useInvoiceFlow } from './hooks/useInvoiceFlow';
import { useLedgerData } from './hooks/useLedgerData';
import { useProfile } from './hooks/useProfile';
import { useProjectManagement } from './hooks/useProjectManagement';
import { useReports } from './hooks/useReports';
import { useTransactionSheet } from './hooks/useTransactionSheet';

type ViewName = 'home' | 'reports' | 'invoices';

export default function SiteLedger({
	isAdmin,
	isPremiumUser,
}: {
	isAdmin: boolean;
	isPremiumUser: boolean;
}) {
	const now = useMemo(() => new Date(), []);
	const [view, setView] = useState<ViewName>('home');

	const ledger = useLedgerData({ now });

	const txSheet = useTransactionSheet({
		categories: ledger.categories,
		selectedProject: ledger.selectedProject,
		createTransaction: ledger.createTransaction,
		updateTransaction: ledger.updateTransaction,
		deleteTransaction: ledger.deleteTransaction,
	});

	const invoiceFlow = useInvoiceFlow({
		scopedTransactions: ledger.scopedTransactions,
		invoicedTransactionIds: ledger.invoicedTransactionIds,
		selectedProject: ledger.selectedProject,
		companyName: ledger.companyName,
		recordInvoice: ledger.recordInvoice,
	});

	const reports = useReports({
		now,
		scopedTransactions: ledger.scopedTransactions,
		selectedProjectName: ledger.selectedProjectName,
	});

	const projectMgmt = useProjectManagement({
		projects: ledger.projects,
		selectedProject: ledger.selectedProject,
		createProject: ledger.createProject,
		updateProjectStatus: ledger.updateProjectStatus,
		deleteProject: ledger.deleteProject,
	});

	const categoryMgmt = useCategoryManagement({
		categories: ledger.categories,
		createCategory: ledger.createCategory,
		deleteCategory: ledger.deleteCategory,
	});

	const profile = useProfile({
		companyName: ledger.companyName,
		companyLogo: ledger.companyLogo,
		persistProfile: ledger.persistProfile,
	});

	const openManageModal = () => projectMgmt.setManageOpen(true);

	const editingProjectContextLabel = useMemo(() => {
		if (!txSheet.editingId) return ledger.selectedProjectName;
		const editingTx = ledger.transactions.find((t) => t.id === txSheet.editingId);
		return (
			ledger.projects.find((p) => p.id === editingTx?.projectId)?.name ||
			'Geral'
		);
	}, [
		txSheet.editingId,
		ledger.transactions,
		ledger.projects,
		ledger.selectedProjectName,
	]);

	return (
		<div
			style={{ fontFamily: "'IBM Plex Mono', monospace" }}
			className='w-full max-h-screen flex justify-center'>
			<GlobalStyles />
			<div
				className='sl-root sl-noise w-full max-w-md min-h-screen relative flex flex-col'
				style={{ background: 'var(--bg)', overflowX: 'hidden' }}>
				<Header
					companyName={ledger.companyName}
					companyLogo={ledger.companyLogo}
					onOpenProfile={profile.openProfile}
					view={view}
					onChangeView={setView}
					isPremiumUser={isPremiumUser}
				/>

				{!ledger.loaded ? (
					<div
						className='flex-1 flex items-center justify-center text-sm'
						style={{ color: 'var(--text-dim)' }}>
						Carregando livro…
					</div>
				) : view === 'home' ? (
					<HomeView
						balance={ledger.balance}
						monthIncome={ledger.thisMonthTotals.income}
						monthExpense={ledger.thisMonthTotals.expense}
						projects={ledger.projects}
						selectedProject={ledger.selectedProject}
						onSelectProject={ledger.selectProject}
						onAddProject={() => projectMgmt.setAddProjectOpen(true)}
						onManageProjects={openManageModal}
						grouped={ledger.grouped}
						now={now}
						longPressId={txSheet.longPressId}
						deletingId={txSheet.deletingId}
						onRowClick={txSheet.handleRowClick}
						onStartLongPress={txSheet.startLongPress}
						onCancelLongPress={txSheet.cancelLongPress}
						onCancelDeleteConfirm={() => txSheet.setLongPressId(null)}
						onConfirmDelete={txSheet.handleDelete}
						onOpenSheet={txSheet.openSheet}
					/>
				) : view === 'reports' ? (
					<ReportsView
						reportMonthDate={reports.reportMonthDate}
						monthOffset={reports.monthOffset}
						onChangeMonthOffset={reports.setMonthOffset}
						projects={ledger.projects}
						selectedProject={ledger.selectedProject}
						onSelectProject={ledger.selectProject}
						onAddProject={() => projectMgmt.setAddProjectOpen(true)}
						onManageProjects={openManageModal}
						exportMenuOpen={reports.exportMenuOpen}
						onToggleExportMenu={() => reports.setExportMenuOpen((o) => !o)}
						onExport={reports.exportReportPdf}
						exportError={reports.exportError}
						reportData={reports.reportData}
					/>
				) : (
					<InvoicesView
						invoiceHistoryOpen={invoiceFlow.invoiceHistoryOpen}
						onToggleHistory={() =>
							invoiceFlow.setInvoiceHistoryOpen((v) => !v)
						}
						projects={ledger.projects}
						selectedProject={ledger.selectedProject}
						onSelectProject={ledger.selectProject}
						onAddProject={() => projectMgmt.setAddProjectOpen(true)}
						onManageProjects={openManageModal}
						invoiceError={invoiceFlow.invoiceError}
						invoiceSheetOpen={invoiceFlow.invoiceSheetOpen}
						invoices={ledger.invoices}
						onOpenInvoice={invoiceFlow.openInvoicePrintWindowById}
						invoiceCandidates={invoiceFlow.invoiceCandidates}
						invoiceSelection={invoiceFlow.invoiceSelection}
						onToggleCandidate={invoiceFlow.toggleInvoiceSelection}
						selectedTotal={invoiceFlow.invoiceSelectionTotal}
						hasSelection={invoiceFlow.selectedInvoiceTransactions.length > 0}
						onGenerateInvoice={invoiceFlow.openInvoiceSheet}
					/>
				)}

				{txSheet.sheetOpen && (
					<TransactionSheet
						editingId={txSheet.editingId}
						projectContextLabel={editingProjectContextLabel}
						txType={txSheet.txType}
						onChangeType={txSheet.changeType}
						amount={txSheet.amount}
						activeCats={txSheet.activeCats}
						category={txSheet.category}
						onSelectCategory={txSheet.setCategory}
						onManageCategories={openManageModal}
						description={txSheet.description}
						onChangeDescription={txSheet.setDescription}
						isPremiumUser={isPremiumUser}
						photoDraft={txSheet.photoDraft}
						onChangePhoto={txSheet.handlePhotoChange}
						onRemovePhoto={txSheet.handleRemovePhoto}
						onOpenLightbox={txSheet.setLightboxPhoto}
						photoError={txSheet.photoError}
						saveError={txSheet.saveError}
						onPressDigit={txSheet.pressDigit}
						onBackspace={txSheet.backspace}
						canSave={txSheet.canSave}
						saving={txSheet.saving}
						deleting={txSheet.deletingId !== null}
						onSave={txSheet.handleSave}
						sheetDeleteConfirm={txSheet.sheetDeleteConfirm}
						onRequestDeleteConfirm={() => txSheet.setSheetDeleteConfirm(true)}
						onCancelDeleteConfirm={() => txSheet.setSheetDeleteConfirm(false)}
						onDelete={txSheet.handleDeleteFromSheet}
						onClose={txSheet.closeSheet}
					/>
				)}

				{invoiceFlow.invoiceSheetOpen && (
					<InvoiceSheet
						total={invoiceFlow.invoiceSelectionTotal}
						clientName={invoiceFlow.invoiceClientName}
						onChangeClientName={invoiceFlow.setInvoiceClientName}
						clientNif={invoiceFlow.invoiceClientNif}
						onChangeClientNif={invoiceFlow.setInvoiceClientNif}
						description={invoiceFlow.invoiceDescription}
						onChangeDescription={invoiceFlow.setInvoiceDescription}
						invoiceError={invoiceFlow.invoiceError}
						submitting={invoiceFlow.invoiceSubmitting}
						onGenerate={invoiceFlow.handleGenerateInvoice}
						onClose={invoiceFlow.closeInvoiceSheet}
					/>
				)}

				{projectMgmt.addProjectOpen && (
					<AddProjectModal
						newProjectName={projectMgmt.newProjectName}
						onChangeName={projectMgmt.setNewProjectName}
						onCancel={() => {
							projectMgmt.setAddProjectOpen(false);
							projectMgmt.setNewProjectName('');
						}}
						onCreate={projectMgmt.handleAddProject}
					/>
				)}

				{profile.profileOpen && (
					<ProfileModal
						profileLogoDraft={profile.profileLogoDraft}
						onChangePhoto={profile.handleProfilePhotoChange}
						profileNameDraft={profile.profileNameDraft}
						onChangeName={profile.setProfileNameDraft}
						onCancel={profile.closeProfile}
						onSave={profile.handleSaveProfile}
						isAdmin={isAdmin}
						onLogout={profile.handleLogout}
					/>
				)}

				{projectMgmt.manageOpen && (
					<ManageModal
						projects={ledger.projects}
						manageConfirmId={projectMgmt.manageConfirmId}
						onRequestDeleteProjectConfirm={projectMgmt.setManageConfirmId}
						onCancelDeleteProjectConfirm={() =>
							projectMgmt.setManageConfirmId(null)
						}
						onConfirmDeleteProject={projectMgmt.handleDeleteProject}
						onToggleEndProject={projectMgmt.handleToggleEndProject}
						categories={ledger.categories}
						newCategoryLabel={categoryMgmt.newCategoryLabel}
						onChangeNewCategoryLabel={categoryMgmt.setNewCategoryLabel}
						newCategoryType={categoryMgmt.newCategoryType}
						onChangeNewCategoryType={categoryMgmt.setNewCategoryType}
						onAddCategory={categoryMgmt.handleAddCategory}
						manageConfirmCatId={categoryMgmt.manageConfirmCatId}
						onRequestDeleteCategoryConfirm={categoryMgmt.setManageConfirmCatId}
						onCancelDeleteCategoryConfirm={() =>
							categoryMgmt.setManageConfirmCatId(null)
						}
						onConfirmDeleteCategory={categoryMgmt.handleDeleteCategory}
						onClose={() => {
							projectMgmt.setManageOpen(false);
							projectMgmt.setManageConfirmId(null);
						}}
					/>
				)}

				{txSheet.lightboxPhoto && (
					<PhotoLightbox
						photo={txSheet.lightboxPhoto}
						onClose={() => txSheet.setLightboxPhoto(null)}
					/>
				)}
			</div>
		</div>
	);
}
