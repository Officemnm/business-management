import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const isAdmin = payload.role === "admin";
    const username = payload.username;

    await dbConnect();
    const currentUser = await User.findById(payload.userId);

    const { searchParams } = new URL(req.url);
    const targetUser = searchParams.get("targetUser");

    const filter: Record<string, unknown> = { active: true };
    
    if (isAdmin && targetUser) {
      filter.createdBy = targetUser;
    } else if (!isAdmin) {
      filter.createdBy = currentUser?.assignedASR || username;
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
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.permissions && !currentUser.permissions.canEdit) {
      return NextResponse.json({ error: "তোমার এই পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const body = await req.json();
    const createdBy = currentUser?.assignedASR || currentUser?.username || "unknown";

    // Check for duplicate: same name + phone + address = duplicate customer
    const name = (body.name || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const address = (body.address || "").trim().toLowerCase();

    const duplicateFilter: Record<string, unknown> = {
      active: true,
      createdBy,
    };

    // Build case-insensitive name match
    duplicateFilter.name = { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

    if (phone && phone !== "N/A") {
      duplicateFilter.phone = phone;
    }

    if (address) {
      duplicateFilter.address = { $regex: new RegExp(`^${address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }

    const existing = await Customer.findOne(duplicateFilter);
    if (existing) {
      return NextResponse.json(
        { error: "এই কাস্টমার আগে থেকেই বিদ্যমান", existingCustomer: existing },
        { status: 409 }
      );
    }

    const customer = await Customer.create({ ...body, createdBy });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
