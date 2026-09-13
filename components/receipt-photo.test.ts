import assert from 'node:assert/strict';
import test from 'node:test';
import { computeScaledDimensions } from './receipt-photo.ts';

test('computeScaledDimensions leaves an image smaller than the cap unchanged', () => {
	assert.deepEqual(computeScaledDimensions(800, 600, 1600), {
		width: 800,
		height: 600,
	});
});

test('computeScaledDimensions downscales a landscape image to the cap', () => {
	assert.deepEqual(computeScaledDimensions(3200, 1600, 1600), {
		width: 1600,
		height: 800,
	});
});

test('computeScaledDimensions downscales a portrait image to the cap', () => {
	assert.deepEqual(computeScaledDimensions(1600, 3200, 1600), {
		width: 800,
		height: 1600,
	});
});

test('computeScaledDimensions downscales a square image to the cap', () => {
	assert.deepEqual(computeScaledDimensions(4000, 4000, 1600), {
		width: 1600,
		height: 1600,
	});
});

test('computeScaledDimensions never upscales an image at exactly the cap', () => {
	assert.deepEqual(computeScaledDimensions(1600, 1200, 1600), {
		width: 1600,
		height: 1200,
	});
});
