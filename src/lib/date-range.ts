import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, endOfDay } from 'date-fns';

export type DateRange = { from: Date; to: Date };

export function resolveDateRange(params: {
  month?: string;
  year?: string;
  from?: string;
  to?: string;
}): DateRange {
  if (params.from && params.to) {
    return { from: parseISO(params.from), to: endOfDay(parseISO(params.to)) };
  }
  if (params.year) {
    const d = new Date(Number(params.year), 0, 1);
    return { from: startOfYear(d), to: endOfYear(d) };
  }
  const pivot = params.month ? new Date(params.month + '-01') : new Date();
  return { from: startOfMonth(pivot), to: endOfMonth(pivot) };
}
