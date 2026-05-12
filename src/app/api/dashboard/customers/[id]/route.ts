import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import User from "@/models/User";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.permissions && !currentUser.permissions.canEdit) {
      return NextResponse.json({ error: "তোমার এডিট করার পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.permissions && !currentUser.permissions.canDelete) {
      return NextResponse.json({ error: "তোমার মুছে ফেলার পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const { id } = await params;
    await Customer.findByIdAndUpdate(id, { active: false });
    return NextResponse.json({ message: "Customer deleted" });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
