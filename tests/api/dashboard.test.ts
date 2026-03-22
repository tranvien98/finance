import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Expense from '@/models/expense.model';
import Investment from '@/models/investment.model';
import { setupTestDB, teardownTestDB, clearCollections, mockSession } from '../helpers/mock-db';
import mongoose from 'mongoose';
import { startOfMonth, subMonths, format } from 'date-fns';

let GET: Function;

describe('Dashboard API', () => {
  const userId = new mongoose.Types.ObjectId();
  const sessionUser = { id: userId.toString(), email: 'test@example.com' };

  beforeAll(async () => {
    await setupTestDB();

    try {
      const mod = await import('@/app/api/dashboard/route');
      GET = mod.GET;
    } catch {
      // Expected to fail in Wave 0
    }
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
    mockSession({ user: sessionUser });

    const now = new Date();
    const currentMonth = startOfMonth(now);
    const prevMonth = startOfMonth(subMonths(now, 1));

    await Expense.create([
      { userId, amount: 50000, category: 'Food', note: 'Pho', date: currentMonth },
      { userId, amount: 100000, category: 'Transport', note: 'Taxi', date: currentMonth },
      { userId, amount: 60000, category: 'Food', note: 'Coffee', date: prevMonth },
    ]);

    await Investment.create([
      { userId, assetType: 'gold', name: 'SJC', amount: 8000000, buyPrice: 8000000, quantity: 1, date: currentMonth },
    ]);
  });

  function createMockRequest(url: string) {
    if (typeof Request !== 'undefined') {
      return new Request(new URL(url, 'http://localhost:3000').toString());
    }
    // Fallback if Request is unavailable (though Node 18+ has it globally)
    return { nextUrl: { searchParams: new URLSearchParams(url.split('?')[1] || '') } };
  }

  // Workaround for `req.nextUrl` since standard Request doesn't have `nextUrl`
  // Actually, we can just mock nextUrl in a dummy object
  function createNextRequestMock(urlStr: string) {
    const url = new URL(urlStr, 'http://localhost:3000');
    return {
      nextUrl: {
        searchParams: url.searchParams,
      },
    } as any;
  }

  it('totals: returns totalExpenses and totalInvestments for current month', async () => {
    const res = await GET(createNextRequestMock('/api/dashboard'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.stats.totalExpenses).toBe(150000);
    expect(data.stats.totalInvestments).toBe(8000000);
  });

  it('category breakdown: groups expenses by category', async () => {
    const res = await GET(createNextRequestMock('/api/dashboard'));
    const data = await res.json();
    const breakdown = data.stats.categoryBreakdown;
    expect(breakdown).toHaveLength(2);
    // Sort logic is total -1
    expect(breakdown[0].category).toBe('Transport');
    expect(breakdown[0].total).toBe(100000);
    expect(breakdown[1].category).toBe('Food');
    expect(breakdown[1].total).toBe(50000);
  });

  it('daily series: groups expenses by date string', async () => {
    const res = await GET(createNextRequestMock('/api/dashboard'));
    const data = await res.json();
    const series = data.stats.dailySeries;
    expect(series).toHaveLength(1);
    expect(series[0].total).toBe(150000);
  });

  it('MoM: calculates percentage change correctly', async () => {
    const res = await GET(createNextRequestMock('/api/dashboard'));
    const data = await res.json();
    expect(data.momPercent).toBe(150);
  });

  it('MoM: returns null when previous month sum is 0', async () => {
    await Expense.deleteMany({ category: 'Food', amount: 60000 });
    const res = await GET(createNextRequestMock('/api/dashboard'));
    const data = await res.json();
    expect(data.momPercent).toBeNull();
  });

  it('month filter: returns matching expenses', async () => {
    const prevMonthDate = startOfMonth(subMonths(new Date(), 1));
    const yearMonth = format(prevMonthDate, 'yyyy-MM');
    const res = await GET(createNextRequestMock(`/api/dashboard?month=${yearMonth}`));
    const data = await res.json();
    
    expect(data.stats.totalExpenses).toBe(60000);
    expect(data.stats.totalInvestments).toBe(0);
  });

  it('year filter: returns matching expenses', async () => {
    const currentYear = new Date().getFullYear().toString();
    const res = await GET(createNextRequestMock(`/api/dashboard?year=${currentYear}`));
    const data = await res.json();
    // Both current and previous month expenses are in the same year: 150000 + 60000 = 210000
    expect(res.status).toBe(200);
    expect(data.stats.totalExpenses).toBeGreaterThanOrEqual(150000);
  });

  it('date range filter: returns matching expenses', async () => {
    const currentMonth = startOfMonth(new Date());
    const fromStr = format(currentMonth, 'yyyy-MM-dd');
    const toStr = format(currentMonth, 'yyyy-MM-dd');
    const res = await GET(createNextRequestMock(`/api/dashboard?from=${fromStr}&to=${toStr}`));
    const data = await res.json();
    
    expect(data.stats.totalExpenses).toBe(150000);
  });

  it('401 logic', async () => {
    mockSession(null);
    const res = await GET(createNextRequestMock('/api/dashboard'));
    expect(res.status).toBe(401);
  });
});
