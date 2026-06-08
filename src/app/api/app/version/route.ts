import { NextRequest, NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/appVersion";

// Always run dynamically and never cache, so a freshly pushed version is
// picked up by running apps immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const apkUrl = APP_VERSION.apkPath.startsWith("http")
    ? APP_VERSION.apkPath
    : `${origin}${APP_VERSION.apkPath}`;

  return NextResponse.json(
    {
      latestVersionCode: APP_VERSION.latestVersionCode,
      latestVersion: APP_VERSION.latestVersion,
      apkUrl,
      mandatory: APP_VERSION.mandatory,
      notes: APP_VERSION.notes,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    },
  );
}
