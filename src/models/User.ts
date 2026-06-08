import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  role: string;
  active: boolean;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
  assignedASR?: string;
  categoryTargets?: Record<string, number>;
  /** Whether the user has consented to work-time location sharing (set from the app). */
  locationSharingEnabled?: boolean;
  /** Last reported location. Updated by the field user's device while sharing is on. */
  lastLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    batteryLevel?: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    role: {
      type: String,
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canDelete: { type: Boolean, default: true },
    },
    assignedASR: {
      type: String,
      default: "",
    },
    // Per-category sales targets, e.g. { "শিউলী": 50000, "চায়না": 30000 }
    categoryTargets: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Work-time location sharing consent (toggled from the mobile app).
    locationSharingEnabled: {
      type: Boolean,
      default: false,
    },
    // Latest reported position from the user's device.
    lastLocation: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      speed: { type: Number },
      batteryLevel: { type: Number },
      updatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
