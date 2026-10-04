import { Trash2 } from 'lucide-react';
import type { Category } from '@/lib/default-categories';
import type { SavedCategories, TransactionType } from '../types';

function CategoryTypeList({
	title,
	type,
	items,
	manageConfirmCatId,
	onRequestDeleteConfirm,
	onCancelDeleteConfirm,
	onConfirmDelete,
}: {
	title: string;
	type: TransactionType;
	items: Category[];
	manageConfirmCatId: string | null;
	onRequestDeleteConfirm: (id: string) => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (type: TransactionType, id: string) => void;
}) {
	return (
		<div>
			<div
				className='text-xs text-[10px] tracking-widest'
				style={{ color: 'var(--text-dim)', marginBottom: 6 }}>
				{title}
			</div>
			{items.map((c) => (
				<div
					key={c.id}
					className='flex items-center justify-between px-3 py-2 rounded-md'
					style={{ background: 'var(--bg-raised)', border: '1px solid var(--line)' }}>
					<div className='min-w-0'>
						<div className='text-sm truncate'>{c.label}</div>
						<div className='text-[10px]' style={{ color: 'var(--text-dim)' }}>
							{c.tag}
						</div>
					</div>
					<div className='flex gap-2'>
						{manageConfirmCatId === c.id ? (
							<>
								<button
									onClick={onCancelDeleteConfirm}
									className='px-3 py-1 rounded-md'
									style={{ background: 'var(--bg-card)', color: 'var(--text)' }}>
									Cancelar
								</button>
								<button
									onClick={() => onConfirmDelete(type, c.id)}
									className='px-3 py-1 rounded-md'
									style={{ background: 'var(--orange)', color: '#1c1b19' }}>
									Excluir
								</button>
							</>
						) : (
							<button
								onClick={() => onRequestDeleteConfirm(c.id)}
								className='px-3 py-1 rounded-md'
								style={{ background: 'var(--bg-card)', color: 'var(--text)' }}>
								<Trash2 size={14} color='var(--orange)' />
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

export function ManageCategoriesSection({
	categories,
	newCategoryLabel,
	onChangeNewCategoryLabel,
	newCategoryType,
	onChangeNewCategoryType,
	onAddCategory,
	manageConfirmCatId,
	onRequestDeleteConfirm,
	onCancelDeleteConfirm,
	onConfirmDelete,
}: {
	categories: SavedCategories;
	newCategoryLabel: string;
	onChangeNewCategoryLabel: (value: string) => void;
	newCategoryType: TransactionType;
	onChangeNewCategoryType: (type: TransactionType) => void;
	onAddCategory: () => void;
	manageConfirmCatId: string | null;
	onRequestDeleteConfirm: (id: string) => void;
	onCancelDeleteConfirm: () => void;
	onConfirmDelete: (type: TransactionType, id: string) => void;
}) {
	return (
		<div className='mt-6'>
			<div className='flex items-center justify-between mb-3'>
				<div className='sl-display text-xl' style={{ color: 'var(--yellow)' }}>
					GERIR CATEGORIAS
				</div>
			</div>
			<div
				className='rounded-xl p-4'
				style={{ background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
				<div className='mb-3'>
					<input
						value={newCategoryLabel}
						onChange={(e) => onChangeNewCategoryLabel(e.target.value)}
						placeholder='Nome da categoria (ex. Rebarcas)'
						className='w-full rounded-lg px-3 py-2.5 text-sm mb-2 outline-none'
						style={{
							background: 'var(--bg-raised)',
							border: '1px solid var(--line)',
							color: 'var(--text)',
						}}
						onKeyDown={(e) => e.key === 'Enter' && onAddCategory()}
					/>
					<div className='flex items-center gap-2 mb-2'>
						<button
							onClick={() => onChangeNewCategoryType('expense')}
							className='px-3 py-2 rounded-lg text-xs'
							style={{
								background:
									newCategoryType === 'expense' ? 'var(--yellow)' : 'var(--bg-card)',
								color: newCategoryType === 'expense' ? '#1c1b19' : 'var(--text)',
							}}>
							Despesa
						</button>
						<button
							onClick={() => onChangeNewCategoryType('income')}
							className='px-3 py-2 rounded-lg text-xs'
							style={{
								background:
									newCategoryType === 'income' ? 'var(--yellow)' : 'var(--bg-card)',
								color: newCategoryType === 'income' ? '#1c1b19' : 'var(--text)',
							}}>
							Receita
						</button>
						<div className='flex-1' />
						<button
							onClick={onAddCategory}
							className='px-3 py-2 rounded-lg text-xs font-bold'
							style={{
								background: newCategoryLabel.trim() ? 'var(--yellow)' : 'var(--bg-card)',
								color: newCategoryLabel.trim() ? '#1c1b19' : 'var(--text-dim)',
							}}>
							Adicionar
						</button>
					</div>
				</div>

				<div className='space-y-3'>
					<CategoryTypeList
						title='DESPESAS'
						type='expense'
						items={categories.expense}
						manageConfirmCatId={manageConfirmCatId}
						onRequestDeleteConfirm={onRequestDeleteConfirm}
						onCancelDeleteConfirm={onCancelDeleteConfirm}
						onConfirmDelete={onConfirmDelete}
					/>
					<CategoryTypeList
						title='RECEITAS'
						type='income'
						items={categories.income}
						manageConfirmCatId={manageConfirmCatId}
						onRequestDeleteConfirm={onRequestDeleteConfirm}
						onCancelDeleteConfirm={onCancelDeleteConfirm}
						onConfirmDelete={onConfirmDelete}
					/>
				</div>
			</div>
		</div>
	);
}
