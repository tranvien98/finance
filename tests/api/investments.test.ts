import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDB, teardownTestDB, clearCollections, mockSession } from '../helpers/mock-db';

let GET: Function, POST: Function;
let PATCH: Function, DELETE: Function;

const TEST_USER_ID = '507f1f77bcf86cd799439011';
const OTHER_USER_ID = '507f1f77bcf86cd799439022';

beforeAll(async () => {
  await setupTestDB();
  mockSession({ user: { id: TEST_USER_ID, email: 'test@test.com' } });

  const routeMod = await import('@/app/api/investments/route');
  GET = routeMod.GET;
  POST = routeMod.POST;

  const idRouteMod = await import('@/app/api/investments/[id]/route');
  PATCH = idRouteMod.PATCH;
  DELETE = idRouteMod.DELETE;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  mockSession({ user: { id: TEST_USER_ID, email: 'test@test.com' } });
});

function makeInvestmentReq(data: Record<string, unknown>) {
  return new Request('http://localhost/api/investments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

const VALID_INVESTMENT = {
  assetType: 'crypto',
  name: 'Bitcoin',
  amount: 1000000,
  buyPrice: 500000,
  quantity: 2,
  date: '2026-03-22T00:00:00.000Z',
};

describe('POST /api/investments', () => {
  it('creates an investment with valid data (INVS-01)', async () => {
    const res = await POST(makeInvestmentReq(VALID_INVESTMENT));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.investment.name).toBe('Bitcoin');
    expect(data.investment.assetType).toBe('crypto');
    expect(data.investment.amount).toBe(1000000);
  });

  it('rejects non-integer amount with 400 (INVS-01)', async () => {
    const res = await POST(makeInvestmentReq({ ...VALID_INVESTMENT, amount: 100000.5 }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid assetType with 400 (INVS-01, INVS-05)', async () => {
    const res = await POST(makeInvestmentReq({ ...VALID_INVESTMENT, assetType: 'stocks' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockSession(null);
    const res = await POST(makeInvestmentReq(VALID_INVESTMENT));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/investments', () => {
  it('returns only authenticated user investments sorted by date desc (INVS-02)', async () => {
    await POST(makeInvestmentReq({ ...VALID_INVESTMENT, name: 'first', date: '2026-03-20T00:00:00.000Z' }));
    await POST(makeInvestmentReq({ ...VALID_INVESTMENT, name: 'second', date: '2026-03-22T00:00:00.000Z' }));

    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.investments).toHaveLength(2);
    expect(data.investments[0].name).toBe('second');
    expect(data.investments[1].name).toBe('first');
  });

  it('does not return other users investments (INVS-02)', async () => {
    await POST(makeInvestmentReq(VALID_INVESTMENT));
    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const res = await GET();
    const data = await res.json();
    expect(data.investments).toHaveLength(0);
  });
});

describe('PATCH /api/investments/[id]', () => {
  it('updates an investment with ownership check (INVS-03)', async () => {
    const createRes = await POST(makeInvestmentReq(VALID_INVESTMENT));
    const { investment } = await createRes.json();

    const req = new Request('http://localhost/api/investments/' + investment._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1500000 }),
    });
    const ctx = { params: Promise.resolve({ id: investment._id }) };
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.investment.amount).toBe(1500000);
  });

  it('returns 403 when updating another users investment (INVS-03)', async () => {
    const createRes = await POST(makeInvestmentReq(VALID_INVESTMENT));
    const { investment } = await createRes.json();

    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const req = new Request('http://localhost/api/investments/' + investment._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1500000 }),
    });
    const ctx = { params: Promise.resolve({ id: investment._id }) };
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/investments/[id]', () => {
  it('deletes an investment with ownership check (INVS-04)', async () => {
    const createRes = await POST(makeInvestmentReq(VALID_INVESTMENT));
    const { investment } = await createRes.json();

    const req = new Request('http://localhost/api/investments/' + investment._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: investment._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(200);

    const listRes = await GET();
    const data = await listRes.json();
    expect(data.investments).toHaveLength(0);
  });

  it('returns 403 when deleting another users investment (INVS-04)', async () => {
    const createRes = await POST(makeInvestmentReq(VALID_INVESTMENT));
    const { investment } = await createRes.json();

    mockSession({ user: { id: OTHER_USER_ID, email: 'other@test.com' } });
    const req = new Request('http://localhost/api/investments/' + investment._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: investment._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(403);
  });
});
