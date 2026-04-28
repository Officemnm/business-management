/**
 * Seed script — creates the Admin user in MongoDB.
 * Run once: node scripts/seed-admin.mjs
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";

// ── Load .env.local manually ──────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing in .env.local");

// ── User Schema (inline) ─────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "asr"], required: true },
    displayName: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ── Seed ─────────────────────────────────────────────────────────────────────
const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "@Nijhum@12";
const ADMIN_DISPLAY  = "Admin";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ username: ADMIN_USERNAME.toLowerCase() });
  if (existing) {
    console.log("ℹ️  Admin user already exists — skipping.");
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      username: ADMIN_USERNAME.toLowerCase(),
      password: hashed,
      role: "admin",
      displayName: ADMIN_DISPLAY,
    });
    console.log("✅ Admin user created successfully!");
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected.");
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
