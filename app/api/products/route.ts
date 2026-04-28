import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch { return null; }
}

// GET /api/products
export async function GET(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  await connectDB();
  const search = req.nextUrl.searchParams.get("search") || "";
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { category: { $regex: search, $options: "i" } }] }
    : {};
  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ products });
}

// POST /api/products
export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  try {
    const { name, category, price, stock, description, imageUrl, imagePublicId } = await req.json();
    if (!name || !category || price == null) {
      return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি ও মূল্য দিন।" }, { status: 400 });
    }
    await connectDB();
    const product = await Product.create({
      name: name.trim(), category: category.trim(),
      price: Number(price), stock: Number(stock) || 0,
      description: (description || "").trim(),
      imageUrl: imageUrl || "", imagePublicId: imagePublicId || "",
    });
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err) {
    console.error("[create-product]", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা।" }, { status: 500 });
  }
}
