import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/lib/models/Customer";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string; username: string; role: string; displayName: string;
    };
  } catch {
    return null;
  }
}

// PUT /api/customers/[id] — update customer
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { shopName, customerName, address, mobile, photo } = await req.json();

    if (!shopName || !customerName || !address || !mobile) {
      return NextResponse.json({ error: "সব তথ্য প্রদান করুন।" }, { status: 400 });
    }

    await connectDB();

    const updated = await Customer.findByIdAndUpdate(
      id,
      {
        shopName: shopName.trim(),
        customerName: customerName.trim(),
        address: address.trim(),
        mobile: mobile.trim(),
        ...(photo !== undefined ? { photo } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "গ্রাহক পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (err) {
    console.error("[update-customer] error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

// DELETE /api/customers/[id] — delete customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await connectDB();
    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "গ্রাহক পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-customer] error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
