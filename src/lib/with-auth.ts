import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, context);
  };
}
