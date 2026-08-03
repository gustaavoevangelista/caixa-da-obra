export type ExportReportMode = 'month' | 'week' | 'year';

export const EXPORT_REPORT_LABEL = 'Exportar relatório';

export const EXPORT_REPORT_OPTIONS: Array<{
	mode: ExportReportMode;
	label: string;
}> = [
	{ mode: 'week', label: 'Relatório semanal' },
	{ mode: 'month', label: 'Relatório mensal' },
	{ mode: 'year', label: 'Relatório anual' },
];
