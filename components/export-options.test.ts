import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPORT_REPORT_LABEL, EXPORT_REPORT_OPTIONS } from './export-options.ts';

test('report export uses one primary label with month and year choices', () => {
	assert.equal(EXPORT_REPORT_LABEL, 'Exportar relatório');
	assert.deepEqual(EXPORT_REPORT_OPTIONS, [
		{ mode: 'month', label: 'Relatório mensal' },
		{ mode: 'year', label: 'Relatório anual' },
	]);
});
