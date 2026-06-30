# 🚀 Release Guide — Varieties Cosmetics App

This document explains **exactly how to publish a new version of the Android app**
so that every running app shows the in-app update popup and downloads the new APK.

> Audience: any human OR AI assistant working on this project later.
> Read this fully before doing a release.

> NOTE: This file lives inside the **web repo** (the public GitHub repo deployed
> by Vercel). The Flutter source lives in a separate parent repo; the same guide
> is mirrored there at the workspace root `RELEASE.md`.

---

## 1. The big picture (how updates reach users)

```
            ┌─────────────────────────┐
  App  ───► │ GET /api/app/version    │  (this Next.js app, on Vercel)
            │   returns latestVersion │
            │   Code + apkUrl + notes │
            └───────────┬─────────────┘
                        │ if installed build < latestVersionCode
                        ▼
            ┌─────────────────────────┐
            │ Mandatory update popup  │ ──► downloads APK from apkUrl
            └─────────────────────────┘
```

- **Source of truth for the version:** `src/lib/appVersion.ts`
- **Version API route:** `src/app/api/app/version/route.ts`
- **APK hosting:** **GitHub Releases** (NOT committed to git — it is 60+ MB).
- **`apkUrl`** points to GitHub's permanent *latest release* URL:
  `https://github.com/Officemnm/business-management/releases/latest/download/varieties-cosmetics.apk`
  This always redirects to the newest **published** (non-draft, non-prerelease)
  release's asset, so the URL itself **never changes** — only the version numbers do.

> ⚠️ This GitHub repo **must stay public** so the asset downloads without auth.
> ⚠️ The release asset name **must stay** `varieties-cosmetics.apk`. If you ever
> change it, also change `apkPath` in `src/lib/appVersion.ts`.

---

## 2. Repository layout

The project spans **two git repositories**:

| Folder | Git remote | Purpose |
| --- | --- | --- |
| `App/varieties_cosmetics/` | GitLab (parent repo) | Flutter source code |
| `Repo/` (this repo) | GitHub `Officemnm/business-management` | Next.js web + version API; **Vercel deploys this** |

- This repo is included as a **git submodule** of the Flutter parent repo.
- **Vercel deploys from here.** Pushing this repo's `main` triggers the redeploy
  that makes a new app version live.

---

## 3. Step-by-step release

### Step 0 — Prerequisites
- A **GitHub token** with write access to `Officemnm/business-management`
  (scope `repo` / `contents:write`).
- Flutter installed (`flutter build apk --release`).
- `curl.exe` (built into Windows 10+).

### Step 1 — Bump the version number
Edit `App/varieties_cosmetics/pubspec.yaml`:
```yaml
version: 1.0.12+13   # was 1.0.11+12   →  format is  <name>+<buildNumber>
```
- `name` (1.0.12) = human-readable version.
- `buildNumber` (13) = integer that **must increase every release** (this is what
  the app compares).

### Step 2 — Update the web source of truth
Edit `src/lib/appVersion.ts`:
```ts
latestVersionCode: 13,          // MUST equal the number after the + in pubspec
latestVersion: "1.0.12",        // MUST equal the name before the +
notes: "যা নতুন যোগ হয়েছে...",  // short Bengali "what's new" (or "" for generic)
// apkPath: DO NOT CHANGE — it always points to the latest release.
```

### Step 3 — Build + publish the APK to GitHub Releases
From `App/varieties_cosmetics/`:
```powershell
$env:GH_TOKEN = "ghp_xxxxxxxx"     # token with write access (do NOT commit it)
powershell -ExecutionPolicy Bypass -File release.ps1
```
`release.ps1` will: build the APK → read the version → create/reuse the GitHub
Release tagged `v<version>` → upload the asset `varieties-cosmetics.apk`
(replacing any old one).

> Manual alternative: on github.com create a Release with tag `v<version>`, drag
> in `build/app/outputs/flutter-apk/app-release.apk`, rename the asset to
> `varieties-cosmetics.apk`, and **publish** (not draft).

### Step 4 — Push THIS repo (makes the update LIVE)
```powershell
git add src/lib/appVersion.ts
git commit -m "release: v1.0.12 (build 13)"
git push origin main
```
Vercel redeploys → running apps see the new version and show the popup.

### Step 5 — Push the source backup (parent repo / GitLab)
```powershell
git add App/varieties_cosmetics Repo
git commit -m "release: v1.0.12 (build 13)"
git push origin main
```

---

## 4. Verify
```powershell
curl.exe -s https://<your-vercel-domain>/api/app/version
curl.exe -sIL https://github.com/Officemnm/business-management/releases/latest/download/varieties-cosmetics.apk
```
Expected: `latestVersionCode` matches the new build; the APK URL returns
`302` then `200`.

---

## 5. Gotchas
- **Build number not increased** → no update detected. Always raise it.
- **Release left as draft/prerelease** → `latest/download` won't find it.
- **Asset renamed** → the constant URL breaks. Keep `varieties-cosmetics.apk`.
- **Repo made private** → asset stops downloading for users. Keep it public.
- **Token leaked** → revoke at GitHub → Settings → Developer settings → tokens.
