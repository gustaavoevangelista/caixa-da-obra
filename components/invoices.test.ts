import assert from 'node:assert/strict';
import test from 'node:test';
import {
	nextInvoiceNumber,
	sumTransactionAmounts,
	type InvoiceableTransaction,
} from './invoices.ts';

test('sumTransactionAmounts returns 0 for an empty list', () => {
	assert.equal(sumTransactionAmounts([]), 0);
});

test('sumTransactionAmounts adds every transaction amount', () => {
	const transactions: InvoiceableTransaction[] = [
		{ id: 'a', amount: 250 },
		{ id: 'b', amount: 99.5 },
		{ id: 'c', amount: 10 },
	];
	assert.equal(sumTransactionAmounts(transactions), 359.5);
});

test('nextInvoiceNumber returns 1 when there are no existing invoices', () => {
	assert.equal(nextInvoiceNumber([]), 1);
});

test('nextInvoiceNumber returns one past the highest existing number', () => {
	assert.equal(nextInvoiceNumber([1, 2, 3]), 4);
});

test('nextInvoiceNumber ignores ordering and gaps in existing numbers', () => {
	assert.equal(nextInvoiceNumber([5, 1, 9, 3]), 10);
});
