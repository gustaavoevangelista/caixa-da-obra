import assert from 'node:assert/strict';
import test from 'node:test';
import {
	joinRecognitionResults,
	parseAmount,
	parseVoiceCommand,
	type VoiceContext,
} from './voice-command.ts';

const ctx: VoiceContext = {
	expense: [
		{ id: 'materials', label: 'Materiais' },
		{ id: 'tools', label: 'Ferramentas e Equip.' },
		{ id: 'labor', label: 'Mão de obra' },
		{ id: 'fuel', label: 'Combustível' },
		{ id: 'food', label: 'Alimentação' },
		{ id: 'other_exp', label: 'Outros' },
	],
	income: [
		{ id: 'payment', label: 'Pagamento' },
		{ id: 'advance', label: 'Adiantamento' },
		{ id: 'other_inc', label: 'Outros' },
	],
	projects: [
		{ id: 'p1', name: 'Casa Silva' },
		{ id: 'p2', name: 'Moradia Porto' },
	],
};

test('joinRecognitionResults appends separate segments', () => {
	assert.equal(
		joinRecognitionResults(['despesa 50 euros', ' combustível', 'obra silva ']),
		'despesa 50 euros combustível obra silva',
	);
});

test('joinRecognitionResults collapses cumulative (Android-style) segments', () => {
	assert.equal(
		joinRecognitionResults(['despesa', 'despesa 50', 'Despesa 50 euros combustível']),
		'Despesa 50 euros combustível',
	);
});

test('joinRecognitionResults only collapses on whole-word prefixes', () => {
	assert.equal(joinRecognitionResults(['despesa 50', '500 euros']), 'despesa 50 500 euros');
	assert.equal(joinRecognitionResults(['50', '500 euros']), '50 500 euros');
});

test('joinRecognitionResults skips empty segments', () => {
	assert.equal(joinRecognitionResults(['', '  ', 'despesa 10']), 'despesa 10');
	assert.equal(joinRecognitionResults([]), '');
});

test('parseAmount reads integers, decimal commas and thousands separators', () => {
	assert.equal(parseAmount('despesa 50 euros'), 50);
	assert.equal(parseAmount('12,5 €'), 12.5);
	assert.equal(parseAmount('12.75'), 12.75);
	assert.equal(parseAmount('1.250,50 euros'), 1250.5);
	assert.equal(parseAmount('sem valor'), null);
	assert.equal(parseAmount('0 euros'), null);
});

test('parses the canonical expense command', () => {
	assert.deepEqual(parseVoiceCommand('despesa 50 euros combustivel', ctx), {
		type: 'expense',
		amount: 50,
		categoryId: 'fuel',
		projectId: null,
		description: '',
	});
});

test('matches accented labels and recognizer punctuation', () => {
	const draft = parseVoiceCommand('Despesa, 20 euros, alimentação.', ctx);
	assert.equal(draft.categoryId, 'food');
});

test('matches category synonyms', () => {
	assert.equal(parseVoiceCommand('gastei 80 em gasóleo', ctx).categoryId, 'fuel');
	assert.equal(parseVoiceCommand('paguei 30 do almoço', ctx).categoryId, 'food');
	assert.equal(parseVoiceCommand('despesa 200 cimento', ctx).categoryId, 'materials');
});

test('detects income from a type word', () => {
	const draft = parseVoiceCommand('recebi 500 euros pagamento', ctx);
	assert.equal(draft.type, 'income');
	assert.equal(draft.categoryId, 'payment');
});

test('infers income from an income-only category when no type word is spoken', () => {
	const draft = parseVoiceCommand('adiantamento 300', ctx);
	assert.equal(draft.type, 'income');
	assert.equal(draft.categoryId, 'advance');
});

test('matches a project by name', () => {
	const draft = parseVoiceCommand('despesa 40 materiais na casa silva', ctx);
	assert.equal(draft.projectId, 'p1');
	assert.equal(draft.categoryId, 'materials');
});

test('matches a project named at the end of the command', () => {
	const withObra: VoiceContext = {
		...ctx,
		projects: [...ctx.projects, { id: 'p3', name: 'Obra Silva' }],
	};
	assert.deepEqual(parseVoiceCommand('despesa 50 euros combustivel obra silva', withObra), {
		type: 'expense',
		amount: 50,
		categoryId: 'fuel',
		projectId: 'p3',
		description: '',
	});
});

test('prefers the most specific project name', () => {
	const projects = [
		{ id: 'short', name: 'Obra' },
		{ id: 'long', name: 'Obra Silva' },
	];
	assert.equal(
		parseVoiceCommand('despesa 10 obra silva', { ...ctx, projects }).projectId,
		'long',
	);
	assert.equal(parseVoiceCommand('despesa 10 obra', { ...ctx, projects }).projectId, 'short');
});

test('leaves unknown fields empty', () => {
	assert.deepEqual(parseVoiceCommand('olá', ctx), {
		type: 'expense',
		amount: null,
		categoryId: null,
		projectId: null,
		description: '',
	});
});
