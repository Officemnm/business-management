/**
 * Single source of truth for the Android app's latest release.
 *
 * WHEN YOU PUBLISH A NEW APP BUILD:
 *   1. Bump `version` in App/varieties_cosmetics/pubspec.yaml (e.g. 1.0.2+3).
 *   2. Set `latestVersionCode` below to the new build number (the part after `+`).
 *   3. Update `latestVersion` (the human-readable name) and `notes`.
 *   4. Build the APK and copy it to Repo/public/downloads/varieties-cosmetics.apk.
 *   5. Commit & push — Vercel redeploys and every running app gets the update popup.
 *
 * The app compares its installed build number against `latestVersionCode`.
 * If the installed number is lower, a mandatory update popup is shown.
 */
export const APP_VERSION = {
  /** Build number — MUST be increased on every release. Compared as an integer. */
  latestVersionCode: 6,
  /** Human-readable version name shown in the popup. */
  latestVersion: "1.0.5",
  /** Relative path to the APK served from /public. */
  apkPath: "/downloads/varieties-cosmetics.apk",
  /** If true the user cannot keep using the app without updating. */
  mandatory: true,
  /** Short "what's new" note shown in the update popup. */
  notes: "নিয়মিত আপডেট ও স্থিতিশীলতা উন্নয়ন।",
} as const;
