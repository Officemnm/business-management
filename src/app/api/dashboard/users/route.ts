import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const { username, password, displayName, role: userRole, phone, address } = await req.json();

    if (!username || !password || !displayName) {
      return NextResponse.json({ error: "সকল ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "এই ইউজারনেম ইতিমধ্যে আছে" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      displayName,
      role: userRole || "user",
      phone: phone || "",
      address: address || "",
      active: true,
    });

    return NextResponse.json(
      { _id: user._id, username: user.username, displayName: user.displayName, role: user.role, active: user.active, phone: user.phone, address: user.address },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
