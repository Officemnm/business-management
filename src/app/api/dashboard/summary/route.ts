import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Summary from "@/models/Summary";
import Order from "@/models/Order";
import User from "@/models/User";

// GET all summaries - fetches live order data
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

    // For each summary, refresh order data from live orders
    const refreshedSummaries = await Promise.all(
      summaries.map(async (summary) => {
        const orderIds = summary.orders.map((o) => o.orderId);
        const liveOrders = await Order.find({ _id: { $in: orderIds } }).lean();

        let totalAmount = 0;
        let totalPaid = 0;
        let totalDue = 0;

        const updatedOrders = summary.orders.map((so) => {
          const liveOrder = liveOrders.find((lo: any) => lo._id.toString() === so.orderId);
          if (liveOrder) {
            totalAmount += liveOrder.totalAmount;
            totalPaid += liveOrder.paidAmount;
            totalDue += liveOrder.dueAmount;
            return {
              orderId: so.orderId,
              orderNumber: liveOrder.orderNumber || so.orderNumber,
              customerName: liveOrder.customerName,
              items: liveOrder.items.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
              totalAmount: liveOrder.totalAmount,
              paidAmount: liveOrder.paidAmount,
              dueAmount: liveOrder.dueAmount,
            };
          }
          // Order was deleted, skip it
          return null;
        }).filter(Boolean);

        // Calculate delivered amount for this date
        const dayStart = new Date(`${summary.date}T00:00:00.000+06:00`);
        const dayEnd = new Date(`${summary.date}T23:59:59.999+06:00`);
        const deliveredToday = await Order.find({
          createdBy: summary.createdBy,
          deliveryStatus: "delivered",
          deliveryDate: { $gte: dayStart, $lte: dayEnd },
        }).lean();
        const totalDeliveredAmount = deliveredToday.reduce((s: number, o: any) => s + o.totalAmount, 0);

        // Calculate collection from summary orders that were delivered on this date
        // (how much was paid when these specific orders were delivered)
        const summaryOrderIds = summary.orders.map((o) => o.orderId);
        const deliveredSummaryOrders = deliveredToday.filter((o: any) => summaryOrderIds.includes(o._id.toString()));
        const orderCollectionAmount = deliveredSummaryOrders.reduce((s: number, o: any) => s + (o.paidAmount || 0), 0);

        return {
          _id: summary._id,
          date: summary.date,
          orders: updatedOrders,
          totalAmount,
          totalPaid,
          totalDue,
          totalDeliveredAmount,
          orderCollectionAmount,
          orderCount: updatedOrders.length,
          createdBy: summary.createdBy,
          createdAt: summary.createdAt,
          updatedAt: summary.updatedAt,
        };
      })
    );

    return NextResponse.json(refreshedSummaries);
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
    const newSummary = await Summary.create({
      date: dateStr,
      orders: summaryOrders,
      totalAmount,
      totalPaid,
      totalDue,
      totalDeliveredAmount,
      orderCount: summaryOrders.length,
      createdBy,
    });

    return NextResponse.json(newSummary, { status: 201 });
  } catch (error) {
    console.error("Create summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update product quantity in a summary
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const body = await req.json();
    const { summaryId, productName, newQuantity } = body;

    if (!summaryId || !productName || newQuantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const summaryDoc = await Summary.findById(summaryId);
    if (!summaryDoc) {
      return NextResponse.json({ error: "সামারি পাওয়া যায়নি" }, { status: 404 });
    }

    // Update quantity: distribute the new total quantity proportionally across orders
    // First, find the current total quantity for this product across all orders
    let currentTotalQty = 0;
    summaryDoc.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.productName === productName) {
          currentTotalQty += item.quantity;
        }
      });
    });

    if (currentTotalQty === 0) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
    }

    // Calculate the ratio to apply
    const ratio = newQuantity / currentTotalQty;
    let totalAmountDiff = 0;

    summaryDoc.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.productName === productName) {
          const oldTotal = item.total;
          const newItemQty = Math.round(item.quantity * ratio);
          const newTotal = newItemQty * item.unitPrice;
          const diff = newTotal - oldTotal;

          item.quantity = newItemQty;
          item.total = newTotal;

          order.totalAmount += diff;
          totalAmountDiff += diff;
        }
      });
    });

    // Update summary totals
    summaryDoc.totalAmount += totalAmountDiff;
    summaryDoc.orderCount = summaryDoc.orders.length;

    await summaryDoc.save();
    return NextResponse.json(summaryDoc);
  } catch (error) {
    console.error("Update summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a summary or a specific order from a summary
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const summaryId = searchParams.get("id");
    const orderId = searchParams.get("orderId");

    if (!summaryId) {
      return NextResponse.json({ error: "Summary ID required" }, { status: 400 });
    }

    const summaryToDelete = await Summary.findById(summaryId);
    if (!summaryToDelete) {
      return NextResponse.json({ error: "সামারি পাওয়া যায়নি" }, { status: 404 });
    }

    // Non-admin users can only delete on the same day (BD time)
    if (payload.role !== "admin") {
      const now = new Date();
      const bdToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(now);
      if (summaryToDelete.date !== bdToday) {
        return NextResponse.json({ error: "রাত ১২ টার পর সামারি ডিলিট করা যাবে না" }, { status: 403 });
      }
    }

    // If orderId provided, remove only that order from the summary
    if (orderId) {
      const orderToRemove = summaryToDelete.orders.find((o) => o.orderId === orderId);
      if (!orderToRemove) {
        return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
      }

      summaryToDelete.orders = summaryToDelete.orders.filter((o) => o.orderId !== orderId);
      summaryToDelete.totalAmount -= orderToRemove.totalAmount;
      summaryToDelete.totalPaid -= orderToRemove.paidAmount;
      summaryToDelete.totalDue -= orderToRemove.dueAmount;
      summaryToDelete.orderCount = summaryToDelete.orders.length;

      // If no orders left, delete the entire summary
      if (summaryToDelete.orders.length === 0) {
        await Summary.findByIdAndDelete(summaryId);
        return NextResponse.json({ message: "সামারি ডিলিট হয়েছে" });
      }

      await summaryToDelete.save();
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
