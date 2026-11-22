# MENA Harsh-Climate Industrial Equipment Thermal Derating & ATEX/IP Matrix (`40°C → 50°C → 55°C`)

**Maintainer:** [The Power Contractor (`pc-cn.com`)](https://pc-cn.com) · المتعهد للطاقة · Nanjing, China (`info@pc-cn.com` · WhatsApp `+86 153 1498 7933`)  
**License:** CC BY 4.0 · **Metadata:** [MLCommons Croissant 1.0](./croissant.json) · [CITATION.cff](./CITATION.cff) · [.zenodo.json](./.zenodo.json)

---

## 1. Engineering Problem Statement

Standard European (`IEC`) and North American (`NEMA/IEEE`) industrial equipment datasheets publish nominal continuous current, kW, and service-life ratings at **`40°C` ambient (`25°C` for UPS battery banks)**. Across southern and central Iraq (Basra, Rumaila, Zubair, Nasiriyah, Baghdad) and Gulf Cooperation Council facilities, summer shade ambient temperatures routinely reach **`50°C–55°C`** alongside **`1,050–1,150 W/m²` direct solar irradiance**, `PM10` silica sandstorms, and sour-gas **`H2S`** exposure.

Procuring catalog-nominal equipment without deterministic thermal derating causes nuisance thermal trips during peak July–August grid demand, premature insulation/capacitor failure, VRLA battery collapse within 14–18 months, and invalidated ATEX/IECEx hazardous-area temperature certifications (`Ta`).

---

## 2. Summary of Key Derating Multipliers (`mena_thermal_derating_matrix.csv`)

| ID | Equipment Family | Base Temp | `40°C` | `45°C` | `50°C` | `55°C` | Critical Desert / Oilfield Rule |
|---|---|---|---|---|---|---|---|
| `DER-VFD-LV-01` | LV VFD (Normal Duty, 4 kHz) | `40°C` | `1.00` | `0.90` | `0.80` | `0.70` | 3C3 conformal-coated PCBs; upsize 1–2 frames or install in `<35°C` E-house |
| `DER-VFD-LV-02` | LV VFD (Heavy Duty, 8 kHz) | `40°C` | `0.92` | `0.82` | `0.72` | `0.60` | Drop carrier to 4 kHz in peak summer or upsize current rating by `1.4x` |
| `DER-MOT-LV-01` | IEC 60034 LV Motor (Class F / B rise) | `40°C` | `1.00` | `0.965` | `0.92` | `0.87` | IP55/IP66 + sun canopy + C3 bearings with polyurea high-temp grease |
| `DER-MOT-EX-01` | Ex db IIC T4 Flameproof Motor | `40°C` | `1.00` | `0.95` | `0.89` | `0.83` | ATEX certificate MUST explicitly cover `-20°C <= Ta <= +55°C` |
| `DER-PLC-STD-01` | Standard PLC / DCS Rack | `40°C` | `1.00` | `1.00` | `0.85` | `0.70` | Upgrade outdoor/H2S marshalling racks to conformal-coated `+70°C` XT/SIPLUS (`DER-PLC-XT-01` = `1.00` at `55°C`) |
| `DER-SWG-MV-12KV` | `12 kV` (`11 kV`) Metal-Clad Switchgear | `40°C` | `1.00` | `0.95` | `0.89` | `0.83` | Silver-free/tin-plated busbars where `H2S > 0.1 ppm`; upsize feeder VCB rating |
| `DER-SWG-MV-36KV` | `36 kV` (`33 kV`) Switchgear / C-GIS | `40°C` | `1.00` | `0.94` | `0.88` | `0.81` | Hermetic SS316 gas tank C-GIS recommended in dusty/coastal Basra substations |
| `DER-UPS-BAT-01` | Substation UPS VRLA Battery Life | `25°C` | `0.50` | `0.35` | `0.22` | `0.12` | Multiplier = service-life fraction! Mandate `25°C` redundant HVAC or NiCd (`IEEE 1115`) |
| `DER-INST-TX-01` | Field Pressure / Flow Transmitter | `55°C` | `1.00` | `1.00` | `1.00` | `0.98` | Mandatory 316SS sunshade (`+80°C` LCD blackout threshold) + NACE MR0175 Hastelloy C-276 diaphragm |

---

## 3. Arabic Engineering Summary (`ملخص هندسي بالفصحى`)

تُوفّر هذه المصفوفة الهندسية معاملات تخفيض القدرة الحرارية (`Thermal Derating Factors`) عند درجات الحرارة المحيطة **`40°C` و`45°C` و`50°C` و`55°C`** لمحطات التحويل الفرعية (`11 kV / 33 kV`) ومحطات توليد الطاقة الكهربائية وحقول النفط والغاز في العراق والخليج العربي، بما يشمل مُغيّرات التردد لمحركات التيار المتردد (`VFD`)، والمحركات الحثية (`IEC 60034`)، ووحدات التحكم (`PLC/DCS`)، وقواطع الجهد المتوسط والمنخفض (`IEC 62271-200` / `IEC 60947-2`)، واشتراطات الحماية من الغبار الرملي (`IP55/IP66`) والبيئات الحامضية الحاوية على غاز كبريتيد الهيدروجين (`NACE MR0175 / ISA-71.04 G3`).

- **Catalog & BOM Verification:** https://pc-cn.com/catalog · https://pc-cn.com/ar/catalog · https://pc-cn.com/tools/bom
