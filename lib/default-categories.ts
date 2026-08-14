export type Category = { id: string; label: string; tag: string };

export const EXPENSE_CATEGORIES: Category[] = [
	{ id: 'materials', label: 'Materiais', tag: 'MAT' },
	{ id: 'tools', label: 'Ferramentas e Equip.', tag: 'TLS' },
	{ id: 'labor', label: 'Mão de obra', tag: 'LAB' },
	{ id: 'fuel', label: 'Combustível', tag: 'FUE' },
	{ id: 'permits', label: 'Taxas', tag: 'PRM' },
	{ id: 'food', label: 'Alimentação', tag: 'FOD' },
	{ id: 'other_exp', label: 'Outros', tag: 'OTH' },
];

export const INCOME_CATEGORIES: Category[] = [
	{ id: 'payment', label: 'Pagamento', tag: 'PAY' },
	{ id: 'advance', label: 'Adiantamento', tag: 'ADV' },
	{ id: 'other_inc', label: 'Outros', tag: 'OTH' },
];
