import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISummaryOrder {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface ISummary extends Document {
  date: string; // YYYY-MM-DD format
  orders: ISummaryOrder[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  totalDeliveredAmount: number;
  orderCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SummaryOrderSchema = new Schema({
  orderId: { type: String, required: true },
  orderNumber: { type: String },
  customerName: { type: String, required: true },
  items: [{
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
});

const SummarySchema: Schema<ISummary> = new Schema(
  {
    date: {
      type: String,
      required: true,
    },
    orders: [SummaryOrderSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalDue: {
      type: Number,
      default: 0,
    },
    totalDeliveredAmount: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const Summary: Model<ISummary> =
  mongoose.models.Summary || mongoose.model<ISummary>("Summary", SummarySchema);

export default Summary;
