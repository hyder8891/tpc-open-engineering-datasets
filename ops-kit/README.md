# Off-Site Entity Grounding & IndexNow Execution Kit (`ops-kit/`)

Operational scripts and copy-paste entity reconciliation packages for **The Power Contractor (`https://pc-cn.com`)**.

## Contents

1. [`submit-indexnow.mjs`](./submit-indexnow.mjs) — Zero-dependency Node ESM CLI that submits `pc-cn.com` sitemaps or priority URL lists to IndexNow (`api.indexnow.org`) for rapid Bing & ChatGPT Search (`OAI-SearchBot`) ingestion.
   ```bash
   # Dry-run verification (no key required)
   node ops-kit/submit-indexnow.mjs --dry-run

   # Live push using runtime environment variable (never commit keys)
   INDEXNOW_KEY="<your-key>" node ops-kit/submit-indexnow.mjs --sitemap https://pc-cn.com/sitemap.xml
   ```
2. [`youtube-metadata-cleanup.md`](./youtube-metadata-cleanup.md) — Bulk-edit audit steps and trilingual (`EN` / `MSA الفصحى` / `简体中文`) channel/video templates for `@ThePowerContractor` (`UCF33aA3bGtrfOFC0IufiJNg`), purging legacy `myshopify.com` and `thepowercontractor.com` references.
3. [`wikidata-entity-sheet.md`](./wikidata-entity-sheet.md) — White-hat sequenced Wikidata creation & disambiguation specification (`P1889` *different from* `POWERCHINA Q10873928`, plus disambiguation from `china-power-contractor.cn` Leda Greenpower).
4. [`b2b-directory-submissions.md`](./b2b-directory-submissions.md) — Verified submission packages for Kompass, GlobalSpec, Zawya (`EN` + `MSA الفصحى`), Iraq Business News, and Made-in-China / CCCME.
