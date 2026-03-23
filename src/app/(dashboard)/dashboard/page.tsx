import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { resolveDateRange } from '@/lib/date-range';
import { getDashboardStats } from '@/lib/dashboard-aggregations';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { StatCard } from '@/components/dashboard/stat-card';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { ExpenseLineChart } from '@/components/dashboard/expense-line-chart';
import { AiInsightsCard } from '@/components/dashboard/ai-insights-card';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth');
  }

  await dbConnect();

  const month = typeof params.month === 'string' ? params.month : undefined;
  const year = typeof params.year === 'string' ? params.year : undefined;
  const from = typeof params.from === 'string' ? params.from : undefined;
  const to = typeof params.to === 'string' ? params.to : undefined;

  const range = resolveDateRange({ month, year, from, to });

  const prevFrom = startOfMonth(subMonths(range.from, 1));
  const prevTo = endOfMonth(subMonths(range.from, 1));

  const [current, previous] = await Promise.all([
    getDashboardStats(session.user.id, range.from, range.to),
    getDashboardStats(session.user.id, prevFrom, prevTo),
  ]);

  const momPercent =
    previous.totalExpenses === 0
      ? null
      : ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <Suspense fallback={<div className="h-12 animate-pulse rounded-md bg-muted" />}>
        <DashboardFilters />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Expenses"
          value={current.totalExpenses}
          momPercent={momPercent}
        />
        <StatCard
          title="Total Investments"
          value={current.totalInvestments}
        />
      </div>

      <AiInsightsCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieChart data={current.categoryBreakdown} />
        <ExpenseLineChart data={current.dailySeries} />
      </div>
    </div>
  );
}
