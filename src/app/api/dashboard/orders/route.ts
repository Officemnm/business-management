import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

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
    const limit = parseInt(searchParams.get("limit") || "1000");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const targetUser = searchParams.get("targetUser");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    
    if (isAdmin && targetUser) {
      filter.createdBy = targetUser;
    } else if (!isAdmin) {
      if (currentUser?.assignedASR) {
        filter.createdBy = currentUser.assignedASR;
      } else {
        filter.createdBy = username;
      }
    }
    
    if (date) {
      const start = new Date(`${date}T00:00:00.000+06:00`);
      const end = new Date(`${date}T23:59:59.999+06:00`);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
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

    const orderNumber = `ORD-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;
    
    const order = await Order.create({
      ...body,
      orderNumber,
      createdBy,
      status: "pending",
      deliveryStatus: "pending",
    });

    // Update product stock (skip manual products)
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        if (item.product && !item.product.startsWith("manual-") && mongoose.isValidObjectId(item.product)) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
