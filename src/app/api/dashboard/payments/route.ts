import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Customer from "@/models/Customer";

// GET payments for a customer
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 });
    }

    const payments = await Payment.find({ customer: customerId }).sort({ createdAt: -1 });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
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
