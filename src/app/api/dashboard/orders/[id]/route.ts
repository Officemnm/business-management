import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import User from "@/models/User";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const isAdmin = payload.role === "admin";
    const username = payload.username;

    await dbConnect();
    const currentUser = await User.findById(payload.userId);

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const viewAs = currentUser?.assignedASR || username;

    if (!isAdmin && order.createdBy !== viewAs) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.permissions && !currentUser.permissions.canDelete) {
        return NextResponse.json({ error: "তোমার মুছে ফেলার পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only admin can delete delivered orders
    if (order.deliveryStatus === "delivered" && payload.role !== "admin") {
      return NextResponse.json({ error: "ডেলিভারি সম্পন্ন অর্ডার শুধুমাত্র এডমিন মুছতে পারবে" }, { status: 403 });
    }

    await Order.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    const currentUser = await User.findById(payload.userId);
    if (currentUser?.permissions && !currentUser.permissions.canEdit) {
        return NextResponse.json({ error: "তোমার এডিট করার পারমিশন নেই (অনলি ভিউ)" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const oldOrder = await Order.findById(id);
    if (!oldOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If delivery is being completed, calculate due and update customer
    if (body.deliveryStatus === "delivered" && oldOrder.deliveryStatus !== "delivered") {
      const returnAmount = body.returnAmount || 0;
      const finalAmount = Math.max(0, oldOrder.totalAmount - returnAmount);
      // Total paid = amount paid at order creation + amount paid at delivery
      const deliveryPaid = body.paidAmount ?? 0;
      const totalPaid = oldOrder.paidAmount + deliveryPaid;
      const newDue = Math.max(0, finalAmount - totalPaid);

      body.returnAmount = returnAmount;
      body.finalAmount = finalAmount;
      body.paidAmount = totalPaid;
      body.dueAmount = newDue;
      body.status = "completed";
      body.deliveryDate = new Date(); // Record the exact date when it was delivered/collected

      // Add due to customer (due is NOT added at order creation)
      if (newDue > 0 && oldOrder.customer) {
        await Customer.findByIdAndUpdate(oldOrder.customer, {
          $inc: { totalDue: newDue },
        });
      }
    }

    const order = await Order.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
