import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  customer: mongoose.Types.ObjectId;
  customerName: string;
  amount: number;
  note?: string;
  collectedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    collectedBy: {
      type: String,
      default: "unknown",
    },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
