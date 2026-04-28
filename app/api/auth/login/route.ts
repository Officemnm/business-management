import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "ব্যবহারকারীর নাম ও পাসওয়ার্ড প্রয়োজন।" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ username: username.toLowerCase().trim(), active: true });
    if (!user) {
      return NextResponse.json({ error: "ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল হয়েছে।" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল হয়েছে।" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role, displayName: user.displayName },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    const response = NextResponse.json({
      success: true,
      role: user.role,
      displayName: user.displayName,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
