import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string; username: string; role: string; displayName: string;
    };
  } catch {
    return null;
  }
}

// GET /api/users — list all users (admin only)
export async function GET(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  await connectDB();
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}

// POST /api/users — create user (admin only)
export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  try {
    const { username, password, role, displayName } = await req.json();

    if (!username || !password || !role || !displayName) {
      return NextResponse.json({ error: "সব তথ্য প্রদান করুন।" }, { status: 400 });
    }

    if (!["manager", "asr"].includes(role)) {
      return NextResponse.json({ error: "ভূমিকা শুধুমাত্র Manager বা ASR হতে পারে।" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "এই ব্যবহারকারীর নাম ইতিমধ্যে বিদ্যমান।" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase().trim(),
      password: hashed,
      role,
      displayName: displayName.trim(),
    });

    return NextResponse.json({
      success: true,
      user: { _id: user._id, username: user.username, role: user.role, displayName: user.displayName },
    }, { status: 201 });
  } catch (err) {
    console.error("[create-user] error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

// DELETE /api/users?id=xxx — delete user (admin only)
export async function DELETE(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID প্রয়োজন।" }, { status: 400 });

  await connectDB();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
