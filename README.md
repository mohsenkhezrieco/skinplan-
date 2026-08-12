# SkinPlan Clinic v15.1 — Product Image Fix

This patch keeps the v15 ranking/brand engine and fixes missing product images.

## What changed
`api/product-image.js` now resolves packshots in two stages:
1. It opens the official Boots product page and extracts the current product image (Open Graph / Twitter / product JSON image).
2. If that fails, it falls back to multiple Boots Scene7 image formats using the Boots stock code.

The frontend now passes both the Boots stock code and the official Boots product-page URL to the image proxy. Failed images retry once with a cache-bypass parameter.

## Update the live site
Replace these files in the existing GitHub repository:
- `index.html`
- `products.json`
- `api/product-image.js`
- `sw.js`

You do not need to change `api/x3-report.js`.

Commit the changes; Vercel should redeploy automatically.

If a specific product still has no image after redeploying, send the product name shown in Product Library and it can be corrected individually.
