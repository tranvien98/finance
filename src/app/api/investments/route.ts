import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Investment, { ASSET_TYPES } from '@/models/investment.model';
import { z } from 'zod';

const createInvestmentSchema = z.object({
  assetType: z.enum(ASSET_TYPES, { message: 'Please select a valid asset type.' }),
  name: z.string().min(1, 'Name is required.').max(200),
  amount: z.number().int().positive('Amount must be positive.'),
  buyPrice: z.number().int().positive('Buy price must be positive.'),
  quantity: z.number().positive('Quantity must be positive.'),
  date: z.string().min(1, 'Date is required.'),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const userId = (session.user as { id: string }).id;

  try {
    const investments = await Investment.find({ userId })
      .sort({ date: -1 })
      .lean();

    return Response.json({ investments });
  } catch (error) {
    console.error('GET /api/investments error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createInvestmentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = (session.user as { id: string }).id;

    const investment = await Investment.create({
      userId,
      ...parsed.data,
      date: new Date(parsed.data.date),
    });

    return Response.json(
      { investment: JSON.parse(JSON.stringify(investment)) },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/investments error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
