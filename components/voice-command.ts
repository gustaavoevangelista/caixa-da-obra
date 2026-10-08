export type VoiceTransactionType = 'expense' | 'income';

export type VoiceCategory = { id: string; label: string };

export type VoiceProject = { id: string; name: string };

export type VoiceContext = {
	expense: VoiceCategory[];
	income: VoiceCategory[];
	projects: VoiceProject[];
};

/** What a spoken command resolved to; prefills the transaction sheet. */
export type VoiceDraft = {
	type: VoiceTransactionType;
	amount: number | null;
	categoryId: string | null;
	projectId: string | null;
	description: string;
};

export function normalizeText(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9.,€\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const INCOME_WORDS = ['receita', 'entrada', 'recebi', 'recebido', 'recebimento', 'ganhei'];
const EXPENSE_WORDS = ['despesa', 'gasto', 'gastei', 'paguei', 'compra', 'comprei', 'saida'];

// Extra spoken words for the seeded default categories (lib/default-categories.ts).
const CATEGORY_SYNONYMS: Record<string, string[]> = {
	materials: ['material', 'cimento', 'tijolo', 'areia', 'tinta', 'madeira', 'ferro'],
	tools: ['ferramenta', 'equipamento', 'maquina', 'aluguer'],
	labor: ['mao de obra', 'salario', 'ajudante', 'trabalhador', 'pedreiro', 'diaria'],
	fuel: ['combustivel', 'gasoleo', 'gasolina', 'diesel', 'abastecer', 'abasteci'],
	permits: ['taxa', 'licenca', 'imposto', 'portagem'],
	food: ['alimentacao', 'almoco', 'jantar', 'comida', 'cafe', 'refeicao', 'lanche'],
	payment: ['pagamento', 'pagou'],
	advance: ['adiantamento', 'sinal'],
};

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'para', 'com', 'a', 'o', 'os', 'as', 'um', 'uma']);

function words(text: string) {
	return normalizeText(text).replace(/[.,€]/g, ' ').split(' ').filter(Boolean);
}

function containsPhrase(haystackWords: string[], phrase: string) {
	const needle = words(phrase).filter((w) => !STOPWORDS.has(w));
	if (needle.length === 0) return false;
	return needle.every((n) =>
		haystackWords.some((h) => h === n || (n.length >= 4 && h.length >= 4 && (h.startsWith(n) || n.startsWith(h)))),
	);
}

/**
 * Joins the segments of a continuous recognition session. Chrome on Android
 * repeats earlier speech in each new segment ("despesa", "despesa 50",
 * "despesa 50 euros"), so a segment that already starts with the text so far
 * replaces it instead of being appended.
 */
export function joinRecognitionResults(segments: string[]) {
	let text = '';
	for (const raw of segments) {
		const segment = raw.trim();
		if (!segment) continue;
		const seg = normalizeText(segment);
		const prev = normalizeText(text);
		if (!text || seg === prev || seg.startsWith(`${prev} `)) {
			text = segment;
		} else {
			text = `${text} ${segment}`;
		}
	}
	return text;
}

export function parseAmount(transcript: string): number | null {
	const normalized = normalizeText(transcript);
	// "1.250,50", "1 250", "50,5", "12.75"
	const match = normalized.match(/\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/);
	if (!match) return null;
	let raw = match[0];
	if (/[.\s]\d{3}/.test(raw) && !/^\d+[.,]\d{1,2}$/.test(raw)) {
		raw = raw.replace(/[.\s]/g, '');
	}
	const value = Number.parseFloat(raw.replace(',', '.'));
	return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function matchCategory(haystack: string[], categories: VoiceCategory[]) {
	return (
		categories.find((c) => containsPhrase(haystack, c.label)) ??
		categories.find((c) => (CATEGORY_SYNONYMS[c.id] ?? []).some((s) => containsPhrase(haystack, s))) ??
		null
	);
}

/**
 * Offline, rule-based parse of commands like "despesa 50 euros combustível".
 * Fields it can't resolve stay empty for the user to fill in on the sheet.
 */
export function parseVoiceCommand(transcript: string, ctx: VoiceContext): VoiceDraft {
	const haystack = words(transcript);

	const saysIncome = INCOME_WORDS.some((w) => haystack.includes(w));
	const saysExpense = EXPENSE_WORDS.some((w) => haystack.includes(w));
	const typeWords = new Set([...INCOME_WORDS, ...EXPENSE_WORDS]);
	const categoryHaystack = haystack.filter((w) => !typeWords.has(w));

	let type: VoiceTransactionType = saysIncome && !saysExpense ? 'income' : 'expense';
	let category = matchCategory(categoryHaystack, type === 'expense' ? ctx.expense : ctx.income);

	// No explicit type word: let the category decide ("adiantamento 300").
	if (!category && !saysIncome && !saysExpense) {
		const incomeCategory = matchCategory(categoryHaystack, ctx.income);
		if (incomeCategory) {
			type = 'income';
			category = incomeCategory;
		}
	}

	// Most specific name wins: "obra silva" picks "Obra Silva" over "Obra".
	const project =
		ctx.projects
			.filter((p) => containsPhrase(haystack, p.name))
			.sort((a, b) => words(b.name).length - words(a.name).length)[0] ?? null;

	return {
		type,
		amount: parseAmount(transcript),
		categoryId: category?.id ?? null,
		projectId: project?.id ?? null,
		description: '',
	};
}
