import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Payment from "@/models/Payment";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  try {
    await dbConnect();

    // If date range specified, return sales for that period
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      const orders = await Order.find({
        createdAt: { $gte: fromDate, $lte: toDate },
      }).lean();
      
      const deliveredOrdersWithPaidDate = await Order.find({
         $or: [
            { deliveryDate: { $gte: fromDate, $lte: toDate } },
            { createdAt: { $gte: fromDate, $lte: toDate }, deliveryDate: { $exists: false } }
         ]
      }).lean();

      const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const count = orders.length;
      const paid = deliveredOrdersWithPaidDate.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
      const due = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

      return NextResponse.json({ revenue, count, paid, due });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalOrders, totalCustomers, totalProducts, allOrders, dueCustomers, todayOrders, todayDeliveredOrders, allPayments, todayPayments] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments({ active: true }),
      Product.countDocuments({ active: true }),
      Order.find().lean(),
      Customer.find({ totalDue: { $gt: 0 }, active: true }).lean(),
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Order.find({ deliveryDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Payment.find().sort({ createdAt: -1 }).lean(),
      Payment.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDue = dueCustomers.reduce((sum, c) => sum + (c.totalDue || 0), 0);

    // Calculate total collection (order paidAmount + payment collections)
    const totalOrderPaid = allOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalPaymentCollection = allPayments
      .filter(p => p.amount > 0)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCollection = totalOrderPaid + totalPaymentCollection;

    // Today's stats
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // For today's collection: 
    // 1. Orders created AND paid today (pending delivery but advance paid, or delivered immediately)
    const todayCreatedPaid = todayOrders.reduce((sum, o) => {
      // If it wasn't delivered today, it was advance payment at creation today
      if (!o.deliveryDate || new Date(o.deliveryDate) > todayEnd || new Date(o.deliveryDate) < todayStart) {
        return sum + (o.paidAmount || 0);
      }
      return sum;
    }, 0);
    // 2. Orders delivered today (their money is collected upon delivery, meaning today)
    const todayDeliveredPaid = todayDeliveredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    
    const todayOrderPaid = todayCreatedPaid + todayDeliveredPaid;
    
    const todayPaymentCollection = todayPayments
      .filter(p => p.amount > 0)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const todayCollection = todayOrderPaid + todayPaymentCollection;

    const todayDelivered = todayDeliveredOrders.filter((o) => o.deliveryStatus === "delivered").length;
    const todayPending = todayOrders.filter((o) => o.deliveryStatus !== "delivered" && o.deliveryStatus !== "not_delivered").length;

    // Last 7 days data for charts
    const last7Days: { date: string; revenue: number; orders: number; collection?: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = allOrders.filter((o) => {
        const ct = new Date(o.createdAt);
        return ct >= dayStart && ct <= dayEnd;
      });
      
      const dayCollectionsFromOrders = allOrders.filter((o) => {
        if (o.deliveryDate) {
          const dt = new Date(o.deliveryDate);
          return dt >= dayStart && dt <= dayEnd;
        } else {
          const ct = new Date(o.createdAt);
          return ct >= dayStart && ct <= dayEnd;
        }
      });
      
      const dayPaymentsList = allPayments.filter((p) => {
        const ct = new Date(p.createdAt);
        return ct >= dayStart && ct <= dayEnd;
      });

      last7Days.push({
        date: d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
        revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        orders: dayOrders.length,
        collection: dayCollectionsFromOrders.reduce((s, o) => s + (o.paidAmount || 0), 0) + dayPaymentsList.reduce((s, p) => s + (p.amount || 0), 0)
      });
    }

    // Recent activity - combine orders and payments
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean();
    const recentPayments = await Payment.find({ amount: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();

    // Combine and sort by date
    const combinedActivity = [
      ...recentOrders.map((o) => ({
        _id: o._id,
        type: "order" as const,
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
      ...recentPayments.map((p) => ({
        _id: p._id,
        type: "payment" as const,
        customerName: p.customerName,
        totalAmount: p.amount,
        paidAmount: p.amount,
        dueAmount: 0,
        itemCount: 0,
        status: "completed",
        deliveryStatus: "payment",
        createdBy: p.collectedBy,
        createdAt: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    return NextResponse.json({
      stats: {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalRevenue,
        totalDue,
        totalCollection,
        todayOrders: todayOrders.length,
        todayRevenue,
        todayCollection,
        todayDelivered,
        todayPending,
      },
      chartData: last7Days,
      recentActivity: combinedActivity,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
