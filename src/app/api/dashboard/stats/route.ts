import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Payment from "@/models/Payment";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const username = payload.username;
  const isAdmin = payload.role === "admin";

  try {
    await dbConnect();
    const currentUser = await User.findById(payload.userId);

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const targetUser = searchParams.get("targetUser");
    
    let queryUsername = username;
    if (isAdmin && targetUser) {
      queryUsername = targetUser;
    } else if (!isAdmin) {
      queryUsername = currentUser?.assignedASR || username;
    }

    const shouldFilterByUser = !isAdmin || !!targetUser;

    // If date range specified, return sales for that period
    if (dateFrom && dateTo) {
      const fromDate = new Date(`${dateFrom}T00:00:00.000+06:00`);
      const toDate = new Date(`${dateTo}T23:59:59.999+06:00`);


      const orders = await Order.find({
        ...((shouldFilterByUser) ? { createdBy: queryUsername } : {}),
        createdAt: { $gte: fromDate, $lte: toDate },
      }).lean();
      
      const deliveredOrdersWithPaidDate = await Order.find({
         ...((shouldFilterByUser) ? { createdBy: queryUsername } : {}),
         $or: [
            { deliveryDate: { $gte: fromDate, $lte: toDate } },
            { createdAt: { $gte: fromDate, $lte: toDate }, deliveryDate: { $exists: false } }
         ]
      }).lean();


      const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const count = orders.length;
      const paid = deliveredOrdersWithPaidDate.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
      const due = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
      
      const paidOrdersList = deliveredOrdersWithPaidDate
        .filter(o => (o.paidAmount || 0) > 0)
        .map(o => ({
          _id: o._id,
          customerName: o.customerName,
          paidAmount: o.paidAmount,
          dueAmount: o.dueAmount,
          createdAt: o.createdAt,
          deliveryDate: o.deliveryDate
        }));

      return NextResponse.json({ revenue, count, paid, due, paidOrders: paidOrdersList });
    }

    // Today's date range (Asia/Dhaka time)
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split('/').reverse().join('-');
    const todayStart = new Date(`${todayStr}T00:00:00.000+06:00`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999+06:00`);


    const userFilter = { ...((shouldFilterByUser) ? { createdBy: queryUsername } : {}) };
    const customerFilter = { ...((shouldFilterByUser) ? { createdBy: queryUsername } : {}), active: true };

    const [totalOrders, totalCustomers, totalProducts, allOrders, dueCustomers, todayOrders, todayDeliveredOrders, allPayments, todayPayments] = await Promise.all([
      Order.countDocuments(userFilter),
      Customer.countDocuments(customerFilter),
      Product.countDocuments({ active: true }),
      Order.find(userFilter).lean(),
      Customer.find({ ...customerFilter, totalDue: { $gt: 0 } }).lean(),
      Order.find({ ...userFilter, createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Order.find({ ...userFilter, deliveryDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Payment.find({ ...((shouldFilterByUser) ? { collectedBy: queryUsername } : {}) }).sort({ createdAt: -1 }).lean(),
      Payment.find({ ...((shouldFilterByUser) ? { collectedBy: queryUsername } : {}), createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
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
      const dStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split('/').reverse().join('-');
      const dayStart = new Date(`${dStr}T00:00:00.000+06:00`);
      const dayEnd = new Date(`${dStr}T23:59:59.999+06:00`);
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
    const recentOrders = await Order.find({ ...((shouldFilterByUser) ? { createdBy: queryUsername } : {}) }).sort({ createdAt: -1 }).limit(10).lean();
    const recentPayments = await Payment.find({ ...((shouldFilterByUser) ? { collectedBy: queryUsername } : {}), amount: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();

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
