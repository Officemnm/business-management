import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * POST /api/dashboard/location
 * The authenticated field user's device reports its current position here.
 * Auth is via the httpOnly `token` cookie (same as the rest of the app), so
 * a user can only ever update *their own* location — never anyone else's.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const accuracy = Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : undefined;
    const speed = Number.isFinite(Number(body.speed)) ? Number(body.speed) : undefined;
    const batteryLevel = Number.isFinite(Number(body.batteryLevel))
      ? Number(body.batteryLevel)
      : undefined;

    await dbConnect();
    await User.findByIdAndUpdate(payload.userId, {
      lastLocation: {
        lat,
        lng,
        accuracy,
        speed,
        batteryLevel,
        updatedAt: new Date(),
      },
      // Reporting a location implies sharing is active on the device.
      locationSharingEnabled: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/dashboard/location
 * Admin-only. Returns every user's latest location for the live map / report.
 */
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find(
      { "lastLocation.lat": { $exists: true } },
      { displayName: 1, username: 1, role: 1, lastLocation: 1, locationSharingEnabled: 1 }
    ).sort({ "lastLocation.updatedAt": -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get locations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
