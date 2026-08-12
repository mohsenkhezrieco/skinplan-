# SkinPlan Clinic v14 — Vercel Website

This is the website version with server-side X3 import.

## Why direct import now works

The browser does not request X3 directly.

Browser:
POST /api/x3-report

Vercel server:
GET https://x3.aiskinia.com/xcX3SkinSrv/analysis/shareDetail?...

That removes the browser CORS problem.

## Deploy on Vercel

1. Put the contents of this ZIP in a GitHub repository (or import the project folder into Vercel).
2. In Vercel choose **Add New → Project** and import the repository.
3. Framework Preset: **Other**.
4. Root Directory: the folder containing `index.html`, `api`, `package.json`, and `vercel.json`.
5. Deploy.
6. Open the website.
7. Paste an X3 report link and click **Import X3 Report**.

Vercel automatically deploys files in the root `/api` directory as Vercel Functions.

## Files

- `index.html` — website interface and SkinPlan engine
- `api/x3-report.js` — server-side X3 importer
- `package.json` — JavaScript module setting
- `vercel.json` — Vercel configuration
- `sw.js`, `manifest.webmanifest` — existing website/PWA support

## Privacy

The server fetches the full X3 response but returns only:
- shareId
- Baumann type
- moisture
- skin age
- total score
- 14 skincare scores and Levels

The browser does not receive the patient's phone number, birthday, user/customer IDs or facial-image URLs.

API responses use `Cache-Control: no-store`.

## X3 mapping

- Acne → analysis.pockmark (fallback analysis.reflection)
- Blackhead → analysis.blackhead
- Pore → analysis.pore
- Oil → analysis.deep_grease
- Bacteria → analysis.acne
- Surface sensitivity → analysis.sensitive
- Deep sensitivity → analysis.red_area
- Surface spot → analysis.spot
- Deep spot → analysis.uv_spot
- Spot heat → analysis.hotmap_spot
- Skin colour → analysis.color
- Wrinkle → analysis.wrinkle
- Collagen → analysis.collagen
- Texture → analysis.roughness

This site produces cosmetic skincare maintenance guidance, not a medical diagnosis or prescription.
