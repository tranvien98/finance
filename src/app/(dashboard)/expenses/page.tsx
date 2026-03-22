import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Expense from '@/models/expense.model';
import { redirect } from 'next/navigation';
import { ExpenseList } from '@/components/expenses/expense-list';

export const metadata = { title: 'Expenses — Finance' };

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth');

  await dbConnect();
  const expenses = await Expense.find({ userId: (session.user as { id: string }).id })
    .sort({ date: -1 })
    .lean();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <ExpenseList expenses={JSON.parse(JSON.stringify(expenses))} />
    </div>
  );
}
