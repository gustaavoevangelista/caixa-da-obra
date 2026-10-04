import { X } from 'lucide-react';
import type { Project, SavedCategories, TransactionType } from '../types';
import { ManageCategoriesSection } from './ManageCategoriesSection';
import { ManageProjectsSection } from './ManageProjectsSection';

export function ManageModal({
	projects,
	manageConfirmId,
	onRequestDeleteProjectConfirm,
	onCancelDeleteProjectConfirm,
	onConfirmDeleteProject,
	onToggleEndProject,
	categories,
	newCategoryLabel,
	onChangeNewCategoryLabel,
	newCategoryType,
	onChangeNewCategoryType,
	onAddCategory,
	manageConfirmCatId,
	onRequestDeleteCategoryConfirm,
	onCancelDeleteCategoryConfirm,
	onConfirmDeleteCategory,
	onClose,
}: {
	projects: Project[];
	manageConfirmId: string | null;
	onRequestDeleteProjectConfirm: (id: string) => void;
	onCancelDeleteProjectConfirm: () => void;
	onConfirmDeleteProject: (id: string) => void;
	onToggleEndProject: (id: string) => void;
	categories: SavedCategories;
	newCategoryLabel: string;
	onChangeNewCategoryLabel: (value: string) => void;
	newCategoryType: TransactionType;
	onChangeNewCategoryType: (type: TransactionType) => void;
	onAddCategory: () => void;
	manageConfirmCatId: string | null;
	onRequestDeleteCategoryConfirm: (id: string) => void;
	onCancelDeleteCategoryConfirm: () => void;
	onConfirmDeleteCategory: (type: TransactionType, id: string) => void;
	onClose: () => void;
}) {
	return (
		<div className='absolute inset-0 z-30 flex items-end sl-fade-enter'>
			<div
				className='absolute inset-0'
				style={{ background: 'rgba(0,0,0,0.55)' }}
				onClick={onClose}
			/>
			<div
				className='relative w-full rounded-t-3xl p-5 pb-8 sl-sheet-enter'
				style={{
					background: 'var(--bg-raised)',
					border: '1px solid var(--line)',
					borderBottom: 'none',
					maxHeight: '70vh',
					overflowY: 'auto',
				}}>
				<div className='flex items-center justify-between mb-4'>
					<div className='sl-display text-2xl' style={{ color: 'var(--yellow)' }}>
						GERIR PROJETOS
					</div>
					<button
						onClick={onClose}
						className='w-8 h-8 rounded-full flex items-center justify-center'
						style={{ background: 'var(--bg-card)' }}>
						<X size={16} />
					</button>
				</div>

				<ManageProjectsSection
					projects={projects}
					manageConfirmId={manageConfirmId}
					onRequestDeleteConfirm={onRequestDeleteProjectConfirm}
					onCancelDeleteConfirm={onCancelDeleteProjectConfirm}
					onConfirmDelete={onConfirmDeleteProject}
					onToggleEnd={onToggleEndProject}
				/>

				<ManageCategoriesSection
					categories={categories}
					newCategoryLabel={newCategoryLabel}
					onChangeNewCategoryLabel={onChangeNewCategoryLabel}
					newCategoryType={newCategoryType}
					onChangeNewCategoryType={onChangeNewCategoryType}
					onAddCategory={onAddCategory}
					manageConfirmCatId={manageConfirmCatId}
					onRequestDeleteConfirm={onRequestDeleteCategoryConfirm}
					onCancelDeleteConfirm={onCancelDeleteCategoryConfirm}
					onConfirmDelete={onConfirmDeleteCategory}
				/>
			</div>
		</div>
	);
}
