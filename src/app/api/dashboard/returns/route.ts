import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Return from "@/models/Return";
import Customer from "@/models/Customer";
import User from "@/models/User";

// GET returns - for a customer, all, or by date
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const isAdmin = payload.role === "admin";
    const username = payload.username;

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const list = searchParams.get("list");
    const date = searchParams.get("date");
    const targetUser = searchParams.get("targetUser");

    // Role filtering wrapper (mirrors payments route)
    const buildQuery = (baseFilter: any = {}) => {
      const q = { ...baseFilter };
      if (isAdmin && targetUser) {
        q.returnedBy = targetUser;
      } else if (!isAdmin) {
        q.returnedBy = currentUser?.assignedASR || username;
      }
      return q;
    };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000+06:00`);
      const dayEnd = new Date(`${date}T23:59:59.999+06:00`);
      const returns = await Return.find(
        buildQuery({ createdAt: { $gte: dayStart, $lte: dayEnd } })
      )
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(returns);
    }

    if (list === "all") {
      const returns = await Return.find(buildQuery())
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return NextResponse.json(returns);
    }

    if (customerId) {
      const returns = await Return.find(buildQuery({ customer: customerId })).sort({ createdAt: -1 });
      return NextResponse.json(returns);
    }

    return NextResponse.json({ error: "customerId, list, or date param required" }, { status: 400 });
  } catch (error) {
    console.error("Get returns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a product return
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
    const returnedBy = currentUser?.assignedASR || currentUser?.username || "unknown";

    const { customerId, customerName, productName, quantity, unitPrice, note } = body;
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const amount = qty * price;

    if (!customerId || !productName || amount <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Load customer to decide how to split the return between due and cash.
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const currentDue = Math.max(0, customer.totalDue || 0);
    // If the customer has a due, the return is deducted from the due first.
    // Whatever remains (or the whole amount when there is no due) is deducted
    // from cash collection.
    const fromDue = Math.min(currentDue, amount);
    const fromCash = amount - fromDue;

    // Reduce the customer's due by the due-portion.
    if (fromDue > 0) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalDue: -fromDue },
      });
    }

    const record = await Return.create({
      customer: customerId,
      customerName,
      productName,
      quantity: qty,
      unitPrice: price,
      amount,
      fromDue,
      fromCash,
      note,
      returnedBy,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create return error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a return - admin only (reverses the due adjustment)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }
    if (currentUser?.permissions && !currentUser.permissions.canDelete) {
      return NextResponse.json({ error: "তোমার মুছে ফেলার পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const returnId = searchParams.get("id");
    if (!returnId) {
      return NextResponse.json({ error: "Return ID required" }, { status: 400 });
    }

    const record = await Return.findById(returnId);
    if (!record) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    // Add the due-portion back to the customer's due.
    if (record.fromDue > 0) {
      await Customer.findByIdAndUpdate(record.customer, {
        $inc: { totalDue: record.fromDue },
      });
    }

    await Return.findByIdAndDelete(returnId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete return error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
