import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  product: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  remark?: string;
}

export interface IReturnItem {
  productName: string;
  amount: number;
}

export interface IOrder extends Document {
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerAddress?: string;
  items: IOrderItem[];
  totalAmount: number;
  returnAmount: number;
  finalAmount: number;
  paidAmount: number;
  dueAmount: number;
  returnItems: IReturnItem[];
  status: "pending" | "completed" | "cancelled";
  deliveryStatus: "pending" | "delivered" | "not_delivered";
  deliveryDate?: Date;
  deliveryNote?: string;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  product: { type: String },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  remark: { type: String },
});

const OrderSchema: Schema<IOrder> = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    items: [OrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    returnAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    returnItems: [{
      productName: { type: String, required: true },
      amount: { type: Number, required: true },
    }],
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "delivered", "not_delivered"],
      default: "pending",
    },
    deliveryDate: {
      type: Date,
    },
    deliveryNote: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
