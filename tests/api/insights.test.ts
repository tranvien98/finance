import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/insights/route';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { getDashboardStats } from '@/lib/dashboard-aggregations';
import User from '@/models/user.model';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/dashboard-aggregations', () => ({
  getDashboardStats: vi.fn(),
}));

vi.mock('@/models/user.model', () => ({
  default: {
    findById: vi.fn().mockReturnThis(),
    lean: vi.fn(),
  },
}));

// Mock fetch for OpenRouter
global.fetch = vi.fn();

describe('GET /api/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost:3000/api/insights'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if user does not have an OpenRouter API key', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: '9999-12-31T23:59:59.999Z',
    } as any);

    vi.mocked(User.findById).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce({ encryptedOpenrouterKey: undefined }),
    } as any);

    const response = await GET(new Request('http://localhost:3000/api/insights'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('OpenRouter API key missing. Configure it in settings to see AI insights.');
  });

  it('should generate an AI insight using OpenRouter', async () => {
    process.env.OPENROUTER_API_KEY = 'test-env-key';

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: '9999-12-31T23:59:59.999Z',
    } as any);

    // Mock User DB lookup
    vi.mocked(User.findById).mockReturnValueOnce({
      lean: vi.fn().mockResolvedValueOnce({ encryptedOpenrouterKey: undefined }), // assuming testing with env fallback
    } as any);

    // Mock dashboard stats
    vi.mocked(getDashboardStats).mockResolvedValueOnce({
      totalExpenses: 5000000,
      totalInvestments: 2000000,
      categoryBreakdown: [{ category: 'Food', total: 3000000 }],
      dailySeries: [],
    });

    // Mock fetch response from OpenRouter
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Tình hình tài chính của bạn tháng này rất ổn định. Chi tiêu ăn uống chiếm phần lớn nhưng bạn vẫn tiết kiệm và đầu tư được.',
            },
          },
        ],
      }),
    } as Response);

    const response = await GET(new Request('http://localhost:3000/api/insights'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.insight).toContain('Tình hình tài chính');
  });
});
