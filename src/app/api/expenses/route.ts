import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Expense from '@/models/expense.model';
import { z } from 'zod';

const createExpenseSchema = z.object({
  amount: z.number().int('Amount must be a whole number').positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required').max(100),
  note: z.string().max(500).default(''),
  date: z.string().min(1, 'Date is required'),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const expenses = await Expense.find({ userId: (session.user as { id: string }).id })
    .sort({ date: -1 })
    .lean();

  return Response.json({ expenses: JSON.parse(JSON.stringify(expenses)) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await dbConnect();
  const expense = await Expense.create({
    userId: (session.user as { id: string }).id,
    amount: parsed.data.amount,
    category: parsed.data.category,
    note: parsed.data.note,
    date: new Date(parsed.data.date),
  });

  return Response.json({ expense: JSON.parse(JSON.stringify(expense)) }, { status: 201 });
}
