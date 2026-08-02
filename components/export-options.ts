export type ExportReportMode = 'month' | 'year';

export const EXPORT_REPORT_LABEL = 'Exportar relatório';

export const EXPORT_REPORT_OPTIONS: Array<{
	mode: ExportReportMode;
	label: string;
}> = [
	{ mode: 'month', label: 'Relatório mensal' },
	{ mode: 'year', label: 'Relatório anual' },
];
