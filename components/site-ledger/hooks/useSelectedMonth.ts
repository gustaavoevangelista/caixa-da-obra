import { useMemo, useState } from 'react';
import { getMonthPeriod } from '../../reporting';

// The month shown on both the home list and the reports screen, as an offset
// from the current month (0 = this month; never in the future).
export function useSelectedMonth({ now }: { now: Date }) {
	const [monthOffset, setMonthOffset] = useState(0);

	const monthDate = useMemo(
		() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
		[now, monthOffset],
	);

	const period = useMemo(() => getMonthPeriod(monthDate), [monthDate]);

	return {
		monthOffset,
		setMonthOffset,
		monthDate,
		period,
	};
}
