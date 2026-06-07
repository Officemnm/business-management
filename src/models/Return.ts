import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReturn extends Document {
  customer: mongoose.Types.ObjectId;
  customerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
  fromDue: number; // portion deducted from customer's due
  fromCash: number; // portion deducted from cash collection
  note?: string;
  returnedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema: Schema<IReturn> = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    fromDue: {
      type: Number,
      default: 0,
    },
    fromCash: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    returnedBy: {
      type: String,
      default: "unknown",
    },
  },
  { timestamps: true }
);

const Return: Model<IReturn> =
  mongoose.models.Return || mongoose.model<IReturn>("Return", ReturnSchema);

export default Return;
