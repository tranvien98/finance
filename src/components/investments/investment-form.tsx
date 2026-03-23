'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ASSET_TYPES } from '@/lib/investments';
import type { SerializedInvestment } from './investment-list';
import { ASSET_TYPE_LABELS } from './investment-list';

const investmentFormSchema = z.object({
  assetType: z.enum(ASSET_TYPES, { message: 'Please select an asset type.' }),
  name: z.string().min(1, 'Name is required.').max(200),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => !isNaN(Number(v)), { message: 'Must be a number.' })
    .refine((v) => Number.isInteger(Number(v)), { message: 'Must be a whole number (VND).' })
    .refine((v) => Number(v) > 0, { message: 'Must be greater than zero.' }),
  buyPrice: z
    .string()
    .min(1, 'Buy price is required.')
    .refine((v) => !isNaN(Number(v)), { message: 'Must be a number.' })
    .refine((v) => Number.isInteger(Number(v)), { message: 'Must be a whole number (VND).' })
    .refine((v) => Number(v) > 0, { message: 'Must be greater than zero.' }),
  quantity: z
    .string()
    .min(1, 'Quantity is required.')
    .refine((v) => !isNaN(Number(v)), { message: 'Must be a number.' })
    .refine((v) => Number(v) > 0, { message: 'Must be greater than zero.' }),
  date: z.string().min(1, 'Date is required.'),
});

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: SerializedInvestment | null;
  onSuccess: () => void;
}

export function InvestmentForm({
  open,
  onOpenChange,
  investment,
  onSuccess,
}: InvestmentFormProps) {
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      assetType: investment?.assetType || 'crypto',
      name: investment?.name || '',
      amount: investment?.amount?.toString() || '',
      buyPrice: investment?.buyPrice?.toString() || '',
      quantity: investment?.quantity?.toString() || '',
      date: investment?.date ? new Date(investment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: InvestmentFormValues) {
    try {
      const payload = {
        ...values,
        amount: Number(values.amount),
        buyPrice: Number(values.buyPrice),
        quantity: Number(values.quantity),
      };

      const url = investment ? `/api/investments/${investment._id}` : '/api/investments';
      const method = investment ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      toast.success(investment ? 'Investment updated' : 'Investment added');
      onSuccess();
      if (!investment) form.reset();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{investment ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assetType">Asset Type</Label>
            <Controller
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ASSET_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.assetType && (
              <p className="text-sm text-red-500">{form.formState.errors.assetType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input id="name" placeholder="e.g. Bitcoin, SJC Gold, VFMVF1" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price (₫)</Label>
              <Input
                id="buyPrice"
                type="text"
                placeholder="0"
                {...form.register('buyPrice')}
              />
              {form.formState.errors.buyPrice && (
                <p className="text-sm text-red-500">{form.formState.errors.buyPrice.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="text"
                placeholder="0.0"
                {...form.register('quantity')}
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount (₫)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0"
              {...form.register('amount')}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register('date')} />
            {form.formState.errors.date && (
              <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {investment ? 'Save changes' : 'Add Investment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
