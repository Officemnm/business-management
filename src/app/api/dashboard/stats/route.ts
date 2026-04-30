import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalOrders, totalCustomers, totalProducts, allOrders, dueCustomers, todayOrders] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments({ active: true }),
      Product.countDocuments({ active: true }),
      Order.find().lean(),
      Customer.find({ totalDue: { $gt: 0 }, active: true }).lean(),
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDue = dueCustomers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayDelivered = todayOrders.filter((o) => o.deliveryStatus === "delivered").length;
    const todayPending = todayOrders.filter((o) => o.deliveryStatus !== "delivered" && o.deliveryStatus !== "not_delivered").length;

    // Last 7 days data for charts
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = allOrders.filter((o) => {
        const ct = new Date(o.createdAt);
        return ct >= dayStart && ct <= dayEnd;
      });
      last7Days.push({
        date: d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
        revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Recent activity
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(15).lean();

    return NextResponse.json({
      stats: {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalRevenue,
        totalDue,
        todayOrders: todayOrders.length,
        todayRevenue,
        todayDelivered,
        todayPending,
      },
      chartData: last7Days,
      recentActivity: recentOrders.map((o) => ({
        _id: o._id,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        paidAmount: o.paidAmount,
        dueAmount: o.dueAmount,
        itemCount: o.items?.length || 0,
        status: o.status,
        deliveryStatus: o.deliveryStatus || "pending",
        createdBy: o.createdBy,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
