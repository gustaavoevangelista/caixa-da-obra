export type InvoiceableTransaction = {
	id: string;
	amount: number;
};

export function sumTransactionAmounts(
	transactions: InvoiceableTransaction[],
): number {
	return transactions.reduce((total, t) => total + t.amount, 0);
}

export function nextInvoiceNumber(existingNumbers: number[]): number {
	if (existingNumbers.length === 0) return 1;
	return Math.max(...existingNumbers) + 1;
}
