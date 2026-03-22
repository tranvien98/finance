'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil, Trash2, Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseForm } from './expense-form';
import { DeleteExpenseDialog } from './delete-expense-dialog';

export interface SerializedExpense {
  _id: string;
  userId: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseListProps {
  expenses: SerializedExpense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SerializedExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<SerializedExpense | null>(null);

  function handleAddExpense() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function handleEditExpense(expense: SerializedExpense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function handleDeleteExpense(expense: SerializedExpense) {
    setDeletingExpense(expense);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{expenses.length} expenses</p>
        </div>
        <Button
          onClick={handleAddExpense}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm py-16 flex flex-col items-center justify-center gap-4">
          <Receipt className="h-12 w-12 text-gray-300" />
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">No expenses yet</h2>
            <p className="text-sm text-gray-500">Add your first expense to start tracking.</p>
          </div>
          <Button
            onClick={handleAddExpense}
            className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Amount (₫)</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Note</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense._id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-600">
                      {format(new Date(expense.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {expense.amount.toLocaleString('vi-VN')} ₫
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs text-gray-700 bg-gray-100">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 max-w-[200px]">
                      {expense.note.length > 48
                        ? expense.note.slice(0, 48) + '...'
                        : expense.note}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit expense"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete expense"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteExpense(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      {format(new Date(expense.date), 'dd MMM yyyy')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {expense.amount.toLocaleString('vi-VN')} ₫
                    </p>
                    <Badge variant="secondary" className="text-xs text-gray-700 bg-gray-100">
                      {expense.category}
                    </Badge>
                    {expense.note && (
                      <p className="text-xs text-gray-500 truncate">
                        {expense.note.length > 48
                          ? expense.note.slice(0, 48) + '...'
                          : expense.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit expense"
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete expense"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteExpense(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category manager will be added in Plan 04 */}

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
        onSuccess={() => {
          setFormOpen(false);
          setEditingExpense(null);
          router.refresh();
        }}
      />
      {deletingExpense && (
        <DeleteExpenseDialog
          expense={deletingExpense}
          open={!!deletingExpense}
          onOpenChange={(open) => {
            if (!open) setDeletingExpense(null);
          }}
          onSuccess={() => {
            setDeletingExpense(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
