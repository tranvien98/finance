'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil, Trash2, TrendingUp, Plus } from 'lucide-react';
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
import type { AssetType } from '@/models/investment.model';
import { InvestmentForm } from './investment-form';
import { DeleteInvestmentDialog } from './delete-investment-dialog';

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  mutual_fund: 'Mutual Fund',
  crypto: 'Crypto',
  gold: 'Gold',
};

export interface SerializedInvestment {
  _id: string;
  userId: string;
  assetType: AssetType;
  name: string;
  amount: number;
  buyPrice: number;
  quantity: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface InvestmentListProps {
  investments: SerializedInvestment[];
}

export function InvestmentList({ investments }: InvestmentListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<SerializedInvestment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<SerializedInvestment | null>(null);

  function handleAddInvestment() {
    setEditingInvestment(null);
    setFormOpen(true);
  }

  function handleEditInvestment(investment: SerializedInvestment) {
    setEditingInvestment(investment);
    setFormOpen(true);
  }

  function handleDeleteInvestment(investment: SerializedInvestment) {
    setDeletingInvestment(investment);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Investments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{investments.length} records</p>
        </div>
        <Button
          onClick={handleAddInvestment}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      {investments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm py-16 flex flex-col items-center justify-center gap-4">
          <TrendingUp className="h-12 w-12 text-gray-300" />
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">No investments yet</h2>
            <p className="text-sm text-gray-500">Track your portfolio (gold, crypto, funds) here.</p>
          </div>
          <Button
            onClick={handleAddInvestment}
            className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Asset</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Amount (₫)</TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment._id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-600">
                      {format(new Date(investment.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {investment.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs text-gray-700 bg-gray-100">
                        {ASSET_TYPE_LABELS[investment.assetType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {investment.amount.toLocaleString('vi-VN')} ₫
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditInvestment(investment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteInvestment(investment)}
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

          <div className="md:hidden space-y-3">
            {investments.map((investment) => (
              <div
                key={investment._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      {format(new Date(investment.date), 'dd MMM yyyy')}
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {investment.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {investment.amount.toLocaleString('vi-VN')} ₫
                      </p>
                      <Badge variant="secondary" className="text-[10px] h-4 py-0 text-gray-600 bg-gray-100">
                        {ASSET_TYPE_LABELS[investment.assetType]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditInvestment(investment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteInvestment(investment)}
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

      {/* Stubs for Wave 3 components */}
      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        investment={editingInvestment}
        onSuccess={() => {
          setFormOpen(false);
          setEditingInvestment(null);
          router.refresh();
        }}
      />

      {deletingInvestment && (
        <DeleteInvestmentDialog
          investment={deletingInvestment}
          open={!!deletingInvestment}
          onOpenChange={(open) => {
            if (!open) setDeletingInvestment(null);
          }}
          onSuccess={() => {
            setDeletingInvestment(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
