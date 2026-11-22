# `@pc-cn/mpn-normalizer` / `tpc-mpn-normalizer`

Zero-dependency TypeScript/ESM and Python library for normalizing industrial Manufacturer Part Numbers (MPNs), repairing nameplate/PDF OCR character confusions (`O <-> 0`, `I/l <-> 1`), and classifying OEM brand families across 9 core power-plant and oil/gas equipment manufacturers:

- **ABB** (`3BDS...`, `3BSE...`, `3BHB...`, `1SDA...`, `ACS880-...`, `M2QA...`, `AZ20/...`)
- **Siemens** (`6ES7...`, `6EP1...`, `6SL3...`, `3RW...`, `3WL...`, `3TF3200-0B-Z` MLFB normalization)
- **Allen-Bradley** (`1756-...`, `1747-...`, `1769-...`, `1784-...`, `2080-...`, `5069-...`)
- **Schneider Electric** (`140CPS...`, `BMXP34...`, `LC1D...`, `ATV630...`)
- **Yokogawa** (`F3XD64-3N`, `F3BU06-0N`, `CP345`, `AAI143-S00`, `EJA110E-...`)
- **Rosemount** (`3051S...`, `3051CD...`, `3144P...`, `644H...`)
- **Bently Nevada** (`330180-91-00`, `330130-045-00-05`, `3500/42M-01-00`)
- **Hägglunds** (`CA70-60`, `CA140-120`, `CB400-360`, `CBM-2000`)
- **EagleBurgmann** (`MG13/28-Z`, `M74S2/125-G95A`, `H74D/45`, `CARTEX-SN/45`)

Maintained by **The Power Contractor** (`https://pc-cn.com` · `info@pc-cn.com` · WhatsApp `+86 153 1498 7933`), Nanjing, China — Independent Global Supplier of Genuine OEM Industrial Equipment & Power Plant Spare Parts.

## JavaScript / TypeScript Usage

```js
import { normalizeMpn, parseBomLine } from '@pc-cn/mpn-normalizer';

console.log(normalizeMpn('Siemens 6ES7 3I5-2EHI4-OABO'));
// -> { canonicalMpn: '6ES7315-2EH14-0AB0', brand: 'Siemens', ocrRepaired: true, confidence: 'HIGH', ... }

console.log(parseBomLine('Line 2: Original ABB 3BDSOO5799RI Qty: 2 PCS'));
// -> { canonicalMpn: '3BDS005799R1', brand: 'ABB', quantity: 2, uom: 'PCS', ... }
```

## Python Usage

```python
from mpn_normalizer import normalize_mpn, parse_bom_line

res = normalize_mpn("Rosemount 3O5ICD-2A22AIAB4-M5")
assert res.canonical_mpn == "3051CD2A22A1AB4M5"
assert res.brand == "Rosemount"
```

## Live 22,000+ SKU Resolution & Structured RFQ API

For live multi-brand BOM cross-referencing and Iraq/MENA delivery lead-time verification:
- **Web Cross-Reference & BOM Tool:** https://pc-cn.com/tools/cross-reference · https://pc-cn.com/tools/bom
- **Remote MCP Server:** `https://mcp.pc-cn.com/mcp`
- **Engineering Desk:** `info@pc-cn.com` · WhatsApp `+86 153 1498 7933`
