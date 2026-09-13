'use client';

import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
	type PointerEvent as ReactPointerEvent,
	type ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
	Plus,
	X,
	Trash2,
	ChevronLeft,
	ChevronRight,
	BarChart3,
	Delete,
	Layers,
	Settings2,
	Flag,
	RotateCcw,
	ArrowLeft,
	User,
	Camera,
} from 'lucide-react';
import {
	buildReportData,
	getMonthPeriod,
	getYearPeriod,
	type ReportData,
	type ReportPeriod,
} from './reporting';
import { PRINT_WINDOW_FEATURES } from './print-window';
import {
	EXPORT_REPORT_LABEL,
	EXPORT_REPORT_OPTIONS,
	type ExportReportMode,
} from './export-options';
import {
	EXPENSE_CATEGORIES,
	INCOME_CATEGORIES,
	type Category,
} from '@/lib/default-categories';
import { resizeReceiptPhotoToDataUrl } from './receipt-photo';

type TransactionType = 'expense' | 'income';

type Transaction = {
	id: string;
	type: TransactionType;
	amount: number;
	category: string;
	categoryLabel: string;
	categoryTag: string;
	description: string;
	createdAt: string;
	projectId: string | null;
	photo: string | null;
};

type Project = {
	id: string;
	name: string;
	status: 'active' | 'ended';
};

type SavedCategories = {
	expense: Category[];
	income: Category[];
};

const GENERAL = 'general';

