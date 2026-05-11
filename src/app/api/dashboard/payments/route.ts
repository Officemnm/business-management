import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Customer from "@/models/Customer";

// GET payments - either for a customer or all payments
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
    const customerId = searchParams.get("customerId");
    const list = searchParams.get("list");
    const date = searchParams.get("date");
    const targetUser = searchParams.get("targetUser"); // Add support for target user

    // Base query wrapper for role filtering
    const buildQuery = (baseFilter: any = {}) => {
      const q = { ...baseFilter };
      if (isAdmin && targetUser) {
        q.collectedBy = targetUser;
      } else if (!isAdmin) {
        q.collectedBy = username;
      }
      return q;
    };

    // If date param is provided, return payments for that date
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000+06:00`);
      const dayEnd = new Date(`${date}T23:59:59.999+06:00`);

      const query = buildQuery({
        amount: { $gt: 0 },
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(payments);
    }

    // If list param is provided, return all positive payments (collections)
    if (list === "all") {
      const payments = await Payment.find(buildQuery({ amount: { $gt: 0 } }))
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return NextResponse.json(payments);
    }

    // If customerId provided, return payments for that customer
    if (customerId) {
      // NOTE: Normally, if not admin, you'd verify if this customer belongs to username...
      // But the customer list itself is already filtered. We apply buildQuery here too
      // so users only see their own collections for this customer.
      const payments = await Payment.find(buildQuery({ customer: customerId })).sort({ createdAt: -1 });
      return NextResponse.json(payments);
    }

    return NextResponse.json({ error: "customerId, list, or date param required" }, { status: 400 });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE payment - admin only
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    // Check if user is admin
    const userRole = req.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // If it was a positive payment (collection), add the amount back to customer's due
    if (payment.amount > 0) {
      await Customer.findByIdAndUpdate(payment.customer, {
        $inc: { totalDue: payment.amount },
      });
    }

    await Payment.findByIdAndDelete(paymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST collect a payment
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const collectedBy = req.headers.get("x-user-name") || "unknown";

    const { customerId, customerName, amount, note } = body;
    if (!customerId || amount === undefined || amount === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Create payment record (negative amount = manual due added)
    const payment = await Payment.create({
      customer: customerId,
      customerName,
      amount,
      note,
      collectedBy,
    });

    // Only reduce customer totalDue for positive payments (collections)
    // Negative amounts (manual due) are handled by the customer update endpoint
    if (amount > 0) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalDue: -amount },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
