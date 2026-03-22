'use client';

import { useRouter, useSearchParams } from 'next/navigation';

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  return months;
}

function getLast3Years(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
}

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonth = searchParams.get('month') ?? '';
  const currentYear = searchParams.get('year') ?? '';
  const currentFrom = searchParams.get('from') ?? '';
  const currentTo = searchParams.get('to') ?? '';

  function handleMonthChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', value);
    params.delete('from');
    params.delete('to');
    params.delete('year');
    router.push('/dashboard?' + params.toString());
  }

  function handleYearChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', value);
    params.delete('from');
    params.delete('to');
    params.delete('month');
    router.push('/dashboard?' + params.toString());
  }

  function handleFromChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', value);
    params.delete('month');
    params.delete('year');
    if (currentTo) params.set('to', currentTo);
    router.push('/dashboard?' + params.toString());
  }

  function handleToChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('to', value);
    params.delete('month');
    params.delete('year');
    if (currentFrom) params.set('from', currentFrom);
    router.push('/dashboard?' + params.toString());
  }

  const months = getLast12Months();
  const years = getLast3Years();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="month-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Month
        </label>
        <select
          id="month-filter"
          value={currentMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— select —</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="year-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Year
        </label>
        <select
          id="year-filter"
          value={currentYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— select —</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Range
        </label>
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => handleFromChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="From date"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => handleToChange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="To date"
        />
      </div>
    </div>
  );
}
