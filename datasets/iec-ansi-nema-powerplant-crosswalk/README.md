# IEC, ANSI/IEEE/NEMA, API/ASME & Chinese GB/T Power Plant Standards Crosswalk

**Maintainer:** [The Power Contractor (`pc-cn.com`)](https://pc-cn.com) · المتعهد للطاقة · Nanjing, China (`info@pc-cn.com` · WhatsApp `+86 153 1498 7933`)  
**License:** CC BY 4.0 · **Metadata:** [MLCommons Croissant 1.0](./croissant.json) · [CITATION.cff](./CITATION.cff) · [.zenodo.json](./.zenodo.json)

---

## 1. Why Hybrid Power Stations & Oilfields Need a Tri-Standard Crosswalk

Power plants, refineries, and water treatment complexes in Iraq and MENA routinely combine **three distinct engineering standard lineages inside a single facility**:
- **European / International (`IEC / ISO / EN`):** Iraqi Ministry of Electricity grid code (`50 Hz`, `11/33/132/400 kV`), Siemens & ABB switchgear/relays/drives, European water-plant `PN16` flanges.
- **North American (`ANSI / IEEE / NEMA / API / ASME / NEC`):** GE gas turbines, Allen-Bradley PLCs, Rosemount/Bently Nevada instrumentation, API 6D/600/682 oilfield valves and mechanical seals, ASME B16.5 `Class 150/300/600` flanges.
- **Chinese National & Machinery Standards (`GB/T`, `JB/T`, `DL/T`, `HG/T`):** Balance-of-plant (BOP) skids, motors, transformers, and pipework installed by EPC contractors.

[`iec_ansi_nema_gb_crosswalk.csv`](./iec_ansi_nema_gb_crosswalk.csv) and [`iec_ansi_nema_gb_crosswalk.json`](./iec_ansi_nema_gb_crosswalk.json) document **24 high-consequence equivalences and compatibility traps** across four engineering domains:

1. **`PROTECTION_RELAY_FUNCTION` (`PROT-21`..`PROT-87`):** Maps `ANSI/IEEE C37.2` device numbers (`21`, `25`, `27`, `32`, `49`, `50`, `50BF`, `51`, `59`, `81`, `86`, `87T/G/B`) to `IEC 60617` symbols, `IEC 61850` logical nodes (`PDIS`, `PTUV`, `PIOC`, `PTOC`, `RBRF`, `PDIF`), and Chinese `GB/T 14285` / `DL/T 478` terminology — flagging critical `1A` vs `5A` CT secondary and `IEC 60255` vs `IEEE` inverse-curve differences.
2. **`ENCLOSURE_AND_EX_RATING` (`ENC-IP20`..`ENC-EX-DB`):** Maps `IEC 60529` (`IP20`, `IP54`, `IP55`, `IP65`, `IP66`) and `IEC 60079` (`Ex db IIC T4 Gb`) to `NEMA 250` (`Type 1`, `3R`, `3S`, `4`, `4X`, `7`, `12`), `NEC 500/505`, and `GB/T 4208` / `GB/T 3836.2` — highlighting the **NEMA 3R desert dust-ingress trap** and **M20 metric vs 1/2" NPT conduit thread mismatch**.
3. **`ELECTRICAL_EQUIPMENT_STANDARD` (`ELEC-MOT-DIM`..`ELEC-XFMR`):** Cross-references `IEC 60034 / 60072` metric motor frames (`GB/T 4772` drop-in compatible!) vs `NEMA MG 1` inch T-frames, `IE3/IE4` vs `NEMA Premium` vs `GB 18613`, `IEC 62271-200` vs `IEEE C37.20.2` vs `GB/T 3906` MV switchgear, and the **catastrophic `Dyn1` (ANSI) vs `Dyn11` (Iraqi IEC) transformer vector-group paralleling hazard**.
4. **`MECHANICAL_VALVE_AND_SEAL` (`MECH-VALVE-BALL`..`MECH-SEAL-API`):** Maps `ISO 14313 / 10434 / 21049` and `EN 1092-1 PN16/PN40` to `API 6D / 600 / 682` and `ASME B16.5 Class 150/300` alongside `GB/T 19672 / 12234 / 14211`, `JB/T 4127.1`, and `HG/T 20592 / 20615`.

---

## 2. Live Cross-Reference & OEM Replacement Lookup

Need to cross-reference a legacy ANSI/NEMA, IEC, or GB/T nameplate part number into a genuine new OEM replacement (`ABB`, `Siemens`, `Allen-Bradley`, `Schneider`, `Yokogawa`, `Rosemount`, `Bently Nevada`, `Hägglunds`, `EagleBurgmann`)?
- **Interactive Cross-Reference Tool:** https://pc-cn.com/tools/cross-reference
- **Remote MCP Tool Server:** `https://mcp.pc-cn.com/mcp`
- **Engineering Desk:** `info@pc-cn.com` · WhatsApp `+86 153 1498 7933`
