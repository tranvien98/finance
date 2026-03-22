import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json({ error: 'API key is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return Response.json({ valid: true });
    }

    return Response.json(
      { valid: false, error: 'Invalid API key — check your OpenRouter credentials.' },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { valid: false, error: 'Could not reach OpenRouter. Check your connection and try again.' },
      { status: 200 }
    );
  }
}
