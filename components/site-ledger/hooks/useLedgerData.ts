import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	EXPENSE_CATEGORIES,
	INCOME_CATEGORIES,
	type Category,
} from '@/lib/default-categories';
import { filterByPeriod, type ReportPeriod } from '../../reporting';
import {
	GENERAL,
	type InvoiceSummary,
	type Project,
	type SavedCategories,
	type Transaction,
	type TransactionType,
} from '../types';
import { api, todayKey } from '../utils';

export function useLedgerData({ period }: { period: ReportPeriod }) {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProject, setSelectedProject] = useState(GENERAL);
	const [categories, setCategories] = useState<SavedCategories>({
		expense: EXPENSE_CATEGORIES,
		income: INCOME_CATEGORIES,
	});
	const [companyName, setCompanyName] = useState('');
	const [companyLogo, setCompanyLogo] = useState<string | null>(null);
	const [invoicedTransactionIds, setInvoicedTransactionIds] = useState<
		Set<string>
	>(new Set());
	const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

	useEffect(() => {
		const load = async () => {
			try {
				const stateRes = await api('/api/state');
				const data = await stateRes.json();
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
				setInvoicedTransactionIds(
					new Set<string>(data.invoicedTransactionIds || []),
				);
			} catch (error) {
				console.error('Failed to load data:', error);
			} finally {
				setLoaded(true);
			}

			// Fetched separately so a failure here (network blip,
			// un-migrated table, etc.) doesn't blank the whole app — the
			// primary state above has already been applied by this point.
			try {
				const invoicesRes = await api('/api/invoices');
				const invoicesData = await invoicesRes.json();
				setInvoices(invoicesData.invoices || []);
			} catch (error) {
				console.error('Failed to load invoices:', error);
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
		async (
			id: string,
			patch: Omit<Transaction, 'id' | 'createdAt' | 'projectId'>,
		) => {
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
				prev.map((t) =>
					t.projectId === id ? { ...t, projectId: null } : t,
				),
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

	const recordInvoice = useCallback(
		(invoice: InvoiceSummary, transactionIds: string[]) => {
			setInvoicedTransactionIds((prev) => {
				const next = new Set(prev);
				transactionIds.forEach((id) => next.add(id));
				return next;
			});
			setInvoices((prev) => [invoice, ...prev]);
		},
		[],
	);

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

	const scopedTransactions = useMemo(
		() =>
			selectedProject === GENERAL
				? transactions
				: transactions.filter((t) => t.projectId === selectedProject),
		[transactions, selectedProject],
	);

	const grouped = useMemo(() => {
		const sorted = filterByPeriod(scopedTransactions, period).sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
	}, [scopedTransactions, period]);

	const selectedProjectName =
		selectedProject === GENERAL
			? 'Geral'
			: projects.find((p) => p.id === selectedProject)?.name || 'Geral';

	return {
		transactions,
		loaded,
		projects,
		selectedProject,
		categories,
		companyName,
		companyLogo,
		invoicedTransactionIds,
		invoices,
		selectProject: changeSelectedProject,
		createTransaction,
		updateTransaction,
		deleteTransaction,
		createProject,
		updateProjectStatus,
		deleteProject,
		createCategory,
		deleteCategory,
		persistProfile,
		recordInvoice,
		balance,
		scopedTransactions,
		grouped,
		selectedProjectName,
	};
}
