'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SerializedExpense } from './expense-list';

const expenseFormSchema = z.object({
  amount: z.coerce
    .number()
    .int('Amount must be a whole number (no decimals).')
    .positive('Amount must be greater than zero.'),
  category: z.string().min(1, 'Please select a category.'),
  note: z.string().max(500).default(''),
  date: z.string().min(1, 'Date is required.'),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: SerializedExpense | null;
  onSuccess: () => void;
}

export function ExpenseForm({ open, onOpenChange, expense, onSuccess }: ExpenseFormProps) {
  const isEdit = !!expense;
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense?.amount ?? ('' as unknown as number),
      category: expense?.category ?? '',
      note: expense?.note ?? '',
      date: expense
        ? new Date(expense.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    form.reset({
      amount: expense?.amount ?? ('' as unknown as number),
      category: expense?.category ?? '',
      note: expense?.note ?? '',
      date: expense
        ? new Date(expense.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
  }, [expense, form]);

  async function onSubmit(data: ExpenseFormValues) {
    try {
      const url = isEdit ? `/api/expenses/${expense!._id}` : '/api/expenses';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = { ...data, date: new Date(data.date).toISOString() };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(isEdit ? 'Expense updated' : 'Expense saved');
      onSuccess();
    } catch {
      toast.error('Failed to save expense. Try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-amount">Amount (₫)</Label>
            <Input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 50000"
              {...form.register('amount')}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-red-600">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Category</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger id="expense-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && (
              <p className="text-xs text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-note">Note (optional)</Label>
            <Input
              id="expense-note"
              type="text"
              placeholder="What was this for?"
              {...form.register('note')}
            />
            {form.formState.errors.note && (
              <p className="text-xs text-red-600">{form.formState.errors.note.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Date</Label>
            <Input id="expense-date" type="date" {...form.register('date')} />
            {form.formState.errors.date && (
              <p className="text-xs text-red-600">{form.formState.errors.date.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Add Expense'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
