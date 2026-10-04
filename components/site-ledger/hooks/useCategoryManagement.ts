import { useCallback, useState } from 'react';
import type { Category } from '@/lib/default-categories';
import type { SavedCategories, TransactionType } from '../types';

export function useCategoryManagement({
	categories,
	createCategory,
	deleteCategory,
}: {
	categories: SavedCategories;
	createCategory: (type: TransactionType, cat: Category) => Promise<void>;
	deleteCategory: (type: TransactionType, id: string) => Promise<void>;
}) {
	const [newCategoryLabel, setNewCategoryLabel] = useState('');
	const [newCategoryType, setNewCategoryType] =
		useState<TransactionType>('expense');
	const [manageConfirmCatId, setManageConfirmCatId] = useState<string | null>(
		null,
	);

	const handleAddCategory = useCallback(() => {
		const label = newCategoryLabel.trim();
		if (!label) return;
		const type = newCategoryType;
		const baseId = label
			.toLowerCase()
			.replace(/\s+/g, '_')
			.replace(/[^a-z0-9_]/g, '');
		let id = baseId || `cat_${Date.now()}`;
		if (categories[type].some((c) => c.id === id)) id = `${id}_${Date.now()}`;
		const tag = label.slice(0, 3).toUpperCase();
		const newCat: Category = { id, label, tag };
		createCategory(type, newCat);
		setNewCategoryLabel('');
	}, [newCategoryLabel, newCategoryType, categories, createCategory]);

	const handleDeleteCategory = useCallback(
		(type: TransactionType, id: string) => {
			deleteCategory(type, id);
			setManageConfirmCatId(null);
		},
		[deleteCategory],
	);

	return {
		newCategoryLabel,
		setNewCategoryLabel,
		newCategoryType,
		setNewCategoryType,
		manageConfirmCatId,
		setManageConfirmCatId,
		handleAddCategory,
		handleDeleteCategory,
	};
}
