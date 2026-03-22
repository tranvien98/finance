import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Expense from '@/models/expense.model';
import { z } from 'zod';

const updateExpenseSchema = z.object({
  amount: z.number().int('Amount must be a whole number').positive('Amount must be greater than zero').optional(),
  category: z.string().min(1).max(100).optional(),
  note: z.string().max(500).optional(),
  date: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await dbConnect();
  const expense = await Expense.findById(id);

  if (!expense) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  if (expense.userId.toString() !== (session.user as { id: string }).id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) update.date = new Date(parsed.data.date);

  const updated = await Expense.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();

  return Response.json({ expense: JSON.parse(JSON.stringify(updated)) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  await dbConnect();

  const expense = await Expense.findById(id);

  if (!expense) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  if (expense.userId.toString() !== (session.user as { id: string }).id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await expense.deleteOne();

  return Response.json({ ok: true });
}
