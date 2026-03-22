import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expenses — Finance',
};

export default function ExpensesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <p className="text-muted-foreground mt-2">Your expense list will appear here.</p>
    </div>
  );
}
