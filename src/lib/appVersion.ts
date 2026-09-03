/**
 * Single source of truth for the Android app's latest release.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW THE UPDATE FLOW WORKS
 * ──────────────────────────────────────────────────────────────────────────
 * - The running app calls GET /api/app/version (see app/api/app/version/route.ts).
 * - That route returns the values below, resolving `apkPath` to a full URL.
 * - The app compares its INSTALLED build number against `latestVersionCode`.
 *   If installed < latestVersionCode, the (mandatory) update popup is shown and
 *   the user downloads the APK from `apkUrl`.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * APK HOSTING = GitHub Releases (NOT committed into this repo)
 * ──────────────────────────────────────────────────────────────────────────
 * The APK is large (60+ MB), so it is NO LONGER stored in /public/downloads.
 * Instead it is uploaded as an asset on a GitHub Release, and `apkPath` points
 * to GitHub's permanent "latest release" download URL:
 *
 *     https://github.com/<owner>/<repo>/releases/latest/download/<asset-name>
 *
 * This URL ALWAYS redirects to the asset of the newest published (non-draft,
 * non-prerelease) release, so `apkPath` itself never needs to change — only the
 * version numbers / notes below change each release. The repo MUST stay public
 * for this URL to download without authentication.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHEN YOU PUBLISH A NEW APP BUILD  (full guide: ../../RELEASE.md)
 * ──────────────────────────────────────────────────────────────────────────
 *   1. Bump `version` in App/varieties_cosmetics/pubspec.yaml (e.g. 1.0.11+12 -> 1.0.12+13).
 *   2. Set `latestVersionCode` below to the NEW build number (the part after `+`).
 *   3. Update `latestVersion` (the human-readable name) and `notes`.
 *   4. Run App/varieties_cosmetics/release.ps1 — it builds the APK and publishes
 *      a GitHub Release whose asset name is EXACTLY `varieties-cosmetics.apk`.
 *   5. Commit & push the Repo (web) folder -> Vercel redeploys -> popup appears.
 *   6. Commit & push the App (source) folder as a backup.
 *
 * IMPORTANT: the release asset name must stay `varieties-cosmetics.apk` so the
 * `latest/download` URL keeps resolving. Do not change it without also changing
 * `apkPath` here.
 */
export const APP_VERSION = {
  /** Build number — MUST be increased on every release. Compared as an integer. */
  latestVersionCode: 13,
  /** Human-readable version name shown in the popup. */
  latestVersion: "1.0.12",
  /**
   * Full URL to the APK. Points at GitHub's "latest release" asset, so it
   * auto-resolves to the newest published release and never needs editing.
   * (A value starting with "http" is used as-is by the version API route;
   * a relative "/path" would instead be served from this site's /public.)
   */
  apkPath:
    "https://github.com/Officemnm/business-management/releases/latest/download/varieties-cosmetics.apk",
  /** If true the user cannot keep using the app without updating. */
  mandatory: true,
  /** Short "what's new" note shown in the update popup. Keep it brief/empty —
   * an empty string shows a clean generic message instead of a detailed list. */
  notes:
    "নতুন ফিচার: প্রোডাক্ট রিপোর্ট - সামারি পেজ থেকে যেকোনো পণ্যের বিক্রয় ও স্টক ইতিহাস দেখুন তারিখ অনুযায়ী।",
} as const;
