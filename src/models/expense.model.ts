import mongoose, { Schema, Document, Model } from 'mongoose';

export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Health',
  'Utilities',
  'Housing',
  'Other',
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number; // Integer VND — no decimals
  category: string;
  note: string;
  date: Date;
  telegramMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer (VND has no subunits)',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    telegramMessageId: {
      type: Number,
      default: null,
      sparse: true,
      unique: true,
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
