import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "admin" | "manager" | "asr";

export interface IUser extends Document {
  username: string;
  password: string; // hashed
  role: UserRole;
  displayName: string;
  createdAt: Date;
  active: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "asr"], required: true, default: "manager" },
    displayName: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
