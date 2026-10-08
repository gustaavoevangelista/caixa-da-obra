import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildReportData,
	filterByPeriod,
	getExportPeriod,
	getMonthPeriod,
	getWeekPeriod,
	getYearPeriod,
	type ReportTransaction,
} from './reporting.ts';

const transactions: ReportTransaction[] = [
	{
		id: 'income-1',
		type: 'income',
		amount: 1000,
		category: 'payment',
		categoryLabel: 'Pagamento',
		categoryTag: 'PAY',
		description: 'First payment',
		createdAt: '2026-08-10T10:00:00.000Z',
		projectId: 'project-a',
	},
	{
		id: 'expense-1',
		type: 'expense',
		amount: 125,
		category: 'materials',
		categoryLabel: 'Materiais',
		categoryTag: 'MAT',
		description: 'Cement',
		createdAt: '2026-08-10T09:00:00.000Z',
		projectId: 'project-a',
	},
	{
		id: 'expense-2',
		type: 'expense',
		amount: 75,
		category: 'fuel',
		categoryLabel: 'Combustivel',
		categoryTag: 'FUE',
		description: 'Diesel',
		createdAt: '2026-01-03T10:00:00.000Z',
		projectId: 'project-a',
	},
	{
		id: 'other-project',
		type: 'income',
		amount: 500,
		category: 'payment',
		categoryLabel: 'Pagamento',
		categoryTag: 'PAY',
		description: 'Other project',
		createdAt: '2026-08-08T10:00:00.000Z',
		projectId: 'project-b',
	},
];

test('buildReportData summarizes a week from provided scoped transactions', () => {
	const report = buildReportData(
		transactions.filter((t) => t.projectId === 'project-a'),
		getWeekPeriod(new Date(2026, 7, 10)),
	);

	assert.equal(report.income, 1000);
	assert.equal(report.expense, 125);
	assert.equal(report.net, 875);
	assert.equal(report.count, 2);
	assert.deepEqual(report.incomeCatArr, [
		{ label: 'Pagamento', tag: 'PAY', total: 1000 },
	]);
	assert.deepEqual(report.catArr, [
		{ label: 'Materiais', tag: 'MAT', total: 125 },
	]);
	assert.deepEqual(report.items.map((t) => t.id), ['income-1', 'expense-1']);
});

test('getWeekPeriod runs Monday to Sunday for any day of the week', () => {
	// 2026-08-10 is a Monday, 2026-08-16 is a Sunday
	for (const day of [10, 11, 12, 13, 14, 15, 16]) {
		const period = getWeekPeriod(new Date(2026, 7, day, 15, 30));

		assert.deepEqual(period.start, new Date(2026, 7, 10));
		assert.deepEqual(period.end, new Date(2026, 7, 17));
	}
});

test('getWeekPeriod labels the last day of the week, not the exclusive end', () => {
	assert.equal(
		getWeekPeriod(new Date(2026, 7, 12)).label,
		'10/08/2026 - 16/08/2026',
	);
});

test('getWeekPeriod handles weeks that cross a month and year boundary', () => {
	const period = getWeekPeriod(new Date(2026, 0, 1)); // Thursday

	assert.deepEqual(period.start, new Date(2025, 11, 29));
	assert.deepEqual(period.end, new Date(2026, 0, 5));
	assert.equal(period.label, '29/12/2025 - 04/01/2026');
});

test('buildReportData for a week excludes the neighbouring Sunday and Monday', () => {
	const at = (day: number, hour: number, minute = 0) =>
		new Date(2026, 7, day, hour, minute).toISOString();
	const edge = (id: string, createdAt: string): ReportTransaction => ({
		id,
		type: 'expense',
		amount: 10,
		category: 'materials',
		categoryLabel: 'Materiais',
		categoryTag: 'MAT',
		description: id,
		createdAt,
		projectId: null,
	});

	const report = buildReportData(
		[
			edge('prev-sunday-late', at(9, 23, 59)),
			edge('monday-start', at(10, 0)),
			edge('sunday-end', at(16, 23, 59)),
			edge('next-monday-start', at(17, 0)),
		],
		getWeekPeriod(new Date(2026, 7, 13)),
	);

	assert.deepEqual(report.items.map((t) => t.id), [
		'sunday-end',
		'monday-start',
	]);
});

