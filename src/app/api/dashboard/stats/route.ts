import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();

    const [totalOrders, totalCustomers, totalProducts, orders, dueCustomers] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments({ active: true }),
      Product.countDocuments({ active: true }),
      Order.find().sort({ createdAt: -1 }).limit(20).lean(),
      Customer.find({ totalDue: { $gt: 0 }, active: true }).lean(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDue = dueCustomers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    // Recent activity
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();

    return NextResponse.json({
      stats: {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalRevenue,
        totalDue,
      },
      recentActivity: recentOrders.map((o) => ({
        _id: o._id,
        type: "order",
        description: `${o.customerName} - ৳${o.totalAmount}`,
        status: o.status,
        dueAmount: o.dueAmount,
        createdBy: o.createdBy,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
