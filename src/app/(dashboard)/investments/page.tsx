import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Investment from '@/models/investment.model';
import { redirect } from 'next/navigation';
import { InvestmentList } from '@/components/investments/investment-list';

export const metadata = { title: 'Investments' };

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth');

  await dbConnect();
  const investments = await Investment.find({ userId: (session.user as { id: string }).id })
    .sort({ date: -1 })
    .lean();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <InvestmentList investments={JSON.parse(JSON.stringify(investments))} />
    </div>
  );
}
