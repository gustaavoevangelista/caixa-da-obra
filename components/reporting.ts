export type ReportTransaction = {
	id: string;
	type: 'expense' | 'income';
	amount: number;
	category: string;
	categoryLabel: string;
	categoryTag: string;
	description: string;
	createdAt: string;
	projectId: string | null;
};

export type ReportPeriod = {
	start: Date;
	end: Date;
	label: string;
};

export type ReportCategoryTotal = {
	label: string;
	tag: string;
	total: number;
};

export type ReportData = {
	income: number;
	expense: number;
	net: number;
	catArr: ReportCategoryTotal[];
	maxCat: number;
	incomeCatArr: ReportCategoryTotal[];
	maxIncomeCat: number;
	count: number;
	items: ReportTransaction[];
};

export function getMonthPeriod(date: Date): ReportPeriod {
	const start = new Date(date.getFullYear(), date.getMonth(), 1);
	const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

	return {
		start,
		end,
		label: start.toLocaleDateString('pt-PT', {
			month: 'long',
			year: 'numeric',
		}),
	};
}

export function getWeekPeriod(date: Date): ReportPeriod {
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
	const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);

	return {
		start,
		end,
		label: `${start.toLocaleDateString('pt-PT')} - ${end.toLocaleDateString('pt-PT')}`,
	};
}

export function getYearPeriod(year: number): ReportPeriod {
	return {
		start: new Date(year, 0, 1),
		end: new Date(year + 1, 0, 1),
		label: String(year),
	};
}

export function buildReportData(
	transactions: ReportTransaction[],
	period: ReportPeriod,
): ReportData {
	const items = transactions
		.filter((t) => {
			const createdAt = new Date(t.createdAt);
			return createdAt >= period.start && createdAt < period.end;
		})
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() -
				new Date(a.createdAt).getTime(),
		);

	let income = 0;
	let expense = 0;
	const byCatExpense: Record<string, ReportCategoryTotal> = {};
	const byCatIncome: Record<string, ReportCategoryTotal> = {};

	items.forEach((t) => {
		if (t.type === 'income') {
			income += t.amount;
			byCatIncome[t.category] = byCatIncome[t.category] || {
				label: t.categoryLabel,
				tag: t.categoryTag,
				total: 0,
			};
			byCatIncome[t.category].total += t.amount;
			return;
		}

		expense += t.amount;
		byCatExpense[t.category] = byCatExpense[t.category] || {
			label: t.categoryLabel,
			tag: t.categoryTag,
			total: 0,
		};
		byCatExpense[t.category].total += t.amount;
	});

	const catArr = Object.values(byCatExpense).sort(
		(a, b) => b.total - a.total,
	);
	const incomeCatArr = Object.values(byCatIncome).sort(
		(a, b) => b.total - a.total,
	);

	return {
		income,
		expense,
		net: income - expense,
		catArr,
		maxCat: catArr.length ? catArr[0].total : 0,
		incomeCatArr,
		maxIncomeCat: incomeCatArr.length ? incomeCatArr[0].total : 0,
		count: items.length,
		items,
	};
}
