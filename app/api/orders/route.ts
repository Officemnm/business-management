import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  try {
    const body = await req.json();
    const { customerId, customerName, shopName, items, status } = body as {
      customerId: string;
      customerName: string;
      shopName: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        remark?: string;
      }>;
      status?: "pending" | "processing" | "delivered" | "cancelled";
    };

    if (!customerId || !customerName || !shopName) {
      return NextResponse.json({ error: "গ্রাহকের তথ্য প্রদান করুন।" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "অর্ডারে অন্তত একটি পণ্য দিন।" }, { status: 400 });
    }

    const normalizedItems = items.map(it => {
      const quantity = Number(it.quantity);
      const unitPrice = Number(it.unitPrice);
      return {
        productId: it.productId,
        quantity,
        unitPrice,
        remark: (it.remark || "").toString(),
      };
    });

    for (const it of normalizedItems) {
      if (!it.productId) return NextResponse.json({ error: "পণ্য নির্বাচন করুন।" }, { status: 400 });
      if (!Number.isFinite(it.quantity) || it.quantity < 1) return NextResponse.json({ error: "কন্টিটি ১ বা তার বেশি দিন।" }, { status: 400 });
      if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) return NextResponse.json({ error: "প্রতি ইউনিট প্রাইস সঠিকভাবে দিন।" }, { status: 400 });
    }

    await connectDB();

    // Stock check: sum quantities per productId
    const quantityByProductId = new Map<string, number>();
    for (const it of normalizedItems) {
      quantityByProductId.set(it.productId, (quantityByProductId.get(it.productId) || 0) + it.quantity);
    }

    const productIds = Array.from(quantityByProductId.keys());
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [String(p._id), p]));

    for (const [productId, sumQty] of quantityByProductId.entries()) {
      const p = productMap.get(productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      if (typeof p.stock === "number" && p.stock < sumQty) {
        return NextResponse.json({ error: `স্টক অপর্যাপ্ত: ${p.name}` }, { status: 400 });
      }
    }

    let computedTotal = 0;
    const orderItems = normalizedItems.map(it => {
      const p = productMap.get(it.productId);
      if (!p) throw new Error("PRODUCT_NOT_FOUND");
      computedTotal += it.quantity * it.unitPrice;
      return {
        productId: it.productId,
        productName: p.name,
        productImage: p.imageUrl || "",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.quantity * it.unitPrice,
        remark: it.remark || "",
      };
    });

    const safeStatus: IOrderStatus = status || "pending";
    const order = await Order.create({
      customerId,
      customerName: customerName.trim(),
      shopName: shopName.trim(),
      items: orderItems as any,
      totalAmount: computedTotal,
      status: safeStatus,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    console.error("[create-order] error:", err);

    if (err instanceof Error && err.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ error: "সার্ভারে সমস্যা।" }, { status: 500 });
  }
}

type IOrderStatus = "pending" | "processing" | "delivered" | "cancelled";

