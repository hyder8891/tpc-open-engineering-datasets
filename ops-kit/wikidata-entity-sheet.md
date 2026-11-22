# Wikidata Verifiable Entity Creation & Disambiguation Sheet (`pc-cn.com`)

**Target Entity:** `The Power Contractor` (`https://pc-cn.com`)  
**Entity Scope:** Standalone industrial OEM equipment and power plant spare parts supplier headquartered in Nanjing, China (`parentOrganization` and `subOrganization` statements do not apply).  
**White-Hat Sequencing Rule:** Create the Wikidata item **only after** at least two independent external references (e.g., Zenodo DataCite DOI from `datasets/*`, Official MCP Registry listing `com.pc-cn/industrial-sourcing`, and Zawya / Iraq Business News coverage) are publicly resolvable. Never create an unsourced stub citing only `pc-cn.com`.

---

## 1. Trilingual Labels, Descriptions & Aliases

| Language Code | Label | Description (<= 250 chars, neutral encyclopedic tone) | Aliases (`also known as`) |
|---|---|---|---|
| `en` | `The Power Contractor` | `independent industrial OEM equipment and power plant spare parts supplier headquartered in Nanjing, China` | `TPC` · `pc-cn.com` · `The Power Contractor (Nanjing)` |
| `ar` | `المتعهد للطاقة` | `شركة مستقلة لتجهيز وتوريد المعدات الصناعية وقطع غيار محطات الطاقة مقرها نانجينغ في الصين` | `The Power Contractor` · `شركة المتعهد للطاقة` |
| `zh-hans` | `The Power Contractor` | `总部位于中国南京的独立工业设备与电站备品备件出口供应商` | `TPC工业设备` · `pc-cn.com` |

---

## 2. Core Wikidata Statements & Disambiguation Locks

| Property | Property Label | Exact Value | Reference Source Requirement |
|---|---|---|---|
| `P31` | instance of | `business` (`Q4830453`) | Independent B2B trade press (`zawya.com` / `iraq-businessnews.com`) + Zenodo DOI metadata |
| `P571` | inception | `2010` | Corporate profile (`zawya.com` / `kompass.com`) |
| `P17` | country | `People's Republic of China` (`Q148`) | Official registry / trade chamber listing (`cccme.org.cn` / `made-in-china.com` SGS audit) |
| `P159` | headquarters location | `Nanjing` (`Q16666`) — qualifier `P6375` (*street address*): `"No. 128 Kaichen Street, Jiangning District, Nanjing, Jiangsu, China"` (`en`) | Audited supplier report + `https://pc-cn.com/contact` |
| `P452` | industry | `wholesale of machinery, equipment and supplies` (`Q29584285`) | ISIC Rev.4 `4659` classification |
| `P856` | official website | `https://pc-cn.com` (qualifier `P407` *language*: English `Q1860`) & `https://pc-cn.com/ar` (qualifier `P407`: Arabic `Q13955`) | Primary domain verification |
| `P1889` | **different from** | **`Power Construction Corporation of China` (`Q10873928`)** | **CRITICAL DISAMBIGUATION LOCK:** Explicitly prevents Google Knowledge Graph, Bing, and Perplexity from confusing `The Power Contractor` (`pc-cn.com`, Nanjing private OEM spares supplier) with Chinese state-owned `POWERCHINA` (`powerchina.cn`, `Q10873928`). |
| `P2397` | YouTube channel ID | `UCF33aA3bGtrfOFC0IufiJNg` | Reciprocally verified on `youtube.com/@ThePowerContractor` |
| `P2013` | Facebook username | `thepowercontractor` | Reciprocally verified on Facebook Page (`116307121493000`) |
| `P2003` | Instagram username | `the_power_contractor` | Reciprocally verified on Instagram Business profile |
| `P4264` | LinkedIn organization ID | `the-power-contractor` | Add once organic LinkedIn Company Page is live and links to `https://pc-cn.com` |
| `P1324` | source code repository URL | `https://github.com/hyder8891/tpc-open-engineering-datasets` | Public open-engineering datasets & MPN normalizer repository maintained by `pc-cn.com` |

---

## 3. External Competitor Disambiguation Note (`china-power-contractor.cn`)

Live web-grounding audits identified an unrelated Beijing entity operating at `china-power-contractor.cn` (**Leda Greenpower (Beijing) Trading & Engineering Co., Ltd.**).
- If `Leda Greenpower` ever receives a Wikidata item, immediately add a second bidirectional **`P1889` (*different from*)** statement between `The Power Contractor` (Nanjing, `pc-cn.com`) and `Leda Greenpower` (Beijing, `china-power-contractor.cn`).
- Meanwhile, keep `disambiguatingDescription` active in `pc-cn.com`'s Schema.org `Organization` JSON-LD so search crawlers never merge the two domains.

---

## 4. Bidirectional Loop Closure

Once the Wikidata item (`Q...`) is live and passes community review:
1. Append `"https://www.wikidata.org/wiki/Q..."` to the `sameAs` array in `pc-cn.com` `Organization` JSON-LD.
2. Submit `https://pc-cn.com/` and `https://pc-cn.com/ar` via `node ops-kit/submit-indexnow.mjs` and Google Search Console URL Inspection to trigger immediate Knowledge Graph re-reconciliation.