test('getExportPeriod uses the current week for week exports, regardless of the month shown', () => {
	const now = new Date(2026, 8, 21); // Monday 21 Sep 2026
	const shownMonth = new Date(2026, 5, 1); // user navigated back to June

	assert.deepEqual(getExportPeriod('week', now, shownMonth), getWeekPeriod(now));
});

test('getExportPeriod uses the shown month and its year for month and year exports', () => {
	const now = new Date(2026, 8, 21);
	const shownMonth = new Date(2025, 5, 1);

	assert.deepEqual(getExportPeriod('month', now, shownMonth), getMonthPeriod(shownMonth));
	assert.deepEqual(getExportPeriod('year', now, shownMonth), getYearPeriod(2025));
});

test('buildReportData summarizes a month from provided scoped transactions', () => {
	const report = buildReportData(
		transactions.filter((t) => t.projectId === 'project-a'),
		getMonthPeriod(new Date(2026, 7, 1)),
	);

	assert.equal(report.income, 1000);
	assert.equal(report.expense, 125);
	assert.equal(report.net, 875);
	assert.equal(report.count, 2);
	assert.deepEqual(report.incomeCatArr, [
		{ label: 'Pagamento', tag: 'PAY', total: 1000 },
	]);
	assert.deepEqual(report.catArr, [
		{ label: 'Materiais', tag: 'MAT', total: 125 },
	]);
	assert.deepEqual(report.items.map((t) => t.id), ['income-1', 'expense-1']);
});

test('buildReportData summarizes the full year from provided scoped transactions', () => {
	const report = buildReportData(
		transactions.filter((t) => t.projectId === 'project-a'),
		getYearPeriod(2026),
	);

	assert.equal(report.income, 1000);
	assert.equal(report.expense, 200);
	assert.equal(report.net, 800);
	assert.equal(report.count, 3);
	assert.deepEqual(report.catArr, [
		{ label: 'Materiais', tag: 'MAT', total: 125 },
		{ label: 'Combustivel', tag: 'FUE', total: 75 },
	]);
	assert.deepEqual(report.items.map((t) => t.id), [
		'income-1',
		'expense-1',
		'expense-2',
	]);
});

test('filterByPeriod keeps the first instant of the month and drops the first instant of the next', () => {
	const period = getMonthPeriod(new Date(2026, 7, 15));
	const rows = [
		{ id: 'first', createdAt: new Date(2026, 7, 1).toISOString() },
		{ id: 'last', createdAt: new Date(2026, 7, 31, 23, 59, 59).toISOString() },
		{ id: 'next-month', createdAt: new Date(2026, 8, 1).toISOString() },
		{ id: 'prev-month', createdAt: new Date(2026, 6, 31, 23, 59, 59).toISOString() },
	];

	assert.deepEqual(
		filterByPeriod(rows, period).map((t) => t.id),
		['first', 'last'],
	);
});

test('filterByPeriod preserves extra fields and input order', () => {
	const period = getMonthPeriod(new Date(2026, 7, 1));
	const rows = transactions.map((t) => ({ ...t, photo: `photo-${t.id}` }));

	const result = filterByPeriod(rows, period);

	assert.deepEqual(result.map((t) => t.id), [
		'income-1',
		'expense-1',
		'other-project',
	]);
	assert.equal(result[0].photo, 'photo-income-1');
});

test('getMonthPeriod labels the month in Portuguese', () => {
	assert.equal(getMonthPeriod(new Date(2026, 9, 8)).label, 'outubro de 2026');
});
