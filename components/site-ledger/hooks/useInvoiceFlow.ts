import { useMemo, useState } from 'react';
import { sumTransactionAmounts } from '../../invoices';
import { PRINT_WINDOW_FEATURES } from '../../print-window';
import { buildPrintableInvoiceHtml } from '../print-templates';
import { GENERAL, type InvoiceDetail, type InvoiceSummary, type Transaction } from '../types';
import { api } from '../utils';

export function useInvoiceFlow({
	scopedTransactions,
	invoicedTransactionIds,
	selectedProject,
	companyName,
	recordInvoice,
}: {
	scopedTransactions: Transaction[];
	invoicedTransactionIds: Set<string>;
	selectedProject: string;
	companyName: string;
	recordInvoice: (invoice: InvoiceSummary, transactionIds: string[]) => void;
}) {
	const [invoiceSelection, setInvoiceSelection] = useState<Set<string>>(
		new Set(),
	);
	const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
	const [invoiceHistoryOpen, setInvoiceHistoryOpen] = useState(false);
	const [invoiceClientName, setInvoiceClientName] = useState('');
	const [invoiceClientNif, setInvoiceClientNif] = useState('');
	const [invoiceDescription, setInvoiceDescription] = useState('');
	const [invoiceError, setInvoiceError] = useState<string | null>(null);
	const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

	const invoiceCandidates = useMemo(
		() =>
			scopedTransactions.filter(
				(t) => t.type === 'income' && !invoicedTransactionIds.has(t.id),
			),
		[scopedTransactions, invoicedTransactionIds],
	);

	const selectedInvoiceTransactions = useMemo(
		() => invoiceCandidates.filter((t) => invoiceSelection.has(t.id)),
		[invoiceCandidates, invoiceSelection],
	);

	const invoiceSelectionTotal = useMemo(
		() => sumTransactionAmounts(selectedInvoiceTransactions),
		[selectedInvoiceTransactions],
	);

	const toggleInvoiceSelection = (id: string) => {
		setInvoiceSelection((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const openInvoiceSheet = () => {
		setInvoiceClientName('');
		setInvoiceClientNif('');
		setInvoiceDescription('');
		setInvoiceError(null);
		setInvoiceSheetOpen(true);
	};

	const closeInvoiceSheet = () => setInvoiceSheetOpen(false);

	// Populates an already-open window (opened synchronously within a user
	// gesture by the caller, to avoid popup blockers) with the invoice's
	// printable content.
	const openInvoicePrintWindow = (previewWindow: Window, invoice: InvoiceDetail) => {
		const html = buildPrintableInvoiceHtml(invoice, companyName);
		const blob = new Blob([html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		previewWindow.addEventListener('load', () => URL.revokeObjectURL(url), {
			once: true,
		});
		previewWindow.location.href = url;
		previewWindow.focus();
	};

	const handleGenerateInvoice = async () => {
		const clientName = invoiceClientName.trim();
		const clientNif = invoiceClientNif.trim();
		const invoiceWorkDescription = invoiceDescription.trim();
		if (
			!clientName ||
			!clientNif ||
			!invoiceWorkDescription ||
			selectedInvoiceTransactions.length === 0
		) {
			setInvoiceError(
				'Preencha cliente, NIF e descrição, e selecione ao menos uma entrada.',
			);
			return;
		}

		// Open the print window synchronously, within the click gesture, so
		// popup blockers (Safari/iOS, Chrome transient-activation rules)
		// don't block it. It gets navigated to the real content once the
		// invoice is created below.
		const previewWindow = window.open('', '_blank', PRINT_WINDOW_FEATURES);
		if (!previewWindow) {
			setInvoiceError(
				'Não foi possível abrir a janela de impressão. Permita pop-ups para exportar o PDF.',
			);
		} else {
			setInvoiceError(null);
		}

		setInvoiceSubmitting(true);
		try {
			const res = await api('/api/invoices', {
				method: 'POST',
				body: JSON.stringify({
					clientName,
					clientNif,
					description: invoiceWorkDescription,
					transactionIds: selectedInvoiceTransactions.map((t) => t.id),
					projectId: selectedProject === GENERAL ? null : selectedProject,
				}),
			});
			const invoice: InvoiceDetail = await res.json();

			recordInvoice(
				{
					id: invoice.id,
					number: invoice.number,
					clientName: invoice.clientName,
					total: invoice.total,
					issuedAt: invoice.issuedAt,
				},
				selectedInvoiceTransactions.map((t) => t.id),
			);
			setInvoiceSelection(new Set());
			setInvoiceSheetOpen(false);
			// The invoice was created regardless of whether the print window
			// was available — only populate it if it is.
			if (previewWindow) {
				openInvoicePrintWindow(previewWindow, invoice);
			}
		} catch (error) {
			// Don't leave a blank tab open if invoice creation failed.
			if (previewWindow) previewWindow.close();
			if (error instanceof Error && error.message.includes('409')) {
				setInvoiceError(
					'Uma ou mais entradas selecionadas já foram faturadas. Atualize a página e tente novamente.',
				);
			} else {
				console.error('Failed to generate invoice:', error);
				setInvoiceError('Não foi possível gerar a fatura. Tente novamente.');
			}
		} finally {
			setInvoiceSubmitting(false);
		}
	};

	const openInvoicePrintWindowById = async (id: string) => {
		// Open synchronously within the click gesture so popup blockers
		// don't block it; if it's blocked there's no point fetching.
		const previewWindow = window.open('', '_blank', PRINT_WINDOW_FEATURES);
		if (!previewWindow) {
			setInvoiceError(
				'Não foi possível abrir a janela de impressão. Permita pop-ups para exportar o PDF.',
			);
			return;
		}
		setInvoiceError(null);
		try {
			const res = await api(`/api/invoices/${id}`);
			const invoice: InvoiceDetail = await res.json();
			openInvoicePrintWindow(previewWindow, invoice);
		} catch (error) {
			previewWindow.close();
			console.error('Failed to load invoice:', error);
			setInvoiceError('Não foi possível abrir a fatura.');
		}
	};

	return {
		invoiceSelection,
		invoiceSheetOpen,
		invoiceHistoryOpen,
		setInvoiceHistoryOpen,
		invoiceClientName,
		setInvoiceClientName,
		invoiceClientNif,
		setInvoiceClientNif,
		invoiceDescription,
		setInvoiceDescription,
		invoiceError,
		invoiceSubmitting,
		invoiceCandidates,
		selectedInvoiceTransactions,
		invoiceSelectionTotal,
		toggleInvoiceSelection,
		openInvoiceSheet,
		closeInvoiceSheet,
		handleGenerateInvoice,
		openInvoicePrintWindowById,
	};
}
