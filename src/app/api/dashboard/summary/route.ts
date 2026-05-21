import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Summary from "@/models/Summary";
import Order from "@/models/Order";
import User from "@/models/User";

// GET all summaries
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    const isAdmin = payload.role === "admin";
    const username = payload.username;

    const { searchParams } = new URL(req.url);
    const targetUser = searchParams.get("targetUser");

    const filter: Record<string, unknown> = {};
    if (isAdmin && targetUser) {
      filter.createdBy = targetUser;
    } else if (!isAdmin) {
      filter.createdBy = currentUser?.assignedASR || username;
    }

    const summaries = await Summary.find(filter).sort({ date: -1 }).limit(100);
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Get summaries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new summary from selected orders
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
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "অর্ডার নির্বাচন করুন" }, { status: 400 });
    }

    const createdBy = currentUser?.assignedASR || currentUser?.username || "unknown";

    // Fetch the selected orders
    const selectedOrders = await Order.find({ _id: { $in: orderIds } });
    if (selectedOrders.length === 0) {
      return NextResponse.json({ error: "কোনো অর্ডার পাওয়া যায়নি" }, { status: 404 });
    }

    // Get today's date in BD timezone
    const now = new Date();
    const bdDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const dateStr = `${bdDate.getFullYear()}-${String(bdDate.getMonth() + 1).padStart(2, "0")}-${String(bdDate.getDate()).padStart(2, "0")}`;

    // Calculate totals
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const summaryOrders = selectedOrders.map((o) => {
      totalAmount += o.totalAmount;
      totalPaid += o.paidAmount;
      totalDue += o.dueAmount;
      return {
        orderId: o._id.toString(),
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        items: o.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        totalAmount: o.totalAmount,
        paidAmount: o.paidAmount,
        dueAmount: o.dueAmount,
      };
    });

    // Calculate total delivered amount for today
    const dayStart = new Date(`${dateStr}T00:00:00.000+06:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999+06:00`);
    const deliveredToday = await Order.find({
      createdBy,
      deliveryStatus: "delivered",
      deliveryDate: { $gte: dayStart, $lte: dayEnd },
    });
    const totalDeliveredAmount = deliveredToday.reduce((s, o) => s + o.totalAmount, 0);

    // Check if summary already exists for this date and user, if so append
    const existingSummary = await Summary.findOne({ date: dateStr, createdBy });

    if (existingSummary) {
      // Avoid duplicate orders
      const existingOrderIds = existingSummary.orders.map((o) => o.orderId);
      const newOrders = summaryOrders.filter((o) => !existingOrderIds.includes(o.orderId));

      if (newOrders.length === 0) {
        return NextResponse.json({ error: "এই অর্ডারগুলো আগেই সামারিতে আছে" }, { status: 409 });
      }

      existingSummary.orders.push(...newOrders);
      existingSummary.totalAmount += newOrders.reduce((s, o) => s + o.totalAmount, 0);
      existingSummary.totalPaid += newOrders.reduce((s, o) => s + o.paidAmount, 0);
      existingSummary.totalDue += newOrders.reduce((s, o) => s + o.dueAmount, 0);
      existingSummary.totalDeliveredAmount = totalDeliveredAmount;
      existingSummary.orderCount = existingSummary.orders.length;

      await existingSummary.save();
      return NextResponse.json(existingSummary);
    }

    // Create new summary
    const summary = await Summary.create({
      date: dateStr,
      orders: summaryOrders,
      totalAmount,
      totalPaid,
      totalDue,
      totalDeliveredAmount,
      orderCount: summaryOrders.length,
      createdBy,
    });

    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error("Create summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a summary or a specific order from a summary (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Only admin can delete
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "শুধুমাত্র এডমিন সামারি ডিলিট করতে পারবে" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const summaryId = searchParams.get("id");
    const orderId = searchParams.get("orderId");

    if (!summaryId) {
      return NextResponse.json({ error: "Summary ID required" }, { status: 400 });
    }

    const summary = await Summary.findById(summaryId);
    if (!summary) {
      return NextResponse.json({ error: "সামারি পাওয়া যায়নি" }, { status: 404 });
    }

    // If orderId provided, remove only that order from the summary
    if (orderId) {
      const orderToRemove = summary.orders.find((o) => o.orderId === orderId);
      if (!orderToRemove) {
        return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
      }

      summary.orders = summary.orders.filter((o) => o.orderId !== orderId);
      summary.totalAmount -= orderToRemove.totalAmount;
      summary.totalPaid -= orderToRemove.paidAmount;
      summary.totalDue -= orderToRemove.dueAmount;
      summary.orderCount = summary.orders.length;

      // If no orders left, delete the entire summary
      if (summary.orders.length === 0) {
        await Summary.findByIdAndDelete(summaryId);
        return NextResponse.json({ message: "সামারি ডিলিট হয়েছে" });
      }

      await summary.save();
      return NextResponse.json({ message: "অর্ডার সামারি থেকে সরানো হয়েছে" });
    }

    // Delete entire summary
    await Summary.findByIdAndDelete(summaryId);
    return NextResponse.json({ message: "সামারি ডিলিট হয়েছে" });
  } catch (error) {
    console.error("Delete summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
