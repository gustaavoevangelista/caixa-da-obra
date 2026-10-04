import { useMemo, useState } from 'react';
import {
	buildReportData,
	getExportPeriod,
	getMonthPeriod,
} from '../../reporting';
import type { ExportReportMode } from '../../export-options';
import { PRINT_WINDOW_FEATURES } from '../../print-window';
import { buildPrintableReportHtml } from '../print-templates';
import type { Transaction } from '../types';

export function useReports({
	now,
	scopedTransactions,
	selectedProjectName,
}: {
	now: Date;
	scopedTransactions: Transaction[];
	selectedProjectName: string;
}) {
	const [monthOffset, setMonthOffset] = useState(0);
	const [exportError, setExportError] = useState(false);
	const [exportMenuOpen, setExportMenuOpen] = useState(false);

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
		monthOffset,
		setMonthOffset,
		exportError,
		exportMenuOpen,
		setExportMenuOpen,
		reportMonthDate,
		reportPeriod,
		reportData,
		currentMonthLabel,
		exportReportPdf,
	};
}
