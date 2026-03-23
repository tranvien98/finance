import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Investment, { ASSET_TYPES } from '@/models/investment.model';
import { z } from 'zod';

const updateInvestmentSchema = z.object({
  assetType: z.enum(ASSET_TYPES).optional(),
  name: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  buyPrice: z.number().int().positive().optional(),
  quantity: z.number().positive().optional(),
  date: z.string().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = updateInvestmentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = (session.user as { id: string }).id;

    const investment = await Investment.findById(id);

    if (!investment) {
      return Response.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (investment.userId.toString() !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = { ...parsed.data };
    if (updates.date) {
      (updates as any).date = new Date(updates.date);
    }

    const updatedInvestment = await Investment.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    return Response.json({
      investment: JSON.parse(JSON.stringify(updatedInvestment)),
    });
  } catch (error) {
    console.error('PATCH /api/investments/[id] error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await dbConnect();
    const userId = (session.user as { id: string }).id;

    const investment = await Investment.findById(id);

    if (!investment) {
      return Response.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (investment.userId.toString() !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Investment.findByIdAndDelete(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/investments/[id] error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
