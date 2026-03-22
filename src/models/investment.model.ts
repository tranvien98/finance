import mongoose, { Schema, Document, Model } from 'mongoose';

export const ASSET_TYPES = ['mutual_fund', 'crypto', 'gold'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export interface IInvestment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assetType: AssetType;
  name: string;
  amount: number; // Integer VND
  buyPrice: number; // Integer VND
  quantity: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assetType: {
      type: String,
      required: true,
      enum: ASSET_TYPES,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer VND value',
      },
    },
    buyPrice: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Buy price must be an integer VND value',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

InvestmentSchema.index({ userId: 1, date: -1 });

const Investment: Model<IInvestment> =
  mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);

export default Investment;
