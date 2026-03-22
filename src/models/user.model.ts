import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  hashedPassword: string;
  encryptedOpenrouterKey?: string;
  encryptedTelegramBotToken?: string;
  telegramWebhookSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    encryptedOpenrouterKey: {
      type: String,
      default: null,
    },
    encryptedTelegramBotToken: {
      type: String,
      default: null,
    },
    telegramWebhookSecret: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
