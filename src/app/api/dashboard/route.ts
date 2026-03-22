import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { resolveDateRange } from '@/lib/date-range';
import { getDashboardStats } from '@/lib/dashboard-aggregations';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const searchParams = req.nextUrl.searchParams;
  const month = searchParams.get('month') ?? undefined;
  const year = searchParams.get('year') ?? undefined;
  const fromStr = searchParams.get('from') ?? undefined;
  const toStr = searchParams.get('to') ?? undefined;

  const range = resolveDateRange({ month, year, from: fromStr, to: toStr });
  
  const prevFrom = startOfMonth(subMonths(range.from, 1));
  const prevTo = endOfMonth(subMonths(range.from, 1));

  const [current, previous] = await Promise.all([
    getDashboardStats(session.user.id, range.from, range.to),
    getDashboardStats(session.user.id, prevFrom, prevTo),
  ]);

  const momPercent = previous.totalExpenses === 0
    ? null
    : ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100;

  return Response.json({
    stats: current,
    momPercent,
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
  });
}