async function api(path: string, init?: RequestInit) {
	const res = await fetch(path, {
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
	if (!res.ok) {
		throw new Error(`Request to ${path} failed with ${res.status}`);
	}
	return res;
}

function formatMoney(n: number) {
	const sign = n < 0 ? '-' : '';
	return (
		sign +
		Math.abs(n).toLocaleString('en-IE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	);
}

function todayKey(d: Date) {
	return d.toDateString();
}

function dayLabel(dateStr: string, refNow: Date) {
	const d = new Date(dateStr);
	const now = refNow;
	const diffDays = Math.round(
		(new Date(now.toDateString()).getTime() -
			new Date(d.toDateString()).getTime()) /
			86400000,
	);
	if (diffDays === 0) return 'HOJE';
	if (diffDays === 1) return 'ONTEM';
	return d
		.toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		})
		.toUpperCase();
}

export default function SiteLedger({ isAdmin }: { isAdmin: boolean }) {
	const router = useRouter();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [view, setView] = useState<'home' | 'reports'>('home');
	const [sheetOpen, setSheetOpen] = useState(false);
	const [txType, setTxType] = useState<TransactionType>('expense');
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState<string | null>(null);
	const [description, setDescription] = useState('');
	const [monthOffset, setMonthOffset] = useState(0);
	const [saveError, setSaveError] = useState(false);
	const [photoDraft, setPhotoDraft] = useState<string | null>(null);
	const [photoError, setPhotoError] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [sheetDeleteConfirm, setSheetDeleteConfirm] = useState(false);
	const [longPressId, setLongPressId] = useState<string | null>(null);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressFired = useRef(false);
	const [exportError, setExportError] = useState(false);
	const [exportMenuOpen, setExportMenuOpen] = useState(false);
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProject, setSelectedProject] = useState(GENERAL);
	const [categories, setCategories] = useState<SavedCategories>({
		expense: EXPENSE_CATEGORIES,
		income: INCOME_CATEGORIES,
	});
	const [addProjectOpen, setAddProjectOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');
	const [manageOpen, setManageOpen] = useState(false);
	const [manageConfirmId, setManageConfirmId] = useState<string | null>(null);
	const [newCategoryLabel, setNewCategoryLabel] = useState('');
	const [newCategoryType, setNewCategoryType] =
		useState<TransactionType>('expense');
	const [manageConfirmCatId, setManageConfirmCatId] = useState<string | null>(
		null,
	);
	const [companyName, setCompanyName] = useState('');
	const [companyLogo, setCompanyLogo] = useState<string | null>(null);
	const [profileOpen, setProfileOpen] = useState(false);
	const [profileNameDraft, setProfileNameDraft] = useState('');
	const [profileLogoDraft, setProfileLogoDraft] = useState<string | null>(
		null,
	);
	const chipScrollRef = useRef<HTMLDivElement | null>(null);
	const dragState = useRef({
		isDown: false,
		startX: 0,
		scrollLeft: 0,
		moved: false,
	});

	const handleChipPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (e.pointerType !== 'mouse') return;
		const el = chipScrollRef.current;
		if (!el) return;
		dragState.current = {
			isDown: true,
			startX: e.clientX,
			scrollLeft: el.scrollLeft,
			moved: false,
		};
	};

	const handleChipPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!dragState.current.isDown) return;
		const el = chipScrollRef.current;
		if (!el) return;
		const dx = e.clientX - dragState.current.startX;
		if (Math.abs(dx) > 3) dragState.current.moved = true;
		const maxScroll = el.scrollWidth - el.clientWidth;
		const target = dragState.current.scrollLeft - dx;
		el.scrollLeft = Math.max(0, Math.min(maxScroll, target));
	};

	const handleChipPointerUp = () => {
		dragState.current.isDown = false;
	};

	const guardedClick = (fn: () => void) => () => {
		if (!dragState.current.moved) fn();
	};

	const now = useMemo(() => new Date(), []);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await api('/api/state');
				const data = await res.json();
				setTransactions(data.transactions || []);
				setProjects(data.projects || []);
				setSelectedProject(data.selectedProject || GENERAL);
				setCategories(
					data.categories || {
						expense: EXPENSE_CATEGORIES,
						income: INCOME_CATEGORIES,
					},
				);
				setCompanyName(data.companyName || '');
				setCompanyLogo(data.companyLogo || null);
			} catch (error) {
				console.error('Failed to load data:', error);
			} finally {
				setLoaded(true);
			}
		};

		load();
	}, []);

	const createTransaction = useCallback(async (entry: Transaction) => {
		setTransactions((prev) => [entry, ...prev]);
		try {
			await api('/api/transactions', {
				method: 'POST',
				body: JSON.stringify(entry),
			});
		} catch (error) {
			console.error('Failed to create transaction:', error);
		}
	}, []);

	const updateTransaction = useCallback(
		async (id: string, patch: Omit<Transaction, 'id' | 'createdAt' | 'projectId'>) => {
			let merged: Transaction | undefined;
			setTransactions((prev) =>
				prev.map((t) => {
					if (t.id !== id) return t;
					merged = { ...t, ...patch };
					return merged;
				}),
			);
			try {
				const res = await fetch(`/api/transactions/${id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(patch),
				});
				if (res.status === 404 && merged) {
					// The row was never persisted (e.g. its original create
					// request failed silently) — recreate it from current
					// local state instead of losing the edit.
					await api('/api/transactions', {
						method: 'POST',
						body: JSON.stringify(merged),
					});
					return;
				}
				if (!res.ok) {
					throw new Error(
						`Request to /api/transactions/${id} failed with ${res.status}`,
					);
				}
			} catch (error) {
				console.error('Failed to update transaction:', error);
			}
		},
		[],
	);

	const deleteTransaction = useCallback(async (id: string) => {
		setTransactions((prev) => prev.filter((t) => t.id !== id));
		try {
			await api(`/api/transactions/${id}`, { method: 'DELETE' });
		} catch (error) {
			console.error('Failed to delete transaction:', error);
		}
	}, []);

	const changeSelectedProject = useCallback(async (id: string) => {
		setSelectedProject(id);
		try {
			await api('/api/profile', {
				method: 'PUT',
				body: JSON.stringify({ selectedProject: id }),
			});
		} catch (error) {
			console.error('Failed to update selected project:', error);
		}
	}, []);

	const createProject = useCallback(async (proj: Project) => {
		setProjects((prev) => [...prev, proj]);
		setSelectedProject(proj.id);
		try {
			await api('/api/projects', {
				method: 'POST',
				body: JSON.stringify(proj),
			});
			await api('/api/profile', {
				method: 'PUT',
				body: JSON.stringify({ selectedProject: proj.id }),
			});
		} catch (error) {
			console.error('Failed to create project:', error);
		}
	}, []);

	const updateProjectStatus = useCallback(
		async (id: string, status: Project['status']) => {
			setProjects((prev) =>
				prev.map((p) => (p.id === id ? { ...p, status } : p)),
			);
			try {
				await api(`/api/projects/${id}`, {
					method: 'PUT',
					body: JSON.stringify({ status }),
				});
			} catch (error) {
				console.error('Failed to update project:', error);
			}
		},
		[],
	);

	const deleteProject = useCallback(
		async (id: string, fallbackSelected: string) => {
			setProjects((prev) => prev.filter((p) => p.id !== id));
			setSelectedProject(fallbackSelected);
			setTransactions((prev) =>
				prev.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
			);
			try {
				await api(`/api/projects/${id}`, { method: 'DELETE' });
				if (fallbackSelected !== selectedProject) {
					await api('/api/profile', {
						method: 'PUT',
						body: JSON.stringify({ selectedProject: fallbackSelected }),
					});
				}
			} catch (error) {
				console.error('Failed to delete project:', error);
			}
		},
		[selectedProject],
	);

	const createCategory = useCallback(
		async (type: TransactionType, cat: Category) => {
			setCategories((prev) => ({
				...prev,
				[type]: [cat, ...prev[type]],
			}));
			try {
				await api('/api/categories', {
					method: 'POST',
					body: JSON.stringify({ type, ...cat }),
				});
			} catch (error) {
				console.error('Failed to create category:', error);
			}
		},
		[],
	);

	const deleteCategory = useCallback(
		async (type: TransactionType, id: string) => {
			setCategories((prev) => ({
				...prev,
				[type]: prev[type].filter((c) => c.id !== id),
			}));
			try {
				await api(`/api/categories/${type}/${id}`, { method: 'DELETE' });
			} catch (error) {
				console.error('Failed to delete category:', error);
			}
		},
		[],
	);

	const persistProfile = useCallback(
		async (nextName: string, nextLogo: string | null) => {
			setCompanyName(nextName);
			setCompanyLogo(nextLogo);
			try {
				await api('/api/profile', {
					method: 'PUT',
					body: JSON.stringify({
						companyName: nextName,
						companyLogo: nextLogo,
					}),
				});
			} catch (error) {
				console.error('Failed to update profile:', error);
			}
		},
		[],
	);

	const resizeImageToDataUrl = (file: File): Promise<string> =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(new Error('Read failed'));
			reader.onload = () => {
				const img = new Image();
				img.onerror = () => reject(new Error('Decode failed'));
				img.onload = () => {
					const SIZE = 200;
					const canvas = document.createElement('canvas');
					canvas.width = SIZE;
					canvas.height = SIZE;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Canvas unavailable'));
						return;
					}
					const scale = Math.max(SIZE / img.width, SIZE / img.height);
					const drawWidth = img.width * scale;
					const drawHeight = img.height * scale;
					const dx = (SIZE - drawWidth) / 2;
					const dy = (SIZE - drawHeight) / 2;
					ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
					resolve(canvas.toDataURL('image/png'));
				};
				img.src = reader.result as string;
			};
			reader.readAsDataURL(file);
		});

	const openProfile = () => {
		setProfileNameDraft(companyName);
		setProfileLogoDraft(companyLogo);
		setProfileOpen(true);
	};

	const closeProfile = () => {
		setProfileOpen(false);
	};

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.replace('/login');
		router.refresh();
	};

	const handleProfilePhotoChange = async (
		e: ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		try {
			const dataUrl = await resizeImageToDataUrl(file);
			setProfileLogoDraft(dataUrl);
		} catch (err) {
			console.error('Image processing error:', err);
		}
	};

	const handleSaveProfile = async () => {
		await persistProfile(profileNameDraft.trim(), profileLogoDraft);
		setProfileOpen(false);
	};

	const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		try {
			const dataUrl = await resizeReceiptPhotoToDataUrl(file);
			setPhotoDraft(dataUrl);
			setPhotoError(null);
		} catch (err) {
			console.error('Receipt photo processing error:', err);
			setPhotoError(
				err instanceof Error && err.message === 'Photo too large'
					? 'Foto muito grande mesmo apos compressao. Tente outra foto.'
					: 'Nao foi possivel processar a foto. Tente novamente.',
			);
		}
	};

	const handleRemovePhoto = () => {
		setPhotoDraft(null);
		setPhotoError(null);
	};

	const selectProject = (id: string) => changeSelectedProject(id);

	const handleAddProject = async () => {
		const name = newProjectName.trim();
		if (!name) return;
		const proj: Project = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			name,
			status: 'active',
		};
		await createProject(proj);
		setNewProjectName('');
		setAddProjectOpen(false);
	};

	const handleToggleEndProject = async (id: string) => {
		const proj = projects.find((p) => p.id === id);
		if (!proj) return;
		await updateProjectStatus(
			id,
			proj.status === 'ended' ? 'active' : 'ended',
		);
	};

	const handleDeleteProject = async (id: string) => {
		const nextSelected = selectedProject === id ? GENERAL : selectedProject;
		await deleteProject(id, nextSelected);
		setManageConfirmId(null);
	};

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
		resetSheet();
		setSheetOpen(true);
	};

	const openEditSheet = (t: Transaction) => {
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

	const canSave = Boolean(
		amount && Number.parseFloat(amount) > 0 && category,
	);

	const handleSave = async () => {
		if (!canSave) {
			setSaveError(true);
			return;
		}
		const value = Number.parseFloat(amount);
		const cats =
			txType === 'expense' ? categories.expense : categories.income;
		const catObj = cats.find((c) => c.id === category);
		if (!catObj) return;

		if (editingId) {
			await updateTransaction(editingId, {
				type: txType,
				amount: value,
				category: catObj.id,
				categoryLabel: catObj.label,
				categoryTag: catObj.tag,
				description: description.trim(),
				photo: photoDraft,
			});
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
		await createTransaction(entry);
		closeSheet();
	};

	const handleDelete = async (id: string) => {
		await deleteTransaction(id);
		setLongPressId(null);
	};

	const handleDeleteFromSheet = async () => {
		if (!editingId) return;
		await deleteTransaction(editingId);
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

	const scopedForStats = useMemo(
		() =>
			selectedProject === GENERAL
				? transactions
				: transactions.filter((t) => t.projectId === selectedProject),
		[transactions, selectedProject],
	);

	const balance = useMemo(() => {
		return scopedForStats.reduce(
			(acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
			0,
		);
	}, [scopedForStats]);

	const thisMonthTotals = useMemo(() => {
		const y = now.getFullYear();
		const m = now.getMonth();
		let income = 0;
		let expense = 0;
		scopedForStats.forEach((t) => {
			const d = new Date(t.createdAt);
			if (d.getFullYear() === y && d.getMonth() === m) {
				if (t.type === 'income') income += t.amount;
				else expense += t.amount;
			}
		});
		return { income, expense };
	}, [scopedForStats, now]);

	const scopedTransactions = useMemo(
		() =>
			selectedProject === GENERAL
				? transactions
				: transactions.filter((t) => t.projectId === selectedProject),
		[transactions, selectedProject],
	);

	const grouped = useMemo(() => {
		const sorted = [...scopedTransactions].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);
		const groups: Array<{
			key: string;
			dateStr: string;
			items: Transaction[];
		}> = [];
		let currentKey: string | null = null;
		let currentArr: {
			key: string;
			dateStr: string;
			items: Transaction[];
		} | null = null;
		sorted.forEach((t) => {
			const key = todayKey(new Date(t.createdAt));
			if (key !== currentKey) {
				currentKey = key;
				currentArr = { key, dateStr: t.createdAt, items: [] };
				groups.push(currentArr);
			}
			currentArr!.items.push(t);
		});
		return groups;
	}, [scopedTransactions]);

	const reportMonthDate = useMemo(
		() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
		[now, monthOffset],
	);

	const reportPeriod = useMemo(
		() => getMonthPeriod(reportMonthDate),
		[reportMonthDate],
	);
	const reportData = useMemo(
		() => buildReportData(scopedTransactions, reportPeriod),
		[scopedTransactions, reportPeriod],
	);

	const currentMonthLabel = useMemo(
		() =>
			reportMonthDate.toLocaleDateString('pt-PT', {
				month: 'long',
				year: 'numeric',
			}),
		[reportMonthDate],
	);
	const activeCats =
		txType === 'expense' ? categories.expense : categories.income;
	const selectedProjectName =
		selectedProject === GENERAL
			? 'Geral'
			: projects.find((p) => p.id === selectedProject)?.name || 'Geral';

	const escapeHtml = (value: string) =>
		value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');

	const renderCategoryRows = (items: ReportData['catArr']) =>
		items.length
			? items
					.map(
						(item) =>
							`<tr><td data-label="Categoria">${escapeHtml(item.label)}</td><td data-label="Tag">${escapeHtml(item.tag)}</td><td class="money" data-label="Total">€${formatMoney(item.total)}</td></tr>`,
					)
					.join('')
			: '<tr><td colspan="3" class="muted">Sem entradas.</td></tr>';

	const renderTransactionRows = (items: ReportData['items']) =>
		items.length
			? items
					.map((item) => {
						const date = new Date(
							item.createdAt,
						).toLocaleDateString('pt-PT');
						const sign = item.type === 'income' ? '+' : '-';
						return `<tr><td data-label="Data">${escapeHtml(date)}</td><td data-label="Categoria">${escapeHtml(item.categoryLabel)}</td><td data-label="Descrição">${escapeHtml(item.description || '-')}</td><td class="money" data-label="Valor">${sign}€${formatMoney(item.amount)}</td></tr>`;
					})
					.join('')
			: '<tr><td colspan="4" class="muted">Sem entradas neste periodo.</td></tr>';

	const buildPrintableReportHtml = (
		title: string,
		projectName: string,
		period: ReportPeriod,
		data: ReportData,
	) => `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	<title>${escapeHtml(title)}</title>
	<style>
		body { font-family: Arial, sans-serif; color: #1f2933; margin: 32px; }
		header { border-bottom: 2px solid #d6a900; padding-bottom: 16px; margin-bottom: 24px; }
		h1 { margin: 0 0 8px; font-size: 24px; }
		h2 { margin: 28px 0 10px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.08em; }
		.meta, .muted { color: #6b7280; font-size: 12px; }
		.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 22px; }
		.card { border: 1px solid #d8dee4; border-radius: 8px; padding: 12px; }
		.label { color: #6b7280; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
		.value { margin-top: 6px; font-size: 18px; font-weight: 700; }
		.preview-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
		.preview-toolbar button { border: 1px solid #d8dee4; background: #fff; color: #1f2933; border-radius: 8px; padding: 10px 12px; cursor: pointer; font-size: 14px; min-width: 140px; min-height: 46px; font-weight: 700; }
		.preview-toolbar .primary { background: #d6a900; color: #fff; border-color: #d6a900; }
		table { width: 100%; border-collapse: collapse; font-size: 12px; }
		th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; vertical-align: top; }
		th { color: #6b7280; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
		.money { text-align: right; white-space: nowrap; }
		@media (max-width: 640px) {
			body { margin: 16px; }
			.preview-toolbar { justify-content: stretch; }
			.preview-toolbar button { flex: 1 1 100%; min-width: 0; }
			.summary { grid-template-columns: 1fr; }
			h1 { font-size: 20px; }
			h2 { font-size: 14px; }
			table, thead, tbody, th, td, tr { display: block; }
			thead { display: none; }
			tr { border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
			td { border-bottom: none; padding: 4px 0; }
			td:before { content: attr(data-label); display: block; color: #6b7280; font-size: 10px; text-transform: uppercase; margin-bottom: 2px; }
			.money { text-align: left; }
		}
		@media print { body { margin: 20mm; } .preview-toolbar { display: none !important; } }
	</style>
</head>
<body>
	<div class="preview-toolbar">
		<button type="button" onclick="window.close()">Voltar ao app</button>
		<button type="button" class="primary" onclick="window.print()">Exportar PDF</button>
	</div>
	<header>
		<h1>${escapeHtml(title)}</h1>
		<div class="meta">Projeto: ${escapeHtml(projectName)}</div>
		<div class="meta">Periodo: ${escapeHtml(period.label)}</div>
		<div class="meta">Gerado em: ${escapeHtml(new Date().toLocaleString('pt-PT'))}</div>
	</header>
	<section class="summary">
		<div class="card"><div class="label">Receita</div><div class="value">€${formatMoney(data.income)}</div></div>
		<div class="card"><div class="label">Despesa</div><div class="value">€${formatMoney(data.expense)}</div></div>
		<div class="card"><div class="label">Saldo liquido</div><div class="value">€${formatMoney(data.net)}</div></div>
	</section>
	<div class="meta">${data.count} ${data.count === 1 ? 'entrada' : 'entradas'}</div>
	<h2>Receita por categoria</h2>
	<table><thead><tr><th>Categoria</th><th>Tag</th><th class="money">Total</th></tr></thead><tbody>${renderCategoryRows(data.incomeCatArr)}</tbody></table>
	<h2>Despesas por categoria</h2>
	<table><thead><tr><th>Categoria</th><th>Tag</th><th class="money">Total</th></tr></thead><tbody>${renderCategoryRows(data.catArr)}</tbody></table>
	<h2>Entradas</h2>
	<table><thead><tr><th>Data</th><th>Categoria</th><th>Descricao</th><th class="money">Valor</th></tr></thead><tbody>${renderTransactionRows(data.items)}</tbody></table>
</body>
</html>`;

	const exportReportPdf = (mode: ExportReportMode) => {
		const period =
			mode === 'week'
				? reportPeriod
				: mode === 'month'
					? getMonthPeriod(reportMonthDate)
					: getYearPeriod(reportMonthDate.getFullYear());
		const data =
			mode === 'week'
				? reportData
				: buildReportData(scopedTransactions, period);
		const title =
			mode === 'week'
				? 'Relatorio semanal'
				: mode === 'month'
					? 'Relatorio mensal'
					: 'Relatorio anual';

		const html = buildPrintableReportHtml(
			title,
			selectedProjectName,
			period,
			data,
		);
		const blob = new Blob([html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);

		const previewWindow = window.open(url, '_blank', PRINT_WINDOW_FEATURES);

		if (!previewWindow) {
			URL.revokeObjectURL(url);
			setExportMenuOpen(false);
			setExportError(true);
			return;
		}

		setExportMenuOpen(false);
		setExportError(false);
		previewWindow.addEventListener('load', () => URL.revokeObjectURL(url), {
			once: true,
		});
		previewWindow.focus();
	};

	const projectSelector = (
		<div>
			<div className='flex items-center justify-between px-5 pb-2 -mt-1'>
				<div
					className='text-[10px] tracking-widest'
					style={{ color: 'var(--text-dim)' }}>
					PROJETO
				</div>
				{view !== 'reports' && (
					<div className='flex items-center gap-2'>
						<button
							onClick={() => setAddProjectOpen(true)}
							className='w-7 h-7 rounded-md flex items-center justify-center'
							style={{
								background: 'var(--bg-card)',
								border: '1px dashed var(--line)',
							}}
							title='Add project'>
							<Plus size={13} color='var(--text-dim)' />
						</button>
						{projects.length > 0 && (
							<button
								onClick={() => setManageOpen(true)}
								className='w-7 h-7 rounded-md flex items-center justify-center'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
								}}
								title='Manage projects'>
								<Settings2 size={12} color='var(--text-dim)' />
							</button>
						)}
					</div>
				)}
			</div>
			<div
				ref={chipScrollRef}
				onPointerDown={handleChipPointerDown}
				onPointerMove={handleChipPointerMove}
				onPointerUp={handleChipPointerUp}
				onPointerLeave={handleChipPointerUp}
				className='flex items-center gap-2 overflow-x-auto sl-scrollbar-none px-5 pb-4'
				style={{
					WebkitOverflowScrolling: 'touch',
					whiteSpace: 'nowrap',
					touchAction: 'pan-x',
					overflowY: 'hidden',
					overscrollBehaviorX: 'contain',
					cursor: 'grab',
					width: '100%',
					boxSizing: 'border-box',
					paddingLeft: '1.25rem',
				}}>
				<button
					onClick={guardedClick(() => selectProject(GENERAL))}
					className='shrink-0 px-3 py-2 rounded-lg text-xs sl-chip flex items-center gap-1.5'
					style={{
						background:
							selectedProject === GENERAL
								? 'var(--yellow)'
								: 'var(--bg-card)',
						color:
							selectedProject === GENERAL
								? '#1c1b19'
								: 'var(--text)',
						border:
							'1px solid ' +
							(selectedProject === GENERAL
								? 'var(--yellow)'
								: 'var(--line)'),
						fontWeight: selectedProject === GENERAL ? 600 : 400,
					}}>
					Geral
				</button>
				{projects.map((p) => (
					<button
						key={p.id}
						onClick={guardedClick(() => selectProject(p.id))}
						className='shrink-0 px-3 py-2 rounded-lg text-xs sl-chip flex items-center gap-1.5'
						style={{
							background:
								selectedProject === p.id
									? 'var(--yellow)'
									: 'var(--bg-card)',
							color:
								selectedProject === p.id
									? '#1c1b19'
									: p.status === 'ended'
										? 'var(--text-dim)'
										: 'var(--text)',
							border:
								'1px solid ' +
								(selectedProject === p.id
									? 'var(--yellow)'
									: 'var(--line)'),
							fontWeight: selectedProject === p.id ? 600 : 400,
							maxWidth: 140,
							opacity:
								p.status === 'ended' && selectedProject !== p.id
									? 0.55
									: 1,
						}}>
						<span className='truncate'>{p.name}</span>
						{p.status === 'ended' && (
							<Flag size={10} className='shrink-0' />
						)}
					</button>
				))}
			</div>
		</div>
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
		if (categories[type].some((c) => c.id === id))
			id = `${id}_${Date.now()}`;
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

	return (
		<div
			style={{ fontFamily: "'IBM Plex Mono', monospace" }}
			className='w-full max-h-screen flex justify-center'>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .sl-root {
          --bg: #0d324d;
        //   --bg: #1c1b19;
          --bg-raised: #0d324d;
          --bg-card: #0d324d;
        //   --bg-raised: #26241f;
        //   --bg-card: #2c2a24;
          --line: #fff;
        //   --line: #3d3a33;
          --yellow: #f4c430;
          --yellow-dim: #d1a927;
          --orange: #ff6b35;
          --green: #9fd13a;
          --text: #f3efe6;
          --text-dim: #fff;
          color: var(--text);
          background: var(--bg);
        }
        .sl-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
        .sl-noise {
          background-image: radial-gradient(circle at 1px 1px, #ffffff8 1px, transparent 0);
          background-size: 3px 3px;
        }
        .sl-keypad-btn { transition: transform 0.06s ease, background 0.12s ease; }
        .sl-keypad-btn:active { transform: scale(0.94); background: var(--line); }
        .sl-chip { transition: all 0.12s ease; }
        .sl-sheet-enter { animation: slUp 0.28s cubic-bezier(.2,.8,.2,1); }
        @keyframes slUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sl-fade-enter { animation: slFade 0.2s ease; }
        @keyframes slFade { from { opacity: 0; } to { opacity: 1; } }
        .sl-row-enter { animation: slRow 0.25s ease; }
        @keyframes slRow { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .sl-scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
			<div
				className='sl-root sl-noise w-full max-w-md min-h-screen relative flex flex-col'
				style={{ background: 'var(--bg)', overflowX: 'hidden' }}>
				{/* Header */}
				<div className='px-5 pt-6 pb-4 flex items-center justify-between'>
					<div>
						<div
							className='sl-display text-3xl leading-none'
							style={{ color: 'var(--yellow)' }}>
							FLUX FINANCE
						</div>
						<div
							className='text-[10px] tracking-widest mt-1'
							style={{ color: 'var(--text-dim)' }}>
							CONTROLE DE DESPESAS E RECEITAS
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							onClick={openProfile}
							className='w-11 h-11 rounded-full flex items-center justify-center border overflow-hidden'
							style={{
								borderColor: 'var(--line)',
								background: 'var(--bg-raised)',
							}}>
							{companyLogo ? (
								<img
									src={companyLogo}
									alt={companyName || 'Perfil'}
									className='w-full h-full object-cover'
								/>
							) : (
								<User size={20} color='var(--text-dim)' />
							)}
						</button>
						<button
							onClick={() =>
								setView(view === 'home' ? 'reports' : 'home')
							}
							className='w-11 h-11 rounded-full flex items-center justify-center border'
							style={{
								borderColor: 'var(--line)',
								background: 'var(--bg-raised)',
							}}>
							{view === 'home' ? (
								<BarChart3 size={24} color='var(--yellow)' />
							) : (
								<ArrowLeft size={24} color='var(--yellow)' />
							)}
						</button>
					</div>
				</div>

				{!loaded ? (
					<div
						className='flex-1 flex items-center justify-center text-sm'
						style={{ color: 'var(--text-dim)' }}>
						Carregando livro…
					</div>
				) : view === 'home' ? (
					<>
						{/* Balance card */}
						<div
							className='mx-5 rounded-2xl p-5 mb-5'
							style={{
								background: 'var(--bg-card)',
								border: '1px solid var(--line)',
							}}>
							<div
								className='text-[11px] tracking-widest'
								style={{ color: 'var(--text-dim)' }}>
								SALDO ATUAL
							</div>
							<div
								className='sl-display text-5xl mt-1'
								style={{
									color:
										balance < 0
											? 'var(--orange)'
											: 'var(--text)',
								}}>
								€{formatMoney(balance)}
							</div>
							<div
								className='flex gap-5 mt-4 pt-4'
								style={{ borderTop: '1px solid var(--line)' }}>
								<div>
									<div
										className='text-[10px] tracking-widest'
										style={{ color: 'var(--text-dim)' }}>
										RECEITA - ESTE MÊS
									</div>
									<div
										className='text-lg font-semibold mt-0.5'
										style={{ color: 'var(--green)' }}>
										€{formatMoney(thisMonthTotals.income)}
									</div>
								</div>
								<div>
									<div
										className='text-[10px] tracking-widest'
										style={{ color: 'var(--text-dim)' }}>
										DESPESA - ESTE MÊS
									</div>
									<div
										className='text-lg font-semibold mt-0.5'
										style={{ color: 'var(--orange)' }}>
										€{formatMoney(thisMonthTotals.expense)}
									</div>
								</div>
							</div>
						</div>

						{projectSelector}

						{/* Transaction list */}
						<div className='flex-1 overflow-y-auto sl-scrollbar-none px-5 pb-32'>
							{grouped.length === 0 ? (
								<div className='text-center mt-16 px-6'>
									<div
										className='sl-display text-2xl'
										style={{ color: 'var(--text-dim)' }}>
										SEM ENTRADAS AINDA
									</div>
									<div
										className='text-xs mt-2'
										style={{ color: 'var(--text-dim)' }}>
										TOQUE NO BOTÃO AMARELO PARA ADICIONAR
										UMA DESPESA OU RECEITA
									</div>
								</div>
							) : (
								grouped.map((g) => (
									<div key={g.key} className='mb-5'>
										<div
											className='text-[10px] tracking-widest mb-2'
											style={{
												color: 'var(--text-dim)',
											}}>
											{dayLabel(g.dateStr, now)}
										</div>
										<div
											className='rounded-xl overflow-hidden'
											style={{
												border: '1px solid var(--line)',
											}}>
											{g.items.map((t, i) => (
												<div key={t.id}>
													{longPressId === t.id ? (
														<div
															className='flex items-center justify-between px-4 py-3'
															style={{
																background:
																	'var(--bg-raised)',
															}}>
															<span
																className='text-xs'
																style={{
																	color: 'var(--text-dim)',
																}}>
																Excluir esta
																entrada?
															</span>
															<div className='flex gap-2'>
																<button
																	onClick={() =>
																		setLongPressId(
																			null,
																		)
																	}
																	className='text-xs px-3 py-1.5 rounded-md'
																	style={{
																		background:
																			'var(--bg-card)',
																		color: 'var(--text)',
																	}}>
																	Cancelar
																</button>
																<button
																	onClick={() =>
																		handleDelete(
																			t.id,
																		)
																	}
																	className='text-xs px-3 py-1.5 rounded-md'
																	style={{
																		background:
																			'var(--orange)',
																		color: '#1c1b19',
																	}}>
																	Excluir
																</button>
															</div>
														</div>
													) : (
														<button
															onClick={() =>
																handleRowClick(
																	t,
																)
															}
															onPointerDown={() =>
																startLongPress(
																	t.id,
																)
															}
															onPointerUp={
																cancelLongPress
															}
															onPointerLeave={
																cancelLongPress
															}
															onPointerCancel={
																cancelLongPress
															}
															className='w-full flex items-center gap-3 px-4 py-3 text-left sl-row-enter select-none'
															style={{
																background:
																	'var(--bg-card)',
																borderTop:
																	i === 0
																		? 'none'
																		: '1px solid var(--line)',
																WebkitUserSelect:
																	'none',
																WebkitTouchCallout:
																	'none',
															}}>
															<div
																className='w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold'
																style={{
																	background:
																		t.type ===
																		'income'
																			? 'rgba(159,209,58,0.14)'
																			: 'rgba(255,107,53,0.14)',
																	color:
																		t.type ===
																		'income'
																			? 'var(--green)'
																			: 'var(--orange)',
																}}>
																{t.categoryTag}
															</div>
															<div className='flex-1 min-w-0'>
																<div className='text-sm truncate'>
																	{t.description ||
																		t.categoryLabel}
																</div>
																<div
																	className='text-[10px] truncate'
																	style={{
																		color: 'var(--text-dim)',
																	}}>
																	{t.description
																		? t.categoryLabel +
																			' · '
																		: ''}
																	{new Date(
																		t.createdAt,
																	).toLocaleTimeString(
																		'en-GB',
																		{
																			hour: '2-digit',
																			minute: '2-digit',
																		},
																	)}
																	{selectedProject ===
																		GENERAL &&
																	t.projectId
																		? ' · ' +
																			(projects.find(
																				(
																					p,
																				) =>
																					p.id ===
																					t.projectId,
																			)
																				?.name ||
																				'Projeto')
																		: ''}
																</div>
															</div>
															<div
																className='text-sm font-semibold shrink-0'
																style={{
																	color:
																		t.type ===
																		'income'
																			? 'var(--green)'
																			: 'var(--orange)',
																}}>
																{t.type ===
																'income'
																	? '+'
																	: '−'}
																€
																{formatMoney(
																	t.amount,
																)}
															</div>
														</button>
													)}
												</div>
											))}
										</div>
									</div>
								))
							)}
						</div>

						{/* FAB */}
						<button
							onClick={openSheet}
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
				) : (
					/* ---- REPORTS VIEW ---- */
					<div className='flex-1 overflow-y-auto sl-scrollbar-none px-5 pb-10 sl-fade-enter'>
						<div className='flex items-center justify-between mb-5'>
							<button
								onClick={() => setMonthOffset((o) => o - 1)}
								className='w-9 h-9 rounded-full flex items-center justify-center'
								style={{
									background: 'var(--bg-raised)',
									border: '1px solid var(--line)',
								}}>
								<ChevronLeft size={16} />
							</button>
							<div
								className='sl-display text-2xl'
								style={{ color: 'var(--yellow)' }}>
								{reportMonthDate
									.toLocaleDateString('en-GB', {
										month: 'long',
										year: 'numeric',
									})
									.toUpperCase()}
							</div>
							<button
								onClick={() =>
									setMonthOffset((o) => Math.min(0, o + 1))
								}
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

						<div className='-mx-5'>{projectSelector}</div>

						<div className='relative mb-4'>
							<button
								onClick={() =>
									setExportMenuOpen((open) => !open)
								}
								className='w-full rounded-lg px-3 py-3 text-[11px] font-semibold tracking-widest'
								style={{
									background: 'var(--yellow)',
									color: '#1c1b19',
								}}>
								{EXPORT_REPORT_LABEL}
							</button>
							{exportMenuOpen && (
								<div
									className='absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg'
									style={{
										background: 'var(--bg-raised)',
										border: '1px solid var(--line)',
										boxShadow:
											'0 12px 28px rgba(0,0,0,0.28)',
									}}>
									{EXPORT_REPORT_OPTIONS.map((option) => (
										<button
											key={option.mode}
											onClick={() =>
												exportReportPdf(option.mode)
											}
											className='w-full px-4 py-3 text-left text-xs font-semibold'
											style={{
												color: 'var(--text)',
												borderBottom:
													option.mode === 'week' ||
													option.mode === 'month'
														? '1px solid var(--line)'
														: 'none',
											}}>
											{option.label}
										</button>
									))}
								</div>
							)}
						</div>
						{exportError && (
							<div
								className='text-xs mb-4'
								style={{ color: 'var(--orange)' }}>
								Nao foi possivel abrir a janela de impressao.
								Permita pop-ups para exportar o PDF.
							</div>
						)}

						<div className='grid grid-cols-3 gap-2 mb-6'>
							<div
								className='rounded-xl p-3'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
								}}>
								<div
									className='text-[9px] tracking-widest'
									style={{ color: 'var(--text-dim)' }}>
									RECEITA
								</div>
								<div
									className='text-base font-semibold mt-1'
									style={{ color: 'var(--green)' }}>
									€{formatMoney(reportData.income)}
								</div>
							</div>
							<div
								className='rounded-xl p-3'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
								}}>
								<div
									className='text-[9px] tracking-widest'
									style={{ color: 'var(--text-dim)' }}>
									DESPESA
								</div>
								<div
									className='text-base font-semibold mt-1'
									style={{ color: 'var(--orange)' }}>
									€{formatMoney(reportData.expense)}
								</div>
							</div>
							<div
								className='rounded-xl p-3'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
								}}>
								<div
									className='text-[9px] tracking-widest'
									style={{ color: 'var(--text-dim)' }}>
									SALDO LÍQUIDO
								</div>
								<div
									className='text-base font-semibold mt-1'
									style={{
										color:
											reportData.net < 0
												? 'var(--orange)'
												: 'var(--text)',
									}}>
									€{formatMoney(reportData.net)}
								</div>
							</div>
						</div>

						<div
							className='text-[11px] tracking-widest mb-3'
							style={{ color: 'var(--text-dim)' }}>
							RECEITA POR CATEGORIA
						</div>
						{reportData.incomeCatArr.length === 0 ? (
							<div
								className='text-xs mb-4'
								style={{ color: 'var(--text-dim)' }}>
								Sem receitas registradas para este mês.
							</div>
						) : (
							<div className='space-y-3 mb-6'>
								{reportData.incomeCatArr.map((c) => (
									<div key={c.label}>
										<div className='flex justify-between text-xs mb-1'>
											<span>{c.label}</span>
											<span
												style={{
													color: 'var(--text-dim)',
												}}>
												€{formatMoney(c.total)}
											</span>
										</div>
										<div
											className='h-2 rounded-full overflow-hidden'
											style={{
												background: 'var(--bg-raised)',
											}}>
											<div
												className='h-full rounded-full'
												style={{
													width: `${(c.total / reportData.maxIncomeCat) * 100}%`,
													background: 'var(--green)',
												}}
											/>
										</div>
									</div>
								))}
							</div>
						)}

						<div
							className='text-[11px] tracking-widest mb-3'
							style={{ color: 'var(--text-dim)' }}>
							DESPESAS POR CATEGORIA
						</div>
						{reportData.catArr.length === 0 ? (
							<div
								className='text-xs'
								style={{ color: 'var(--text-dim)' }}>
								Sem despesas registradas para este mês.
							</div>
						) : (
							<div className='space-y-3 mb-4'>
								{reportData.catArr.map((c) => (
									<div key={c.label}>
										<div className='flex justify-between text-xs mb-1'>
											<span>{c.label}</span>
											<span
												style={{
													color: 'var(--text-dim)',
												}}>
												€{formatMoney(c.total)}
											</span>
										</div>
										<div
											className='h-2 rounded-full overflow-hidden'
											style={{
												background: 'var(--bg-raised)',
											}}>
											<div
												className='h-full rounded-full'
												style={{
													width: `${(c.total / reportData.maxCat) * 100}%`,
													background: 'var(--orange)',
												}}
											/>
										</div>
									</div>
								))}
							</div>
						)}

						<div
							className='text-[11px] tracking-widest mt-6'
							style={{ color: 'var(--text-dim)' }}>
							{reportData.count}{' '}
							{reportData.count === 1 ? 'ENTRADA' : 'ENTRADAS'}{' '}
							ESTE MÊS
						</div>
					</div>
				)}

				{/* ---- ADD TRANSACTION SHEET ---- */}
				{sheetOpen && (
					<div className='absolute inset-0 z-20 flex flex-col justify-end sl-fade-enter'>
						<div
							className='absolute inset-0'
							style={{ background: 'rgba(0,0,0,0.55)' }}
							onClick={closeSheet}
						/>
						<div
							className='relative rounded-t-3xl p-5 pb-8 sl-sheet-enter'
							style={{
								background: 'var(--bg-raised)',
								border: '1px solid var(--line)',
								borderBottom: 'none',
								maxHeight: '92dvh',
								overflowY: 'auto',
								WebkitOverflowScrolling: 'touch',
							}}>
							<div className='flex items-center justify-between mb-1'>
								<div
									className='sl-display text-2xl'
									style={{ color: 'var(--yellow)' }}>
									{editingId
										? 'EDITAR ENTRADA'
										: 'NOVA ENTRADA'}
								</div>
								<button
									onClick={closeSheet}
									className='w-8 h-8 rounded-full flex items-center justify-center'
									style={{ background: 'var(--bg-card)' }}>
									<X size={16} />
								</button>
							</div>
							<div
								className='flex items-center gap-1.5 mb-4 text-xs'
								style={{ color: 'var(--text-dim)' }}>
								<Layers size={12} />
								{editingId ? 'Projeto: ' : 'Adicionando em: '}
								<span style={{ color: 'var(--text)' }}>
									{editingId
										? projects.find(
												(p) =>
													p.id ===
													transactions.find(
														(t) =>
															t.id === editingId,
													)?.projectId,
											)?.name || 'Geral'
										: selectedProjectName}
								</span>
							</div>

							{/* Type toggle */}
							<div
								className='flex rounded-xl p-1 mb-4'
								style={{ background: 'var(--bg-card)' }}>
								{['expense', 'income'].map((t) => (
									<button
										key={t}
										onClick={() => {
											setTxType(t as TransactionType);
											setCategory(null);
										}}
										className='flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-widest sl-chip'
										style={{
											background:
												txType === t
													? t === 'expense'
														? 'var(--orange)'
														: 'var(--green)'
													: 'transparent',
											color:
												txType === t
													? '#1c1b19'
													: 'var(--text-dim)',
										}}>
										{t === 'expense'
											? 'DESPESA'
											: 'RECEITA'}
									</button>
								))}
							</div>

							{/* Amount display */}
							<div className='text-center mb-4'>
								<div
									className='sl-display text-5xl'
									style={{
										color: amount
											? 'var(--text)'
											: 'var(--text-dim)',
									}}>
									€{amount || '0'}
								</div>
							</div>

							{/* Category chips */}
							<div className='flex flex-wrap gap-2 mb-4'>
								{activeCats.map((c) => (
									<button
										key={c.id}
										onClick={() => setCategory(c.id)}
										className='px-3 py-2 rounded-lg text-xs sl-chip'
										style={{
											background:
												category === c.id
													? 'var(--yellow)'
													: 'var(--bg-card)',
											color:
												category === c.id
													? '#1c1b19'
													: 'var(--text)',
											border:
												'1px solid ' +
												(category === c.id
													? 'var(--yellow)'
													: 'var(--line)'),
											fontWeight:
												category === c.id ? 600 : 400,
										}}>
										{c.label}
									</button>
								))}

								{/* Category management buttons */}
								<button
									className='px-3 py-2 rounded-lg text-xs sl-chip'
									style={{
										background: 'var(--bg-card)',
										color: 'var(--text-dim)',
										border: '1px solid var(--line)',
									}}
									onClick={() => setManageOpen(true)}
									title='Manage categories'>
									<Settings2 size={12} />
								</button>
							</div>

							{/* Description */}
							<input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='Descrição (opcional)'
								className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
									color: 'var(--text)',
								}}
							/>

							<div className='flex items-center gap-3 mb-4'>
								<label
									className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs cursor-pointer'
									style={{
										background: 'var(--bg-card)',
										border: '1px solid var(--line)',
										color: 'var(--text)',
									}}>
									<Camera size={14} />
									{photoDraft ? 'Trocar foto' : 'Anexar foto do recibo'}
									<input
										type='file'
										accept='image/*'
										capture='environment'
										onChange={handlePhotoChange}
										className='hidden'
									/>
								</label>
								{photoDraft && (
									<div className='relative w-11 h-11 rounded-lg overflow-hidden shrink-0'>
										<img
											src={photoDraft}
											alt='Recibo'
											className='w-full h-full object-cover'
										/>
										<button
											type='button'
											onClick={handleRemovePhoto}
											className='absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center'
											style={{ background: 'var(--orange)', color: '#1c1b19' }}>
											<X size={12} />
										</button>
									</div>
								)}
							</div>

							{photoError && (
								<div
									className='text-xs mb-3 text-center'
									style={{ color: 'var(--orange)' }}>
									{photoError}
								</div>
							)}

							{saveError && (
								<div
									className='text-xs mb-3 text-center'
									style={{ color: 'var(--orange)' }}>
									Digite um valor e escolha uma categoria para
									salvar.
								</div>
							)}

							{/* Keypad */}
							<div className='grid grid-cols-3 gap-2 mb-4'>
								{[
									'1',
									'2',
									'3',
									'4',
									'5',
									'6',
									'7',
									'8',
									'9',
									'.',
									'0',
									'back',
								].map((k) => (
									<button
										key={k}
										onClick={() =>
											k === 'back'
												? backspace()
												: pressDigit(k)
										}
										className='sl-keypad-btn rounded-xl py-3.5 flex items-center justify-center text-lg font-medium'
										style={{
											background: 'var(--bg-card)',
											border: '1px solid var(--line)',
										}}>
										{k === 'back' ? (
											<Delete size={18} />
										) : (
											k
										)}
									</button>
								))}
							</div>

							<button
								onClick={handleSave}
								className='w-full rounded-xl py-3.5 text-sm font-bold tracking-widest'
								style={{
									background: canSave
										? 'var(--yellow)'
										: 'var(--bg-card)',
									color: canSave
										? '#1c1b19'
										: 'var(--text-dim)',
									border: canSave
										? 'none'
										: '1px solid var(--line)',
								}}>
								{editingId
									? 'GUARDAR ALTERAÇÕES'
									: 'GUARDAR LANÇAMENTO'}
							</button>

							{editingId && (
								<div className='mt-3'>
									{sheetDeleteConfirm ? (
										<div
											className='flex items-center justify-between px-4 py-3 rounded-xl'
											style={{
												background: 'var(--bg-card)',
												border: '1px solid var(--line)',
											}}>
											<span
												className='text-xs'
												style={{
													color: 'var(--text-dim)',
												}}>
												Excluir esta entrada?
											</span>
											<div className='flex gap-2'>
												<button
													onClick={() =>
														setSheetDeleteConfirm(
															false,
														)
													}
													className='text-xs px-3 py-1.5 rounded-md'
													style={{
														background:
															'var(--bg-raised)',
														color: 'var(--text)',
													}}>
													Cancelar
												</button>
												<button
													onClick={
														handleDeleteFromSheet
													}
													className='text-xs px-3 py-1.5 rounded-md'
													style={{
														background:
															'var(--orange)',
														color: '#1c1b19',
													}}>
													Excluir
												</button>
											</div>
										</div>
									) : (
										<button
											onClick={() =>
												setSheetDeleteConfirm(true)
											}
											className='w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold tracking-widest'
											style={{ color: 'var(--orange)' }}>
											<Trash2 size={14} />
											EXCLUIR ENTRADA
										</button>
									)}
								</div>
							)}
						</div>
					</div>
				)}

				{/* ---- ADD PROJECT MODAL ---- */}
				{addProjectOpen && (
					<div className='absolute inset-0 z-30 flex items-center justify-center px-6 sl-fade-enter'>
						<div
							className='absolute inset-0'
							style={{ background: 'rgba(0,0,0,0.55)' }}
							onClick={() => {
								setAddProjectOpen(false);
								setNewProjectName('');
							}}
						/>
						<div
							className='relative w-full rounded-2xl p-5'
							style={{
								background: 'var(--bg-raised)',
								border: '1px solid var(--line)',
							}}>
							<div
								className='sl-display text-2xl mb-3'
								style={{ color: 'var(--yellow)' }}>
								NOVO PROJETO
							</div>
							<input
								autoFocus
								value={newProjectName}
								onChange={(e) =>
									setNewProjectName(e.target.value)
								}
								onKeyDown={(e) =>
									e.key === 'Enter' && handleAddProject()
								}
								placeholder='ex. Reforma Rua das Flores'
								className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
									color: 'var(--text)',
								}}
							/>
							<div className='flex gap-2'>
								<button
									onClick={() => {
										setAddProjectOpen(false);
										setNewProjectName('');
									}}
									className='flex-1 rounded-xl py-3 text-xs font-semibold tracking-widest'
									style={{
										background: 'var(--bg-card)',
										color: 'var(--text-dim)',
										border: '1px solid var(--line)',
									}}>
									CANCELAR
								</button>
								<button
									onClick={handleAddProject}
									disabled={!newProjectName.trim()}
									className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
									style={{
										background: newProjectName.trim()
											? 'var(--yellow)'
											: 'var(--bg-card)',
										color: newProjectName.trim()
											? '#1c1b19'
											: 'var(--text-dim)',
										border: newProjectName.trim()
											? 'none'
											: '1px solid var(--line)',
									}}>
									CRIAR
								</button>
							</div>
						</div>
					</div>
				)}

				{/* ---- PROFILE MODAL ---- */}
				{profileOpen && (
					<div className='absolute inset-0 z-30 flex items-center justify-center px-6 sl-fade-enter'>
						<div
							className='absolute inset-0'
							style={{ background: 'rgba(0,0,0,0.55)' }}
							onClick={closeProfile}
						/>
						<div
							className='relative w-full rounded-2xl p-5'
							style={{
								background: 'var(--bg-raised)',
								border: '1px solid var(--line)',
							}}>
							<div
								className='sl-display text-2xl mb-4'
								style={{ color: 'var(--yellow)' }}>
								PERFIL
							</div>

							<div className='flex justify-center mb-4'>
								<label
									className='relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer border'
									style={{
										borderColor: 'var(--line)',
										background: 'var(--bg-card)',
									}}>
									{profileLogoDraft ? (
										<img
											src={profileLogoDraft}
											alt='Logotipo'
											className='w-full h-full object-cover'
										/>
									) : (
										<User
											size={36}
											color='var(--text-dim)'
										/>
									)}
									<div
										className='absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5'
										style={{
											background: 'rgba(0,0,0,0.55)',
										}}>
										<Camera size={14} color='#fff' />
									</div>
									<input
										type='file'
										accept='image/*'
										onChange={handleProfilePhotoChange}
										className='hidden'
									/>
								</label>
							</div>

							<input
								value={profileNameDraft}
								onChange={(e) =>
									setProfileNameDraft(e.target.value)
								}
								placeholder='Nome da empresa'
								className='w-full rounded-lg px-3 py-2.5 text-sm mb-4 outline-none'
								style={{
									background: 'var(--bg-card)',
									border: '1px solid var(--line)',
									color: 'var(--text)',
								}}
							/>

							<div className='flex gap-2'>
								<button
									onClick={closeProfile}
									className='flex-1 rounded-xl py-3 text-xs font-semibold tracking-widest'
									style={{
										background: 'var(--bg-card)',
										color: 'var(--text-dim)',
										border: '1px solid var(--line)',
									}}>
									CANCELAR
								</button>
								<button
									onClick={handleSaveProfile}
									className='flex-1 rounded-xl py-3 text-xs font-bold tracking-widest'
									style={{
										background: 'var(--yellow)',
										color: '#1c1b19',
									}}>
									GUARDAR
								</button>
							</div>

							{isAdmin && (
								<div className="flex">
									<a
										href='/admin'
										className='w-full rounded-xl py-3 text-xs font-semibold tracking-widest mt-2 text-center'
										style={{
											background: 'var(--bg-card)',
											color: 'var(--blue)',
											border: '1px solid var(--line)',
										}}>
										ADMIN DASHBOARD
									</a>
								</div>
							)}
							
							<button
								onClick={handleLogout}
								className='w-full rounded-xl py-3 text-xs font-semibold tracking-widest mt-2'
								style={{
									background: 'var(--bg-card)',
									color: 'var(--orange)',
									border: '1px solid var(--line)',
								}}>
								SAIR
							</button>
						</div>
					</div>
				)}

				{/* ---- MANAGE PROJECTS MODAL ---- */}
				{manageOpen && (
					<div className='absolute inset-0 z-30 flex items-end sl-fade-enter'>
						<div
							className='absolute inset-0'
							style={{ background: 'rgba(0,0,0,0.55)' }}
							onClick={() => {
								setManageOpen(false);
								setManageConfirmId(null);
							}}
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
								<div
									className='sl-display text-2xl'
									style={{ color: 'var(--yellow)' }}>
									GERIR PROJETOS
								</div>
								<button
									onClick={() => {
										setManageOpen(false);
										setManageConfirmId(null);
									}}
									className='w-8 h-8 rounded-full flex items-center justify-center'
									style={{ background: 'var(--bg-card)' }}>
									<X size={16} />
								</button>
							</div>

							<div className='space-y-2'>
								{projects.map((p) => (
									<div
										key={p.id}
										className='rounded-xl overflow-hidden'
										style={{
											background: 'var(--bg-card)',
											border: '1px solid var(--line)',
										}}>
										{manageConfirmId === p.id ? (
											<div className='flex items-center justify-between px-4 py-3'>
												<span
													className='text-xs'
													style={{
														color: 'var(--text-dim)',
													}}>
													Excluir "{p.name}"? As
													entradas permanecerão em
													Geral.
												</span>
												<div className='flex gap-2 shrink-0 ml-2'>
													<button
														onClick={() =>
															setManageConfirmId(
																null,
															)
														}
														className='text-xs px-3 py-1.5 rounded-md'
														style={{
															background:
																'var(--bg-raised)',
															color: 'var(--text)',
														}}>
														Cancelar
													</button>
													<button
														onClick={() =>
															handleDeleteProject(
																p.id,
															)
														}
														className='text-xs px-3 py-1.5 rounded-md'
														style={{
															background:
																'var(--orange)',
															color: '#1c1b19',
														}}>
														Excluir
													</button>
												</div>
											</div>
										) : (
											<div className='flex items-center justify-between px-4 py-3'>
												<div className='min-w-0'>
													<div className='text-sm truncate'>
														{p.name}
													</div>
													<div
														className='text-[10px]'
														style={{
															color:
																p.status ===
																'ended'
																	? 'var(--text-dim)'
																	: 'var(--green)',
														}}>
														{p.status === 'ended'
															? 'ENDED'
															: 'ACTIVE'}
													</div>
												</div>
												<div className='flex gap-2 shrink-0 ml-2'>
													<button
														onClick={() =>
															handleToggleEndProject(
																p.id,
															)
														}
														className='w-8 h-8 rounded-lg flex items-center justify-center'
														style={{
															background:
																'var(--bg-raised)',
															border: '1px solid var(--line)',
														}}
														title={
															p.status === 'ended'
																? 'Reactivate'
																: 'End project'
														}>
														{p.status ===
														'ended' ? (
															<RotateCcw
																size={14}
																color='var(--text-dim)'
															/>
														) : (
															<Flag
																size={14}
																color='var(--text-dim)'
															/>
														)}
													</button>
													<button
														onClick={() =>
															setManageConfirmId(
																p.id,
															)
														}
														className='w-8 h-8 rounded-lg flex items-center justify-center'
														style={{
															background:
																'var(--bg-raised)',
															border: '1px solid var(--line)',
														}}
														title='Excluir projeto'>
														<Trash2
															size={14}
															color='var(--orange)'
														/>
													</button>
												</div>
											</div>
										)}
									</div>
								))}
							</div>

							{/* Categories management */}
							<div className='mt-6'>
								<div className='flex items-center justify-between mb-3'>
									<div
										className='sl-display text-xl'
										style={{ color: 'var(--yellow)' }}>
										GERIR CATEGORIAS
									</div>
								</div>
								<div
									className='rounded-xl p-4'
									style={{
										background: 'var(--bg-card)',
										border: '1px solid var(--line)',
									}}>
									<div className='mb-3'>
										<input
											value={newCategoryLabel}
											onChange={(e) =>
												setNewCategoryLabel(
													e.target.value,
												)
											}
											placeholder='Nome da categoria (ex. Rebarcas)'
											className='w-full rounded-lg px-3 py-2.5 text-sm mb-2 outline-none'
											style={{
												background: 'var(--bg-raised)',
												border: '1px solid var(--line)',
												color: 'var(--text)',
											}}
											onKeyDown={(e) =>
												e.key === 'Enter' &&
												handleAddCategory()
											}
										/>
										<div className='flex items-center gap-2 mb-2'>
											<button
												onClick={() =>
													setNewCategoryType(
														'expense',
													)
												}
												className='px-3 py-2 rounded-lg text-xs'
												style={{
													background:
														newCategoryType ===
														'expense'
															? 'var(--yellow)'
															: 'var(--bg-card)',
													color:
														newCategoryType ===
														'expense'
															? '#1c1b19'
															: 'var(--text)',
												}}>
												Despesa
											</button>
											<button
												onClick={() =>
													setNewCategoryType('income')
												}
												className='px-3 py-2 rounded-lg text-xs'
												style={{
													background:
														newCategoryType ===
														'income'
															? 'var(--yellow)'
															: 'var(--bg-card)',
													color:
														newCategoryType ===
														'income'
															? '#1c1b19'
															: 'var(--text)',
												}}>
												Receita
											</button>
											<div className='flex-1' />
											<button
												onClick={handleAddCategory}
												className='px-3 py-2 rounded-lg text-xs font-bold'
												style={{
													background:
														newCategoryLabel.trim()
															? 'var(--yellow)'
															: 'var(--bg-card)',
													color: newCategoryLabel.trim()
														? '#1c1b19'
														: 'var(--text-dim)',
												}}>
												Adicionar
											</button>
										</div>
									</div>

									<div className='space-y-3'>
										{/* Expense categories */}
										<div>
											<div
												className='text-xs text-[10px] tracking-widest'
												style={{
													color: 'var(--text-dim)',
													marginBottom: 6,
												}}>
												DESPESAS
											</div>
											{categories.expense.map((c) => (
												<div
													key={c.id}
													className='flex items-center justify-between px-3 py-2 rounded-md'
													style={{
														background:
															'var(--bg-raised)',
														border: '1px solid var(--line)',
													}}>
													<div className='min-w-0'>
														<div className='text-sm truncate'>
															{c.label}
														</div>
														<div
															className='text-[10px]'
															style={{
																color: 'var(--text-dim)',
															}}>
															{c.tag}
														</div>
													</div>
													<div className='flex gap-2'>
														{manageConfirmCatId ===
														c.id ? (
															<>
																<button
																	onClick={() =>
																		setManageConfirmCatId(
																			null,
																		)
																	}
																	className='px-3 py-1 rounded-md'
																	style={{
																		background:
																			'var(--bg-card)',
																		color: 'var(--text)',
																	}}>
																	Cancelar
																</button>
																<button
																	onClick={() =>
																		handleDeleteCategory(
																			'expense',
																			c.id,
																		)
																	}
																	className='px-3 py-1 rounded-md'
																	style={{
																		background:
																			'var(--orange)',
																		color: '#1c1b19',
																	}}>
																	Excluir
																</button>
															</>
														) : (
															<button
																onClick={() =>
																	setManageConfirmCatId(
																		c.id,
																	)
																}
																className='px-3 py-1 rounded-md'
																style={{
																	background:
																		'var(--bg-card)',
																	color: 'var(--text)',
																}}>
																<Trash2
																	size={14}
																	color='var(--orange)'
																/>
															</button>
														)}
													</div>
												</div>
											))}
										</div>

										{/* Income categories */}
										<div>
											<div
												className='text-xs text-[10px] tracking-widest'
												style={{
													color: 'var(--text-dim)',
													marginBottom: 6,
												}}>
												RECEITAS
											</div>
											{categories.income.map((c) => (
												<div
													key={c.id}
													className='flex items-center justify-between px-3 py-2 rounded-md'
													style={{
														background:
															'var(--bg-raised)',
														border: '1px solid var(--line)',
													}}>
													<div className='min-w-0'>
														<div className='text-sm truncate'>
															{c.label}
														</div>
														<div
															className='text-[10px]'
															style={{
																color: 'var(--text-dim)',
															}}>
															{c.tag}
														</div>
													</div>
													<div className='flex gap-2'>
														{manageConfirmCatId ===
														c.id ? (
															<>
																<button
																	onClick={() =>
																		setManageConfirmCatId(
																			null,
																		)
																	}
																	className='px-3 py-1 rounded-md'
																	style={{
																		background:
																			'var(--bg-card)',
																		color: 'var(--text)',
																	}}>
																	Cancelar
																</button>
																<button
																	onClick={() =>
																		handleDeleteCategory(
																			'income',
																			c.id,
																		)
																	}
																	className='px-3 py-1 rounded-md'
																	style={{
																		background:
																			'var(--orange)',
																		color: '#1c1b19',
																	}}>
																	Excluir
																</button>
															</>
														) : (
															<button
																onClick={() =>
																	setManageConfirmCatId(
																		c.id,
																	)
																}
																className='px-3 py-1 rounded-md'
																style={{
																	background:
																		'var(--bg-card)',
																	color: 'var(--text)',
																}}>
																<Trash2
																	size={14}
																	color='var(--orange)'
																/>
															</button>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
