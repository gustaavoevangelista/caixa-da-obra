import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildReportData,
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
		createdAt: '2026-08-09T10:00:00.000Z',
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
		getWeekPeriod(new Date(2026, 7, 1)),
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
