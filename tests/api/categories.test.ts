import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDB, teardownTestDB, clearCollections, mockSession } from '../helpers/mock-db';

// Route handler imports will fail until Plan 01 creates the files — that's the RED state
// These imports are wrapped so the test file itself loads without crashing

let GET: Function, POST: Function;
let PATCH: Function, DELETE: Function;

beforeAll(async () => {
  await setupTestDB();
  mockSession({ user: { id: '507f1f77bcf86cd799439011', email: 'test@test.com' } });

  // Dynamic imports so file compiles even before route files exist
  try {
    const mod = await import('@/app/api/categories/route');
    GET = mod.GET;
    POST = mod.POST;
  } catch {
    // Expected to fail in Wave 0 — route files don't exist yet
  }
  try {
    const mod = await import('@/app/api/categories/[id]/route');
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
  mockSession({ user: { id: '507f1f77bcf86cd799439011', email: 'test@test.com' } });
});

describe('GET /api/categories', () => {
  it('seeds 8 default categories for a new user (EXPN-06)', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.categories).toHaveLength(8);
    expect(data.categories.map((c: { name: string }) => c.name)).toContain('Food');
    expect(data.categories.every((c: { isDefault: boolean }) => c.isDefault)).toBe(true);
  });

  it('returns existing categories without re-seeding (EXPN-06)', async () => {
    await GET(); // seeds defaults
    const res = await GET(); // should return same 8, not 16
    const data = await res.json();
    expect(data.categories).toHaveLength(8);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockSession(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('POST /api/categories', () => {
  it('creates a custom category (EXPN-05)', async () => {
    const req = new Request('http://localhost/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.category.name).toBe('Coffee');
    expect(data.category.isDefault).toBe(false);
  });

  it('returns 409 for duplicate category name (EXPN-05)', async () => {
    const makeReq = () => new Request('http://localhost/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee' }),
    });
    await POST(makeReq());
    const res = await POST(makeReq());
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/categories/[id]', () => {
  it('renames a category (EXPN-05)', async () => {
    // Create a category first
    const createReq = new Request('http://localhost/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee' }),
    });
    const createRes = await POST(createReq);
    const { category } = await createRes.json();

    const req = new Request('http://localhost/api/categories/' + category._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Drinks' }),
    });
    const ctx = { params: Promise.resolve({ id: category._id }) };
    const res = await PATCH(req, ctx);
    const data = await res.json();
    expect(data.category.name).toBe('Drinks');
  });

  it('returns 409 when renaming to existing name (EXPN-05)', async () => {
    await GET(); // seed defaults
    const createReq = new Request('http://localhost/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee' }),
    });
    const createRes = await POST(createReq);
    const { category } = await createRes.json();

    const req = new Request('http://localhost/api/categories/' + category._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Food' }), // Food is a default
    });
    const ctx = { params: Promise.resolve({ id: category._id }) };
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/categories/[id]', () => {
  it('deletes a custom category (EXPN-05)', async () => {
    const createReq = new Request('http://localhost/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee' }),
    });
    const createRes = await POST(createReq);
    const { category } = await createRes.json();

    const req = new Request('http://localhost/api/categories/' + category._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: category._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(200);
  });

  it('returns 400 when deleting a default category (EXPN-05)', async () => {
    await GET(); // seed defaults
    const listRes = await GET();
    const { categories } = await listRes.json();
    const defaultCat = categories.find((c: { isDefault: boolean }) => c.isDefault);

    const req = new Request('http://localhost/api/categories/' + defaultCat._id, { method: 'DELETE' });
    const ctx = { params: Promise.resolve({ id: defaultCat._id }) };
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(400);
  });
});
