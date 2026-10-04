export async function api(path: string, init?: RequestInit) {
	const res = await fetch(path, {
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
	if (!res.ok) {
		throw new Error(`Request to ${path} failed with ${res.status}`);
	}
	return res;
}

export function formatMoney(n: number) {
	const sign = n < 0 ? '-' : '';
	return (
		sign +
		Math.abs(n).toLocaleString('en-IE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	);
}

export function todayKey(d: Date) {
	return d.toDateString();
}

export function dayLabel(dateStr: string, refNow: Date) {
	const d = new Date(dateStr);
	const now = refNow;
	const diffDays = Math.round(
		(new Date(now.toDateString()).getTime() -
			new Date(d.toDateString()).getTime()) /
			86400000,
	);
	if (diffDays === 0) return 'HOJE';
	if (diffDays === 1) return 'ONTEM';
	return d
		.toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		})
		.toUpperCase();
}

export const escapeHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
