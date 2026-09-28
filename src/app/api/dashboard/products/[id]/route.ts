import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await dbConnect();
    
    // Only admin can edit products
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "শুধুমাত্র এডমিন প্রোডাক্ট এডিট করতে পারবে" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Update product error:", error);
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
    
    // Only admin can delete products
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "শুধুমাত্র এডমিন প্রোডাক্ট মুছতে পারবে" }, { status: 403 });
    }

    const { id } = await params;
    await Product.findByIdAndUpdate(id, { active: false });
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
