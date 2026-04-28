import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import cloudinary from "@/lib/cloudinary";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch { return null; }
}

// PUT /api/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  try {
    const { id } = await params;
    const { name, category, price, stock, description, imageUrl, imagePublicId } = await req.json();
    if (!name || !category || price == null)
      return NextResponse.json({ error: "পণ্যের নাম, ক্যাটাগরি ও মূল্য দিন।" }, { status: 400 });

    await connectDB();
    const existing = await Product.findById(id);
    if (!existing) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি।" }, { status: 404 });

    // If image changed, delete old from Cloudinary
    if (imagePublicId && existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
      try { await cloudinary.uploader.destroy(existing.imagePublicId); } catch { /* ignore */ }
    }

    const updated = await Product.findByIdAndUpdate(id, {
      name: name.trim(), category: category.trim(),
      price: Number(price), stock: Number(stock) || 0,
      description: (description || "").trim(),
      ...(imageUrl !== undefined ? { imageUrl, imagePublicId: imagePublicId || "" } : {}),
    }, { new: true });

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error("[update-product]", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা।" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি।" }, { status: 404 });

    // Delete image from Cloudinary
    if (product.imagePublicId) {
      try { await cloudinary.uploader.destroy(product.imagePublicId); } catch { /* ignore */ }
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-product]", err);
    return NextResponse.json({ error: "সার্ভারে সমস্যা।" }, { status: 500 });
  }
}
