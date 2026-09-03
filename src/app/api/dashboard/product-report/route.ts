import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

/**
 * GET /api/dashboard/product-report
 * Query params: productId, from, to
 * Returns product sales and stock data for the given date range
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
  
  const username = payload.username;
  const isAdmin = payload.role === "admin";

  try {
    await dbConnect();
    const currentUser = await User.findById(payload.userId);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Date range required" }, { status: 400 });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const fromDate = new Date(`${dateFrom}T00:00:00.000+06:00`);
    const toDate = new Date(`${dateTo}T23:59:59.999+06:00`);

    // Determine query username (for filtering by user if not admin)
    let queryUsername = username;
    if (!isAdmin) {
      queryUsername = currentUser?.assignedASR || username;
    }
    const shouldFilterByUser = !isAdmin;

    // Find all orders in date range
    const allOrders = await Order.find({
      ...(shouldFilterByUser ? { createdBy: queryUsername } : {}),
      createdAt: { $gte: fromDate, $lte: toDate },
    }).lean();
    
    // Filter orders that contain this product
    const orders = allOrders.filter(order => {
      return order.items?.some((item: any) => {
        const itemProduct = item.product?.toString() || item.productId?.toString();
        return itemProduct === productId;
      });
    });

    // Calculate total sold quantity and revenue
    let totalSold = 0;
    let revenue = 0;

    const stockHistory: Array<{
      type: "sold";
      quantity: number;
      date: Date;
      orderId: string;
      customerName: string;
    }> = [];

    for (const order of orders) {
      for (const item of order.items || []) {
        const itemProduct = (item as any).product?.toString() || (item as any).productId?.toString();
        if (itemProduct === productId) {
          totalSold += item.quantity || 0;
          revenue += item.total || 0;
          
          stockHistory.push({
            type: "sold",
            quantity: item.quantity || 0,
            date: order.createdAt,
            orderId: order._id.toString(),
            customerName: order.customerName || "Unknown",
          });
        }
      }
    }

    // TODO: Add stock-in history when you have a stock management system
    // For now, we'll show the current stock from the product
    const totalStock = product.stock || 0;

    // Sort stock history by date (newest first)
    stockHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      totalSold,
      totalStock,
      revenue,
      stockHistory: stockHistory.map((item) => ({
        type: item.type,
        quantity: item.quantity,
        date: item.date,
      })),
    });
  } catch (error) {
    console.error("Product report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
