import { useMemo, useState } from 'react';
import {
	buildReportData,
	getExportPeriod,
	type ReportPeriod,
} from '../../reporting';
import type { ExportReportMode } from '../../export-options';
import { PRINT_WINDOW_FEATURES } from '../../print-window';
import { buildPrintableReportHtml } from '../print-templates';
import type { Transaction } from '../types';

export function useReports({
	reportMonthDate,
	reportPeriod,
	scopedTransactions,
	selectedProjectName,
}: {
	reportMonthDate: Date;
	reportPeriod: ReportPeriod;
	scopedTransactions: Transaction[];
	selectedProjectName: string;
}) {
	const [exportError, setExportError] = useState(false);
	const [exportMenuOpen, setExportMenuOpen] = useState(false);

	const reportData = useMemo(
		() => buildReportData(scopedTransactions, reportPeriod),
		[scopedTransactions, reportPeriod],
	);

	const exportReportPdf = (mode: ExportReportMode) => {
		// `now` is frozen at mount; use the click time so a long-open tab still
		// exports the current week.
		const period = getExportPeriod(mode, new Date(), reportMonthDate);
		const data = buildReportData(scopedTransactions, period);
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

	return {
		exportError,
		exportMenuOpen,
		setExportMenuOpen,
		reportData,
		exportReportPdf,
	};
}
