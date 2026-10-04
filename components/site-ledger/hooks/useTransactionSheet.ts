import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { resizeReceiptPhotoToDataUrl } from '../../receipt-photo';
import { GENERAL, type SavedCategories, type Transaction, type TransactionType } from '../types';

export function useTransactionSheet({
	categories,
	selectedProject,
	createTransaction,
	updateTransaction,
	deleteTransaction,
}: {
	categories: SavedCategories;
	selectedProject: string;
	createTransaction: (entry: Transaction) => Promise<void>;
	updateTransaction: (
		id: string,
		patch: Omit<Transaction, 'id' | 'createdAt' | 'projectId'>,
	) => Promise<void>;
	deleteTransaction: (id: string) => Promise<void>;
}) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [txType, setTxType] = useState<TransactionType>('expense');
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState<string | null>(null);
	const [description, setDescription] = useState('');
	const [saveError, setSaveError] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [photoDraft, setPhotoDraft] = useState<string | null>(null);
	const [photoError, setPhotoError] = useState<string | null>(null);
	const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const sheetOpenTokenRef = useRef(0);
	const [sheetDeleteConfirm, setSheetDeleteConfirm] = useState(false);
	const [longPressId, setLongPressId] = useState<string | null>(null);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressFired = useRef(false);

	const resetSheet = () => {
		setTxType('expense');
		setAmount('');
		setCategory(null);
		setDescription('');
		setSaveError(false);
		setEditingId(null);
		setSheetDeleteConfirm(false);
		setPhotoDraft(null);
		setPhotoError(null);
	};

	const openSheet = () => {
		sheetOpenTokenRef.current += 1;
		resetSheet();
		setSheetOpen(true);
	};

	const openEditSheet = (t: Transaction) => {
		sheetOpenTokenRef.current += 1;
		setTxType(t.type);
		setAmount(String(t.amount));
		setCategory(t.category);
		setDescription(t.description || '');
		setSaveError(false);
		setEditingId(t.id);
		setSheetDeleteConfirm(false);
		setPhotoDraft(t.photo);
		setPhotoError(null);
		setSheetOpen(true);
	};

	const closeSheet = () => {
		sheetOpenTokenRef.current += 1;
		setSheetOpen(false);
		resetSheet();
	};

	const pressDigit = (d: string) => {
		setAmount((prev) => {
			if (d === '.' && prev.includes('.')) return prev;
			if (prev.includes('.') && prev.split('.')[1]?.length >= 2)
				return prev;
			if (prev === '0' && d !== '.') return d;
			if (prev.length >= 9) return prev;
			return prev + d;
		});
	};

	const backspace = () => setAmount((prev) => prev.slice(0, -1));

	const changeType = (t: TransactionType) => {
		setTxType(t);
		setCategory(null);
	};

	const canSave = Boolean(amount && Number.parseFloat(amount) > 0 && category);

	const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		const openedFor = sheetOpenTokenRef.current;
		try {
			const dataUrl = await resizeReceiptPhotoToDataUrl(file);
			if (sheetOpenTokenRef.current !== openedFor) return;
			setPhotoDraft(dataUrl);
			setPhotoError(null);
		} catch (err) {
			console.error('Receipt photo processing error:', err);
			if (sheetOpenTokenRef.current !== openedFor) return;
			setPhotoError(
				err instanceof Error && err.message === 'Photo too large'
					? 'Foto muito grande mesmo após compressão. Tente outra foto.'
					: 'Não foi possível processar a foto. Tente novamente.',
			);
		}
	};

	const handleRemovePhoto = () => {
		setPhotoDraft(null);
		setPhotoError(null);
	};

	const handleSave = async () => {
		if (saving || deletingId) return;
		if (!canSave) {
			setSaveError(true);
			return;
		}
		const value = Number.parseFloat(amount);
		const cats = txType === 'expense' ? categories.expense : categories.income;
		const catObj = cats.find((c) => c.id === category);
		if (!catObj) return;

		if (editingId) {
			setSaving(true);
			try {
				await updateTransaction(editingId, {
					type: txType,
					amount: value,
					category: catObj.id,
					categoryLabel: catObj.label,
					categoryTag: catObj.tag,
					description: description.trim(),
					photo: photoDraft,
				});
			} finally {
				setSaving(false);
			}
			closeSheet();
			return;
		}

		const entry: Transaction = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			type: txType,
			amount: value,
			category: catObj.id,
			categoryLabel: catObj.label,
			categoryTag: catObj.tag,
			description: description.trim(),
			createdAt: new Date().toISOString(),
			projectId: selectedProject === GENERAL ? null : selectedProject,
			photo: photoDraft,
		};
		setSaving(true);
		try {
			await createTransaction(entry);
		} finally {
			setSaving(false);
		}
		closeSheet();
	};

	const handleDelete = useCallback(
		async (id: string) => {
			if (deletingId) return;
			setDeletingId(id);
			try {
				await deleteTransaction(id);
			} finally {
				setDeletingId(null);
			}
			setLongPressId(null);
		},
		[deleteTransaction, deletingId],
	);

	const handleDeleteFromSheet = async () => {
		if (!editingId || saving || deletingId) return;
		setDeletingId(editingId);
		try {
			await deleteTransaction(editingId);
		} finally {
			setDeletingId(null);
		}
		closeSheet();
	};

	const startLongPress = (id: string) => {
		longPressFired.current = false;
		longPressTimer.current = setTimeout(() => {
			longPressFired.current = true;
			setLongPressId(id);
		}, 550);
	};

	const cancelLongPress = () => {
		if (longPressTimer.current) clearTimeout(longPressTimer.current);
	};

	const handleRowClick = (t: Transaction) => {
		if (longPressFired.current) {
			longPressFired.current = false;
			return;
		}
		openEditSheet(t);
	};

	const activeCats = txType === 'expense' ? categories.expense : categories.income;

	return {
		sheetOpen,
		txType,
		changeType,
		amount,
		category,
		setCategory,
		description,
		setDescription,
		saveError,
		saving,
		deletingId,
		photoDraft,
		photoError,
		lightboxPhoto,
		setLightboxPhoto,
		editingId,
		sheetDeleteConfirm,
		setSheetDeleteConfirm,
		longPressId,
		setLongPressId,
		activeCats,
		canSave,
		openSheet,
		openEditSheet,
		closeSheet,
		pressDigit,
		backspace,
		handleSave,
		handleDelete,
		handleDeleteFromSheet,
		startLongPress,
		cancelLongPress,
		handleRowClick,
		handlePhotoChange,
		handleRemovePhoto,
	};
}
