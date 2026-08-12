# SkinPlan Clinic v15

## Major changes
- X3 direct-import backend retained.
- Expanded curated Boots UK library: 34 products across 8 brands.
- Brand Settings: enable/disable brands; disabled brands disappear from rankings and future plans.
- Role-based rankings: the plan always uses the first enabled compatible product.
- Product-image proxy: original Boots packshots are loaded through `/api/product-image` so reports can export more reliably.
- New dark X3-inspired website UI with a white, print-friendly patient plan.
- Treatment engine rebuilt as phases: safety/barrier first, then one primary active, then a later secondary phase.
- Mixed acne + pigmentation uses one azelaic-acid pathway rather than stacking several actives.
- Pigmentation-only can prefer Eucerin Thiamidol when enabled and barrier tolerance is adequate.
- Sensitive/borderline ageing starts with peptide support; retinoid is later and conservative.
- Product brand settings never override safety or compatibility.

## Included brands
- The Ordinary
- CeraVe
- La Roche-Posay
- Avène
- Bioderma
- Eucerin
- Beauty of Joseon
- The INKEY List

## Update your live Vercel site
Replace the contents of the existing GitHub repository with this version, preserving the same repository/project. Commit the changes. Vercel should automatically redeploy.

Important new file:
- `api/product-image.js`

Existing working file retained:
- `api/x3-report.js`

## Ranking principle
The role rankings are practical clinical-fit priorities, not universal head-to-head scientific superiority claims. They combine role suitability, irritation/tolerance considerations, formulation characteristics, UV coverage where relevant, simplicity, and current Boots UK availability.

## Safety
Cosmetic skincare maintenance guidance only. The X3 device scores are decision inputs, not medical diagnoses. Safety flags override automatic active selection.
