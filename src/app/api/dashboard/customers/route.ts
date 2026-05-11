import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const isAdmin = payload.role === "admin";
    const username = payload.username;

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const targetUser = searchParams.get("targetUser");

    const filter: Record<string, unknown> = { active: true };
    
    if (isAdmin && targetUser) {
      filter.createdBy = targetUser;
    } else if (!isAdmin) {
      filter.createdBy = username;
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const createdBy = req.headers.get("x-user-name") || "unknown";
    const customer = await Customer.create({ ...body, createdBy });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
