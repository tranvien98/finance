import mongoose from 'mongoose';
import Expense from '@/models/expense.model';
import Investment from '@/models/investment.model';

export async function getDashboardStats(userId: string, from: Date, to: Date) {
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: from, $lte: to },
  };

  const [expenseTotals] = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
      },
    },
  ]);

  const categoryBreakdown = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const dailySeries = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const [investmentTotals] = await Investment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalInvestments: { $sum: '$amount' },
      },
    },
  ]);

  return {
    totalExpenses: expenseTotals?.totalExpenses ?? 0,
    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, total: c.total })),
    dailySeries: dailySeries.map((d) => ({ date: d._id, total: d.total })),
    totalInvestments: investmentTotals?.totalInvestments ?? 0,
  };
}
