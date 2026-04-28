import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  shopName: string;
  customerName: string;
  address: string;
  mobile: string;
  photo: string; // base64 encoded image
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    shopName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Customer =
  (mongoose.models.Customer as mongoose.Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
