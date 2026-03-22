import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Use relative imports since tsx may not resolve @/ aliases
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in .env.local');
  process.exit(1);
}

// Inline model imports to avoid @/ alias issues with tsx
// We need to connect first, then import models
async function seed() {
  console.log('Seeding database...');

  await mongoose.connect(MONGODB_URI!);

  // Import models after connection
  const { default: User } = await import('../src/models/user.model');
  const { default: Expense } = await import('../src/models/expense.model');
  const { default: Investment } = await import('../src/models/investment.model');

  // Clean existing demo data
  const existingUser = await User.findOne({ email: 'demo@finance.app' });
  if (existingUser) {
    await Expense.deleteMany({ userId: existingUser._id });
    await Investment.deleteMany({ userId: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await User.create({
    email: 'demo@finance.app',
    hashedPassword,
  });

  console.log('Created demo user: demo@finance.app');

  // Helper: random date in a given month
  const now = new Date();
  function randomDateInMonth(monthsAgo: number): Date {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    d.setDate(day);
    d.setHours(Math.floor(Math.random() * 14) + 7); // 7am - 9pm
    d.setMinutes(Math.floor(Math.random() * 60));
    return d;
  }

  // Vietnamese expense data
  const expenseData: Array<{ category: string; note: string; amount: number; monthsAgo: number }> = [
    // Food - distributed across 3 months
    { category: 'Food', note: 'Phở bò', amount: 45000, monthsAgo: 0 },
    { category: 'Food', note: 'Cà phê sữa đá', amount: 25000, monthsAgo: 0 },
    { category: 'Food', note: 'Cơm tấm', amount: 35000, monthsAgo: 0 },
    { category: 'Food', note: 'Bánh mì', amount: 15000, monthsAgo: 0 },
    { category: 'Food', note: 'Bún bò Huế', amount: 45000, monthsAgo: 0 },
    { category: 'Food', note: 'Phở bò', amount: 50000, monthsAgo: 1 },
    { category: 'Food', note: 'Cà phê sữa đá', amount: 29000, monthsAgo: 1 },
    { category: 'Food', note: 'Cơm tấm', amount: 40000, monthsAgo: 1 },
    { category: 'Food', note: 'Bánh mì', amount: 20000, monthsAgo: 1 },
    { category: 'Food', note: 'Bún bò Huế', amount: 50000, monthsAgo: 1 },
    { category: 'Food', note: 'Phở bò', amount: 55000, monthsAgo: 2 },
    { category: 'Food', note: 'Cà phê sữa đá', amount: 30000, monthsAgo: 2 },
    { category: 'Food', note: 'Cơm tấm sườn bì chả', amount: 45000, monthsAgo: 2 },
    { category: 'Food', note: 'Bánh cuốn', amount: 25000, monthsAgo: 2 },
    { category: 'Food', note: 'Bún chả Hà Nội', amount: 50000, monthsAgo: 2 },

    // Transport
    { category: 'Transport', note: 'Xăng xe máy', amount: 80000, monthsAgo: 0 },
    { category: 'Transport', note: 'Grab đi làm', amount: 35000, monthsAgo: 0 },
    { category: 'Transport', note: 'Gửi xe', amount: 5000, monthsAgo: 0 },
    { category: 'Transport', note: 'Xăng xe máy', amount: 100000, monthsAgo: 1 },
    { category: 'Transport', note: 'Grab đi làm', amount: 42000, monthsAgo: 1 },
    { category: 'Transport', note: 'Gửi xe', amount: 10000, monthsAgo: 1 },
    { category: 'Transport', note: 'Xăng xe máy', amount: 75000, monthsAgo: 2 },
    { category: 'Transport', note: 'Grab đi làm', amount: 38000, monthsAgo: 2 },

    // Entertainment
    { category: 'Entertainment', note: 'Xem phim', amount: 90000, monthsAgo: 0 },
    { category: 'Entertainment', note: 'Cà phê với bạn', amount: 65000, monthsAgo: 0 },
    { category: 'Entertainment', note: 'Xem phim', amount: 100000, monthsAgo: 1 },
    { category: 'Entertainment', note: 'Cà phê với bạn', amount: 55000, monthsAgo: 1 },
    { category: 'Entertainment', note: 'Karaoke', amount: 150000, monthsAgo: 2 },

    // Shopping
    { category: 'Shopping', note: 'Quần áo', amount: 350000, monthsAgo: 0 },
    { category: 'Shopping', note: 'Giày dép', amount: 280000, monthsAgo: 1 },
    { category: 'Shopping', note: 'Phụ kiện điện thoại', amount: 120000, monthsAgo: 2 },
    { category: 'Shopping', note: 'Quần áo', amount: 450000, monthsAgo: 2 },

    // Health
    { category: 'Health', note: 'Thuốc cảm', amount: 85000, monthsAgo: 0 },
    { category: 'Health', note: 'Khám bệnh', amount: 200000, monthsAgo: 1 },
    { category: 'Health', note: 'Vitamin', amount: 180000, monthsAgo: 1 },
    { category: 'Health', note: 'Khám bệnh', amount: 150000, monthsAgo: 2 },

    // Utilities
    { category: 'Utilities', note: 'Tiền điện', amount: 450000, monthsAgo: 0 },
    { category: 'Utilities', note: 'Tiền nước', amount: 80000, monthsAgo: 0 },
    { category: 'Utilities', note: 'Internet', amount: 200000, monthsAgo: 0 },
    { category: 'Utilities', note: 'Tiền điện', amount: 520000, monthsAgo: 1 },
    { category: 'Utilities', note: 'Tiền nước', amount: 75000, monthsAgo: 1 },
    { category: 'Utilities', note: 'Internet', amount: 200000, monthsAgo: 1 },
    { category: 'Utilities', note: 'Tiền điện', amount: 480000, monthsAgo: 2 },
    { category: 'Utilities', note: 'Tiền nước', amount: 85000, monthsAgo: 2 },
    { category: 'Utilities', note: 'Internet', amount: 200000, monthsAgo: 2 },

    // Housing
    { category: 'Housing', note: 'Tiền nhà', amount: 5000000, monthsAgo: 0 },
    { category: 'Housing', note: 'Tiền nhà', amount: 5000000, monthsAgo: 1 },
    { category: 'Housing', note: 'Tiền nhà', amount: 5000000, monthsAgo: 2 },

    // Other
    { category: 'Other', note: 'Cắt tóc', amount: 50000, monthsAgo: 0 },
    { category: 'Other', note: 'Quà sinh nhật bạn', amount: 200000, monthsAgo: 1 },
    { category: 'Other', note: 'Đồ dùng học tập', amount: 95000, monthsAgo: 2 },

    // Extra entries for variety
    { category: 'Food', note: 'Trà sữa', amount: 35000, monthsAgo: 0 },
    { category: 'Food', note: 'Hủ tiếu', amount: 40000, monthsAgo: 1 },
    { category: 'Transport', note: 'Grab về nhà', amount: 28000, monthsAgo: 0 },
    { category: 'Shopping', note: 'Sách lập trình', amount: 189000, monthsAgo: 0 },
    { category: 'Food', note: 'Mì Quảng', amount: 40000, monthsAgo: 2 },
    { category: 'Entertainment', note: 'Netflix', amount: 180000, monthsAgo: 0 },
    { category: 'Other', note: 'Gửi tiền cho mẹ', amount: 2000000, monthsAgo: 0 },
    { category: 'Food', note: 'Gỏi cuốn', amount: 30000, monthsAgo: 1 },
    { category: 'Health', note: 'Thuốc bổ', amount: 250000, monthsAgo: 2 },
    { category: 'Transport', note: 'Sửa xe', amount: 150000, monthsAgo: 2 },
  ];

  const expenses = expenseData.map((e) => ({
    userId: user._id,
    amount: e.amount,
    category: e.category,
    note: e.note,
    date: randomDateInMonth(e.monthsAgo),
  }));

  await Expense.insertMany(expenses);
  console.log(`Created ${expenses.length} expenses across 3 months`);

  // Investment data
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 20);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);

  await Investment.insertMany([
    {
      userId: user._id,
      assetType: 'mutual_fund',
      name: 'Quỹ TCBF',
      amount: 10000000,
      buyPrice: 15000,
      quantity: 667,
      date: twoMonthsAgo,
    },
    {
      userId: user._id,
      assetType: 'crypto',
      name: 'Bitcoin',
      amount: 5000000,
      buyPrice: 2500000000,
      quantity: 0.002,
      date: oneMonthAgo,
    },
    {
      userId: user._id,
      assetType: 'gold',
      name: 'Vàng SJC 1 chỉ',
      amount: 8500000,
      buyPrice: 8500000,
      quantity: 1,
      date: thisMonth,
    },
  ]);
  console.log('Created 3 investments');

  console.log('Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
