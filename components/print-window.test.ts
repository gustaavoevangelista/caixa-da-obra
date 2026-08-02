import assert from 'node:assert/strict';
import test from 'node:test';
import { PRINT_WINDOW_FEATURES } from './print-window.ts';

test('print window features preserve script access to the opened document', () => {
	assert.ok(!PRINT_WINDOW_FEATURES.includes('noopener'));
	assert.ok(!PRINT_WINDOW_FEATURES.includes('noreferrer'));
});
