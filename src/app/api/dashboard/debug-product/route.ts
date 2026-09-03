import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

/**
 * DEBUG ENDPOINT - Check how products are stored in orders
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Get first order with items
    const order = await Order.findOne({ items: { $exists: true, $ne: [] } }).lean();
    
    if (!order) {
      return NextResponse.json({ error: "No orders found" });
    }

    return NextResponse.json({
      orderId: order._id,
      customerName: order.customerName,
      itemCount: order.items?.length || 0,
      sampleItem: order.items?.[0] || null,
      allItemKeys: order.items?.[0] ? Object.keys(order.items[0]) : [],
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
