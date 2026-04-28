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

// GET /api/customers — list all customers
export async function GET(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  await connectDB();

  const search = req.nextUrl.searchParams.get("search") || "";
  const filter = search
    ? {
        $or: [
          { shopName: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ customers });
}

// POST /api/customers — create customer
export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });
  }

  try {
    const { shopName, customerName, address, mobile, photo } = await req.json();

    if (!shopName || !customerName || !address || !mobile) {
      return NextResponse.json({ error: "সব তথ্য প্রদান করুন।" }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.create({
      shopName: shopName.trim(),
      customerName: customerName.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      photo: photo || "",
    });

    return NextResponse.json({
      success: true,
      customer: {
        _id: customer._id,
        shopName: customer.shopName,
        customerName: customer.customerName,
        address: customer.address,
        mobile: customer.mobile,
        photo: customer.photo,
        createdAt: customer.createdAt,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[create-customer] error:", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
