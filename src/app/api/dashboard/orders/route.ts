import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const date = searchParams.get("date");
    const targetUser = searchParams.get("targetUser");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    
    if (isAdmin && targetUser) {
      filter.createdBy = targetUser;
    } else if (!isAdmin) {
      filter.createdBy = username;
    }
    
    if (date) {
      // date is "YYYY-MM-DD". We want to query from midnight to midnight Asia/Dhaka time.
      // Dhaka is UTC+6. So midnight Dhaka = previous day 18:00:00 UTC.
      // Let's create an exact UTC start and end.
      const start = new Date(`${date}T00:00:00.000+06:00`);
      const end = new Date(`${date}T23:59:59.999+06:00`);
      
      filter.$or = [
        { createdAt: { $gte: start, $lte: end } },
        { deliveryStatus: "pending" }
      ];
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
    await dbConnect();
    const body = await req.json();
    const createdBy = req.headers.get("x-user-name") || "unknown";

    // Force pending status — due only added to customer after delivery confirmation
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
