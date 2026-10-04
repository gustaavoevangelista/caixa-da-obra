import type { ReportData, ReportPeriod } from '../reporting';
import type { InvoiceDetail } from './types';
import { escapeHtml, formatMoney } from './utils';

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
					const date = new Date(item.createdAt).toLocaleDateString(
						'pt-PT',
					);
					const sign = item.type === 'income' ? '+' : '-';
					return `<tr><td data-label="Data">${escapeHtml(date)}</td><td data-label="Categoria">${escapeHtml(item.categoryLabel)}</td><td data-label="Descrição">${escapeHtml(item.description || '-')}</td><td class="money" data-label="Valor">${sign}€${formatMoney(item.amount)}</td></tr>`;
				})
				.join('')
		: '<tr><td colspan="4" class="muted">Sem entradas neste periodo.</td></tr>';

export const buildPrintableReportHtml = (
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

export const buildPrintableInvoiceHtml = (
	invoice: InvoiceDetail,
	companyName: string,
) => `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	<title>${escapeHtml(`Fatura ${invoice.number}`)}</title>
	<style>
		body { font-family: Arial, sans-serif; color: #1f2933; margin: 32px; }
		header { border-bottom: 2px solid #d6a900; padding-bottom: 16px; margin-bottom: 24px; }
		h1 { margin: 0 0 8px; font-size: 24px; }
		.meta { color: #6b7280; font-size: 12px; }
		.preview-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
		.preview-toolbar button { border: 1px solid #d8dee4; background: #fff; color: #1f2933; border-radius: 8px; padding: 10px 12px; cursor: pointer; font-size: 14px; min-width: 140px; min-height: 46px; font-weight: 700; }
		.preview-toolbar .primary { background: #d6a900; color: #fff; border-color: #d6a900; }
		.field { margin: 18px 0; }
		.field .label { color: #6b7280; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
		.field .value { margin-top: 4px; font-size: 14px; white-space: pre-wrap; }
		.total { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: baseline; }
		.total .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
		.total .value { font-size: 28px; font-weight: 700; }
		@media print { body { margin: 20mm; } .preview-toolbar { display: none !important; } }
	</style>
</head>
<body>
	<div class="preview-toolbar">
		<button type="button" onclick="window.close()">Voltar ao app</button>
		<button type="button" class="primary" onclick="window.print()">Exportar PDF</button>
	</div>
	<header>
		<h1>Fatura #${invoice.number}</h1>
		<div class="meta">Emitida em: ${escapeHtml(new Date(invoice.issuedAt).toLocaleDateString('pt-PT'))}</div>
		${companyName ? `<div class="meta">${escapeHtml(companyName)}</div>` : ''}
	</header>
	<div class="field">
		<div class="label">Cliente</div>
		<div class="value">${escapeHtml(invoice.clientName)}</div>
	</div>
	<div class="field">
		<div class="label">NIF do cliente</div>
		<div class="value">${escapeHtml(invoice.clientNif)}</div>
	</div>
	<div class="field">
		<div class="label">Descrição do trabalho</div>
		<div class="value">${escapeHtml(invoice.description)}</div>
	</div>
	<div class="total">
		<div class="label">Total</div>
		<div class="value">€${formatMoney(invoice.total)}</div>
	</div>
</body>
</html>`;
