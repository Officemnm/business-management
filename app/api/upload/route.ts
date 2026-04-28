import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
  } catch { return null; }
}

// POST /api/upload — upload image to Cloudinary, return URL
export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);
  if (!payload) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 403 });

  try {
    const { image, folder = "products" } = await req.json();
    if (!image) return NextResponse.json({ error: "ছবি প্রদান করুন।" }, { status: 400 });

    const result = await cloudinary.uploader.upload(image, {
      folder: `varieties-cosmetics/${folder}`,
      transformation: [{ width: 600, height: 600, crop: "limit", quality: "auto" }],
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "ছবি আপলোড ব্যর্থ।" }, { status: 500 });
  }
}
