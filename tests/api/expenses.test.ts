import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDB, teardownTestDB, clearCollections, mockSession } from '../helpers/mock-db';

let GET: Function, POST: Function;
let PATCH: Function, DELETE: Function;

const TEST_USER_ID = '507f1f77bcf86cd799439011';
const OTHER_USER_ID = '507f1f77bcf86cd799439022';

beforeAll(async () => {
  await setupTestDB();
  mockSession({ user: { id: TEST_USER_ID, email: 'test@test.com' } });

  try {
    const mod = await import('@/app/api/expenses/route');
    GET = mod.GET;
    POST = mod.POST;
  } catch {
    // Expected to fail in Wave 0
  }
  try {
    const mod = await import('@/app/api/expenses/[id]/route');
    PATCH = mod.PATCH;
    DELETE = mod.DELETE;
  } catch {
    // Expected to fail in Wave 0
  }
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  mockSession({ user: { id: TEST_USER_ID, email: 'test@test.com' } });
});

function makeExpenseReq(data: Record<string, unknown>) {
  return new Request('http://localhost/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

const VALID_EXPENSE = {
  amount: 50000,
  category: 'Food',
  note: 'pho bo',
  date: '2026-03-22T00:00:00.000Z',
};

describe('POST /api/expenses', () => {
  it('creates an expense with valid data (EXPN-01)', async () => {
    const res = await POST(makeExpenseReq(VALID_EXPENSE));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.expense.amount).toBe(50000);
    expect(data.expense.category).toBe('Food');
    expect(data.expense.note).toBe('pho bo');
  });

  it('rejects non-integer amount with 400 (EXPN-01)', async () => {
    const res = await POST(makeExpenseReq({ ...VALID_EXPENSE, amount: 50000.5 }));
    expect(res.status).toBe(400);
  });

  it('rejects negative amount with 400 (EXPN-01)', async () => {
    const res = await POST(makeExpenseReq({ ...VALID_EXPENSE, amount: -100 }));
    expect(res.status).toBe(400);
  });

  it('rejects missing category with 400 (EXPN-01)', async () => {
    const res = await POST(makeExpenseReq({ ...VALID_EXPENSE, category: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockSession(null);
    const res = await POST(makeExpenseReq(VALID_EXPENSE));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/expenses', () => {
  it('returns only the authenticated user expenses sorted by date desc (EXPN-02)', async () => {
    // Create two expenses
    await POST(makeExpenseReq({ ...VALID_EXPENSE, note: 'first', date: '2026-03-20T00:00:00.000Z' }));
    await POST(makeExpenseReq({ ...VALID_EXPENSE, note: 'second', date: '2026-03-22T00:00:00.000Z' }));

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.expenses).toHaveLength(2);
    // Sorted by date descending — second (Mar 22) should come first
    expect(data.expenses[0].note).toBe('second');
    expect(data.expenses[1].note).toBe('first');
  });

  it('does not return other users expenses (EXPN-02)', async () => {
    // Create expense as test user
    await POST(makeExpenseReq(VALID_EXPENSE));

    // Switch to other user
    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const res = await GET();
    const data = await res.json();
    expect(data.expenses).toHaveLength(0);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockSession(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/expenses/[id]', () => {
  it('updates an expense with ownership check (EXPN-03)', async () => {
    const createRes = await POST(makeExpenseReq(VALID_EXPENSE));
    const { expense } = await createRes.json();

    const req = new Request('http://localhost/api/expenses/' + expense._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 75000 }),
    });
    const ctx = { params: Promise.resolve({ id: expense._id }) };
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(data.expense.amount).toBe(75000);
  });

  it('returns 403 when updating another users expense (EXPN-03)', async () => {
    const createRes = await POST(makeExpenseReq(VALID_EXPENSE));
    const { expense } = await createRes.json();

    // Switch user
    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const req = new Request('http://localhost/api/expenses/' + expense._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 75000 }),
    });
    const ctx = { params: Promise.resolve({ id: expense._id }) };
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent expense', async () => {
    const req = new Request('http://localhost/api/expenses/507f1f77bcf86cd799439099', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 75000 }),
    });
    const ctx = { params: Promise.resolve({ id: '507f1f77bcf86cd799439099' }) };
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/expenses/[id]', () => {
  it('deletes an expense with ownership check (EXPN-04)', async () => {
    const createRes = await POST(makeExpenseReq(VALID_EXPENSE));
    const { expense } = await createRes.json();

    const req = new Request('http://localhost/api/expenses/' + expense._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: expense._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(200);

    // Verify it's gone
    const listRes = await GET();
    const data = await listRes.json();
    expect(data.expenses).toHaveLength(0);
  });

  it('returns 403 when deleting another users expense (EXPN-04)', async () => {
    const createRes = await POST(makeExpenseReq(VALID_EXPENSE));
    const { expense } = await createRes.json();

    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const req = new Request('http://localhost/api/expenses/' + expense._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: expense._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(403);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockSession(null);
    const createRes = await POST(makeExpenseReq(VALID_EXPENSE));
    // Need to re-auth to create, then unauth to delete
    // Actually this test needs setup differently
    mockSession({ user: { id: TEST_USER_ID, email: 'test@test.com' } });
    const createRes2 = await POST(makeExpenseReq(VALID_EXPENSE));
    const { expense } = await createRes2.json();

    mockSession(null);
    const req = new Request('http://localhost/api/expenses/' + expense._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: expense._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(401);
  });
});
