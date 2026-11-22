# Iraq Industrial Import, HS 84/85/90 Customs & COSQC Pre-Shipment CoC Handbook

**Languages:** [English](./README.md) · [العربية الفصحى (MSA Arabic)](./README.ar.md) · [简体中文 (Mandarin)](./README.zh-CN.md)  
**Maintainer:** [The Power Contractor (`pc-cn.com`)](https://pc-cn.com) · Nanjing, China · `info@pc-cn.com` · WhatsApp `+86 153 1498 7933`  
**License:** CC BY 4.0 · **Metadata:** [MLCommons Croissant 1.0](./croissant.json) · [CITATION.cff](./CITATION.cff) · [.zenodo.json](./.zenodo.json)

---

## 1. Purpose & Engineering Scope

Industrial shipments arriving at Iraqi ports without pre-verified compliance documentation face severe port detention, demurrage, or customs rejection. This open engineering dataset maps **33 core HS6 industrial equipment categories** across **Chapter 84** (turbines, centrifugal pumps, compressors, heat exchangers, RO skids, valves, gearboxes, mechanical seals), **Chapter 85** (LV/MV AC motors, diesel gensets, power transformers, VFDs, 24VDC PSUs, UPS, MV/LV switchgear, PLCs/DCS), and **Chapter 90** (flowmeters, differential pressure transmitters, gas analyzers, API 670 vibration monitoring, AVRs) to:

1. **COSQC Pre-Shipment Inspection (`ICIGI` / `CAP`):** Mandatory **Certificate of Conformity (`CoC`)** issued *prior to cargo departure* by a Conformity Assessment Body authorized by Iraq's **Central Organization for Standardization and Quality Control (`COSQC`)** — specifically **SGS**, **TÜV Rheinland**, **Bureau Veritas**, or **Intertek** — paired with a physical **Release Note** upon container seal verification at the Iraqi entry port.
2. **CCPIT Certificate of Origin & Consular Legalization:** For China-consolidated export shipments, commercial invoices and **CCPIT (China Council for the Promotion of International Trade)** Certificates of Origin require authentication and Iraqi Embassy/Consulate legalization where mandated by letter-of-credit or customs tariff rules (distinct from the technical COSQC CoC).
3. **50 Hz Iraqi Grid & Nameplate Integrity:** Iraq operates strictly on **400 V / 230 V, 50 Hz** (LV) and **11 kV / 33 kV / 132 kV / 400 kV, 50 Hz** (MV/HV). Physical metal nameplates must match commercial invoices, packing lists, and ISO/IEC 17025 test reports character-for-character.

---

## 2. Primary Entry Gateways Covered (`iraq_hs_cosqc_matrix.json`)

| Code | Entry Gateway | Mode | Typical China Transit | Primary Industrial Use Case |
|---|---|---|---|---|
| `IQUMQ` | **Umm Qasr Port (North & South)** | Sea (FCL / LCL / Breakbulk) | 22–30 days | Heavy switchgear, transformers, MV motors, pumps, multi-package project cargo |
| `IQKAZ` | **Khor al-Zubair Port** | Sea (Project / Bulk) | 24–32 days | Southern oilfield & petrochemical equipment (Rumaila, Zubair, West Qurna) |
| `BSR` | **Basra International Airport** | Air Express / Cargo | 4–8 days | Urgent southern power station & BOC/IOC oilfield breakdown spares |
| `BGW` | **Baghdad International Airport** | Air Express / Cargo | 4–7 days | Central Iraq power generation plants, refineries, and industrial facilities |
| `EBL` | **Erbil International Airport** | Air Express / Cargo | 4–7 days | Kurdistan Region (KRG) IPPs, refineries, cement/steel plants |

*(Compliant land transit corridors via Ibrahim Khalil/Habur, Trebil, and Safwan are supported for regional cross-docking where applicable.)*

---

## 3. Files in This Dataset

- [`iraq_hs_cosqc_matrix.csv`](./iraq_hs_cosqc_matrix.csv) — UTF-8 CSV table (33 HS6 rows × 14 columns, trilingual EN/AR/ZH equipment labels).
- [`iraq_hs_cosqc_matrix.json`](./iraq_hs_cosqc_matrix.json) — Structured JSON twin including `entry_gateways` clearance rules.
- [`croissant.json`](./croissant.json) — MLCommons Croissant 1.0 JSON-LD descriptor with verified SHA-256 checksums.

## 4. Sourcing & Multi-Brand OEM Consolidation Support

**The Power Contractor (`https://pc-cn.com`)** is an independent global supplier of new, genuine OEM industrial equipment and power plant spare parts headquartered in Nanjing, China (`Jiangning District, Kaichen Street No.128`), supporting multi-package project procurement, pre-shipment inspection coordination, and MRO supply across Iraq (`https://pc-cn.com/regions/iraq`) and MENA.
