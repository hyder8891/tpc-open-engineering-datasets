# The Power Contractor — Open Industrial Engineering Datasets, MPN Normalizer & Off-Site Execution Kit

**Maintainer:** [The Power Contractor (`https://pc-cn.com`)](https://pc-cn.com) · المتعهد للطاقة  
**Repository:** `https://github.com/hyder8891/tpc-open-engineering-datasets` (`v1.0.1`)  
**Headquarters:** Jiangning District, Kaichen Street No.128, Nanjing, Jiangsu, China  
**Contact:** `info@pc-cn.com` · WhatsApp / Tel `+86 153 1498 7933` (`https://wa.me/8615314987933`)  
**Scope:** Independent Global Supplier of New, Genuine OEM Industrial Equipment & Power Plant Spare Parts across Iraq, MENA-14, and Global Infrastructure.

---

## Repository Contents

### 1. Open Industrial Engineering Datasets (`datasets/` — CC BY 4.0)
Every dataset ships with deterministic UTF-8 `.csv` and `.json` twins, **MLCommons Croissant 1.0 (`croissant.json`)** metadata with SHA-256 verification, **CFF 1.2.0 (`CITATION.cff`)**, and **Zenodo (`.zenodo.json`)** deposit manifests:

| Dataset | Path | Languages | Engineering Coverage |
|---|---|---|---|
| **Iraq Industrial Import & COSQC Handbook** | [`datasets/iraq-industrial-import-cosqc-handbook/`](./datasets/iraq-industrial-import-cosqc-handbook/README.md) | `EN` · `MSA الفصحى` · `简体中文` | 33 HS6 categories across Chapters `84`, `85`, `90`, COSQC Pre-Shipment CoC (`SGS`/`TÜV`/`BV`/`Intertek`), CCPIT CoO legalization, `50 Hz` nameplate rules, and Umm Qasr / Khor al-Zubair / `BSR` / `BGW` / `EBL` clearance profiles. |
| **MENA Harsh-Climate Equipment Derating** | [`datasets/mena-harsh-climate-equipment-derating/`](./datasets/mena-harsh-climate-equipment-derating/README.md) | `EN` · `MSA الفصحى` | `40°C → 45°C → 50°C → 55°C` thermal derating multipliers, `1,100 W/m²` solar enclosure rules, `IP55/IP66` sand ingress, `ATEX/IECEx` extended-`Ta` certification, and `NACE MR0175 / ISA-71.04 G3` `H2S` sour-service specifications. |
| **IEC / ANSI / NEMA / GB-T Power Plant Crosswalk** | [`datasets/iec-ansi-nema-powerplant-crosswalk/`](./datasets/iec-ansi-nema-powerplant-crosswalk/README.md) | `EN` · `简体中文` | 24 multi-standard crosswalk records spanning `ANSI C37.2` protection device numbers (`21/25/27/32/49/50/50BF/51/59/81/86/87`), `IP` ↔ `NEMA 250` enclosures, `IEC 60034/62271/60076` motors/switchgear/transformers, and `API 6D/600/682` ↔ `GB/T` / `JB/T` valves & seals. |

### 2. Zero-Dependency MPN Normalizer Package (`packages/mpn-normalizer/` — MIT)
- **JavaScript / TypeScript ESM (`@pc-cn/mpn-normalizer`):** [`packages/mpn-normalizer/index.mjs`](./packages/mpn-normalizer/index.mjs) + [`index.d.ts`](./packages/mpn-normalizer/index.d.ts)
- **Python (`tpc-mpn-normalizer`):** [`packages/mpn-normalizer/mpn_normalizer/`](./packages/mpn-normalizer/mpn_normalizer/__init__.py)
- Normalizes noisy part numbers, repairs nameplate OCR confusions (`O <-> 0`, `I/l <-> 1`), parses free-text BOM lines, and classifies all **9 core OEM families** (`ABB`, `Siemens`, `Allen-Bradley`, `Schneider Electric`, `Yokogawa`, `Rosemount`, `Bently Nevada`, `Hägglunds`, `EagleBurgmann`).

### 3. Off-Site Entity & IndexNow Execution Kit (`ops-kit/` — MIT)
- [`ops-kit/submit-indexnow.mjs`](./ops-kit/submit-indexnow.mjs) — Zero-dependency CLI for pushing `pc-cn.com` sitemaps and priority URLs to IndexNow (`api.indexnow.org` / Bing).
- [`ops-kit/youtube-metadata-cleanup.md`](./ops-kit/youtube-metadata-cleanup.md) — Copy-paste channel/video description templates for `@ThePowerContractor` (`UCF33aA3bGtrfOFC0IufiJNg`).
- [`ops-kit/wikidata-entity-sheet.md`](./ops-kit/wikidata-entity-sheet.md) — Verifiable Wikidata entity creation & disambiguation sheet (`P1889` *different from* `POWERCHINA Q10873928`, severing conflation with `china-power-contractor.cn` Leda Greenpower).
- [`ops-kit/b2b-directory-submissions.md`](./ops-kit/b2b-directory-submissions.md) — Ready-to-submit copy for Kompass, GlobalSpec, Zawya (`EN` + `MSA الفصحى`), Iraq Business News, and Made-in-China / CCCME.

---

## Running Verification Tests

```bash
# Run all Node ESM + dataset + IndexNow CLI tests
npm test

# Run all Python MPN normalizer + Croissant/CSV/JSON + governance gate tests
pytest
```
