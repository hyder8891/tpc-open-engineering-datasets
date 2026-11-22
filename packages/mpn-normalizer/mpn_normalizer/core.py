"""Core zero-dependency implementation of MPN normalization & OCR repair."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import asdict, dataclass, field
from typing import Literal

SUPPORTED_BRANDS: tuple[str, ...] = (
    "ABB",
    "Siemens",
    "Allen-Bradley",
    "Schneider Electric",
    "Yokogawa",
    "Rosemount",
    "Bently Nevada",
    "Hagglunds",
    "EagleBurgmann",
)

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]

_BRAND_PREFIX_STRIP_RE = re.compile(
    r"^(?:new\s+|genuine\s+|original\s+|oem\s+)*"
    r"(?:abb|siemens|allen[-\s]?bradley|rockwell(?:\s+automation)?|ab|"
    r"schneider(?:\s+electric)?|telemecanique|modicon|yokogawa|"
    r"rosemount|emerson|bently\s+nevada|bentley\s+nevada|bently|"
    r"h[aä]gglunds|bosch\s+rexroth|eagle\s*burgmann|burgmann)\s*[:\-]?\s*",
    re.IGNORECASE,
)

_PACKAGING_SUFFIX_RE = re.compile(
    r"(?:\s+|/|-)(?:SER(?:IES)?[\s.\-]*([A-Z0-9]{1,3})|REV[\s.\-]*([A-Z0-9]{1,4})|PACK|PKG|BULK|NEW|OEM)\s*$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class NormalizedMpnResult:
    original: str
    canonical_mpn: str
    compact_key: str
    catalog_slug_candidate: str
    brand: str | None
    matched_family: str | None
    revision_or_series: str | None
    ocr_repaired: bool
    repairs: list[str] = field(default_factory=list)
    search_aliases: list[str] = field(default_factory=list)
    confidence: ConfidenceLevel = "LOW"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class ParsedBomLineResult(NormalizedMpnResult):
    quantity: int = 1
    uom: str = "EA"


def _digits_fix(val: str) -> str:
    return re.sub(r"[Iil|]", "1", re.sub(r"[OoQD]", "0", val))


def _letters_fix(val: str) -> str:
    return val.replace("0", "O").replace("1", "I")


def _apply_mask(val: str, mask: str) -> str:
    out: list[str] = []
    for idx, ch in enumerate(val):
        m = mask[idx] if idx < len(mask) else "*"
        if m == "D":
            out.append(_digits_fix(ch))
        elif m == "L":
            out.append(_letters_fix(ch))
        else:
            out.append(ch)
    return "".join(out)


def _detect_brand_hint(raw_input: str, explicit_brand: str = "") -> str | None:
    combined = f"{explicit_brand} {raw_input}".lower()
    if re.search(r"\b(?:eagle\s*burgmann|burgmann|burgman)\b", combined):
        return "EagleBurgmann"
    if re.search(r"\b(?:h[aä]gglunds|hagglund)\b", combined):
        return "Hagglunds"
    if re.search(r"\b(?:bently|bentley)\b", combined):
        return "Bently Nevada"
    if re.search(r"\b(?:rosemount)\b", combined):
        return "Rosemount"
    if re.search(r"\b(?:yokogawa|centum|dpharp)\b", combined):
        return "Yokogawa"
    if re.search(r"\b(?:schneider|modicon|tesys|altivar|telemecanique)\b", combined):
        return "Schneider Electric"
    if re.search(r"\b(?:allen[-\s]?bradley|rockwell|controllogix|compactlogix|powerflex)\b", combined):
        return "Allen-Bradley"
    if re.search(r"\b(?:siemens|simatic|sinamics|sitop|sirius|sentron)\b", combined):
        return "Siemens"
    if re.search(r"\b(?:abb|advant|emax|tmax)\b", combined):
        return "ABB"
    return None


def repair_ocr_confusions(
    cleaned_upper: str, brand_hint: str | None = None
) -> tuple[str, list[str], str | None, str | None]:
    """Repair OCR character confusions (O<->0, I/l<->1) across all 9 OEM syntax families."""
    repairs: list[str] = []
    s = unicodedata.normalize("NFKC", str(cleaned_upper or "")).upper()
    s = re.sub(r"[\u2010-\u2015\u2212]", "-", s).strip()

    def record(before: str, after: str, reason: str) -> str:
        before_alnum = re.sub(r"[^A-Z0-9]", "", before)
        after_alnum = re.sub(r"[^A-Z0-9]", "", after)
        if before_alnum != after_alnum:
            repairs.append(f"{reason}: {before} -> {after}")
        return after

    no_space = re.sub(r"\s+", "", s)
    alnum = re.sub(r"[^A-Z0-9]", "", no_space)

    # 1. ABB 3Bxx / 3HAC modules
    m = re.match(r"^([3][BH][A-Z]{2})([0-9OQDIL|]{6,8})(R)([0-9OQDIL|]{1,4})$", alnum)
    if m:
        fixed = f"{_letters_fix(m.group(1))}{_digits_fix(m.group(2))}R{_digits_fix(m.group(4))}"
        return record(s, fixed, "ABB_3B_MODULE_OCR"), repairs, "ABB DCS / Power Electronics Module", "ABB"

    # 1b. ABB 1SDA / 1SFA / 1SVR / 1SAP Switchgear & Controls
    m = re.match(r"^([12I][S][DFAVRP][A-Z0])([0-9OQDIL|]{6,8})(R)([0-9OQDIL|]{1,4})$", alnum)
    if m:
        prefix = f"{_digits_fix(m.group(1)[0])}{_letters_fix(m.group(1)[1:])}"
        fixed = f"{prefix}{_digits_fix(m.group(2))}R{_digits_fix(m.group(4))}"
        return record(s, fixed, "ABB_1S_SWITCHGEAR_OCR"), repairs, "ABB Switchgear / Control Component", "ABB"

    # 1c. ABB ACS/ACH Drives
    m = re.match(
        r"^(AC[SHQM])([0-9OQDIL|]{3})[-\s]?([0-9OQDIL|]{2})[-\s]?([0-9OQDIL|]{3,4}[A-Z0-9])[-\s]?([0-9OQDIL|]{1,2})(?:[-\s]?([A-Z0-9+]+))?$",
        s,
    )
    if m:
        core4 = f"{_digits_fix(m.group(4)[:-1])}{_letters_fix(m.group(4)[-1])}"
        tail = f"-{m.group(6)}" if m.group(6) else ""
        fixed = f"{m.group(1)}{_digits_fix(m.group(2))}-{_digits_fix(m.group(3))}-{core4}-{_digits_fix(m.group(5))}{tail}"
        return record(s, fixed, "ABB_ACS_DRIVE_OCR"), repairs, "ABB ACS/ACH Variable Frequency Drive", "ABB"

    # 1d. ABB IEC Motors
    m = re.match(r"^(M[23][QBA][A-Z]{1,2})\s*([0-9OQDIL|]{2,3})([SML][A-Z]?\s*[0-9OQDIL|][A-Z0-9]*)$", s)
    if m:
        tail = re.sub(r"\s+", "", m.group(3))
        fixed_tail = f"{_letters_fix(tail[:-2])}{_digits_fix(tail[-2:-1])}{_letters_fix(tail[-1:])}"
        fixed = f"{m.group(1)}{_digits_fix(m.group(2))}{fixed_tail}"
        return record(s, fixed, "ABB_IEC_MOTOR_OCR"), repairs, "ABB IEC Induction Motor", "ABB"

    # 1e. ABB AZ20 Analyzer
    if re.match(r"^AZ[2][0O]/", no_space):
        parts = no_space.split("/")
        parts[0] = _apply_mask(parts[0], "LLDD")
        if len(parts) > 1 and len(parts[1]) >= 6:
            parts[1] = f"{_digits_fix(parts[1][:-1])}{_letters_fix(parts[1][-1])}"
        fixed = "/".join(parts)
        return record(s, fixed, "ABB_AZ_ANALYZER_OCR"), repairs, "ABB Combustion / Gas Analyzer", "ABB"

    # 2a. Siemens 16-char MLFB
    m = re.match(
        r"^([6][ESAG][SPTLVK][0-9OQDIL|]|[3][RWTvV][WLTFAV][0-9OQDIL|]|[1I][L][EA][0-9OQDIL|])"
        r"([0-9OQDIL|]{3})([0-9OQDIL|][A-Z0-9]{3}[0-9OQDIL|])([0-9OQDIL|][A-Z0-9]{2}[0-9OQDIL|])$",
        alnum,
    )
    if m:
        head3 = f"{_digits_fix(m.group(1)[0])}{_letters_fix(m.group(1)[1:3])}"
        if head3 in {"6ES", "6EP", "6SL", "6SE", "6AV", "6GK", "3RW", "3RT", "3RV", "3WL", "3VA", "1LE", "1LA"}:
            p1 = f"{head3}{_digits_fix(m.group(1)[3])}"
            p2 = _digits_fix(m.group(2))
            b, c = m.group(3), m.group(4)
            p3 = f"{_digits_fix(b[0])}{_letters_fix(b[1:3])}{_digits_fix(b[3:])}"
            p4 = f"{_digits_fix(c[0])}{_letters_fix(c[1:3])}{_digits_fix(c[3])}"
            fixed = f"{p1}{p2}-{p3}-{p4}"
            return (
                record(s, fixed, "SIEMENS_16CHAR_MLFB_OCR"),
                repairs,
                "Siemens SIMATIC / SINAMICS / SENTRON 16-char MLFB",
                "Siemens",
            )

    # 2b. Siemens 12-char MLFB
    m = re.match(
        r"^([6][E][P][0-9OQDIL|]|[3][R][WTV][0-9OQDIL|])([0-9OQDIL|]{3})([0-9OQDIL|][A-Z0-9]{2}[0-9OQDIL|]{2})$",
        alnum,
    )
    if m:
        p1 = f"{_digits_fix(m.group(1)[0])}{_letters_fix(m.group(1)[1:3])}{_digits_fix(m.group(1)[3])}"
        p2 = _digits_fix(m.group(2))
        b = m.group(3)
        p3 = f"{_digits_fix(b[0])}{_letters_fix(b[1:3])}{_digits_fix(b[3:])}"
        fixed = f"{p1}{p2}-{p3}"
        return record(s, fixed, "SIEMENS_12CHAR_MLFB_OCR"), repairs, "Siemens SITOP / SIRIUS 12-char MLFB", "Siemens"

    # 2c. Siemens 3TF / 3TB Contactors (e.g. 3TF3200-OB-Z -> 3TF3200-0B-Z)
    m = re.match(r"^(3T[FB])([0-9OQDIL|]{4})[-\s]?([0-9OQDIL|])([A-Z0-9]{1,3})(?:[-\s]?(Z))?$", no_space)
    if m:
        z_part = "-Z" if m.group(5) else ""
        fixed = f"{m.group(1)}{_digits_fix(m.group(2))}-{_digits_fix(m.group(3))}{m.group(4)}{z_part}"
        return record(s, fixed, "SIEMENS_3TF_CONTACTOR_OCR"), repairs, "Siemens 3TF/3TB Contactor", "Siemens"

    # 3a. Bently Nevada 3500
    m = re.match(
        r"^(35[0O]{2})/([0-9OQDIL|]{2}[A-Z]?)(?:[-\s]+([0-9OQDIL|]{2}))?(?:[-\s]+([0-9OQDIL|]{2}))?(?:[-\s]+([0-9OQDIL|]{2}))?$",
        s,
    )
    if m:
        mod_raw = m.group(2)
        mod = f"{_digits_fix(mod_raw[:2])}{_letters_fix(mod_raw[2])}" if len(mod_raw) == 3 else _digits_fix(mod_raw)
        segs = [_digits_fix(x) for x in (m.group(3), m.group(4), m.group(5)) if x]
        suffix = f"-{'-'.join(segs)}" if segs else ""
        fixed = f"3500/{mod}{suffix}"
        return record(s, fixed, "BENTLY_3500_OCR"), repairs, "Bently Nevada 3500 Rack / Monitor", "Bently Nevada"

    # 3b. Bently Nevada 3300 XL
    if re.match(r"^33[0O][0-9OQDIL|]{3}[-\s_]", s):
        segs = [_digits_fix(seg) for seg in re.split(r"[-\s_]+", s)]
        if len(segs) >= 2 and all(re.match(r"^\d{2,6}$", seg) for seg in segs):
            fixed = "-".join(segs)
            return (
                record(s, fixed, "BENTLY_3300XL_OCR"),
                repairs,
                "Bently Nevada 3300 XL Transducer / Cable",
                "Bently Nevada",
            )

    # 4. Rosemount Smart Transmitters
    m = re.match(r"^([32][0O]5[1I][SCTDPGL]{1,2}|3[1I]44P|644[HR])([A-Z0-9OQDIL|\-]{6,30})$", no_space.replace("-", ""))
    if m:
        head = m.group(1)
        if re.match(r"^[32][0O]5[1I]", head):
            head = f"{_digits_fix(head[:4])}{_letters_fix(head[4:])}"
        elif re.match(r"^3[1I]44P", head):
            head = "3144P"
        body = re.sub(
            r"^([0-9OQDIL|])([A-Z])([0-9OQDIL|]{2})([A-Z])([0-9OQDIL|])",
            lambda g: (
                f"{_digits_fix(g.group(1))}{_letters_fix(g.group(2))}"
                f"{_digits_fix(g.group(3))}{_letters_fix(g.group(4))}{_digits_fix(g.group(5))}"
            ),
            m.group(2),
        )
        fixed = f"{head}{body}"
        return record(s, fixed, "ROSEMOUNT_TRANSMITTER_OCR"), repairs, "Rosemount Process Transmitter", "Rosemount"

    # 5. Allen-Bradley Bulletins
    m = re.match(
        r"^([1I]7[3456789][0-9OQDIL|]|2[0O]8[0O]|5[0O]69|2[025][FBC])[-\s]?([A-Z]{1,4}[0-9OQDIL|]{0,4}[A-Z0-9]*)(?:[-\s]([A-Z0-9OQDIL|]{2,8}))?$",
        s,
    )
    if m:
        raw_bul = m.group(1)
        cand = f"{_digits_fix(raw_bul[:2])}{_letters_fix(raw_bul[2:])}"
        bul = cand if re.match(r"^2[025][FBC]$", cand) else _digits_fix(raw_bul)

        def fix_ab_seg(seg: str) -> str:
            return re.sub(
                r"([A-Z]+)([0-9OQDIL|]+)([A-Z]*)",
                lambda g: f"{g.group(1)}{_digits_fix(g.group(2))}{g.group(3)}",
                seg,
            )

        seg2 = fix_ab_seg(m.group(2))
        seg3 = f"-{fix_ab_seg(m.group(3))}" if m.group(3) else ""
        fixed = f"{bul}-{seg2}{seg3}"
        return (
            record(s, fixed, "ALLEN_BRADLEY_BULLETIN_OCR"),
            repairs,
            "Allen-Bradley Logix / SLC / Micro800 / PowerFlex",
            "Allen-Bradley",
        )

    # 6. Schneider Electric Quantum / TeSys / Altivar / Modicon X80
    m = re.match(r"^([1I]4[0O])([A-Z]{3})([0-9OQDIL|]{5})$", alnum)
    if m:
        fixed = f"140{_letters_fix(m.group(2))}{_digits_fix(m.group(3))}"
        return record(s, fixed, "SCHNEIDER_QUANTUM_OCR"), repairs, "Schneider Electric Modicon Quantum", "Schneider Electric"

    m = re.match(r"^(LC[1I]D|LRD|ATV)([0-9OQDIL|]{2,3})([A-Z0-9]*)$", alnum)
    if m:
        head = "LC1D" if m.group(1).startswith("LC") else m.group(1)
        fixed = f"{head}{_digits_fix(m.group(2))}{m.group(3)}"
        return record(s, fixed, "SCHNEIDER_TESYS_ALTIVAR_OCR"), repairs, "Schneider Electric TeSys / Altivar", "Schneider Electric"

    if re.match(r"^BM[EX][A-Z][0-9OQDIL|]{4,6}[A-Z0-9]*$", alnum):
        fixed = f"{_letters_fix(alnum[:4])}{_digits_fix(alnum[4:10])}{alnum[10:]}"
        return record(s, fixed, "SCHNEIDER_MODICON_X80_OCR"), repairs, "Schneider Electric Modicon M340 / M580", "Schneider Electric"

    # 7. Yokogawa FA-M3 / CENTUM VP / DPharp
    m = re.match(r"^(F3[A-Z]{2})([0-9OQDIL|]{2})[-\s]?([0-9OQDIL|][A-Z0-9])$", no_space)
    if m:
        sfx = f"{_digits_fix(m.group(3)[0])}{_letters_fix(m.group(3)[1])}"
        fixed = f"{m.group(1)}{_digits_fix(m.group(2))}-{sfx}"
        return record(s, fixed, "YOKOGAWA_FAM3_OCR"), repairs, "Yokogawa FA-M3 PLC Module", "Yokogawa"

    m = re.match(r"^(AA[IV]|AD[VI]|AFV|ALR|CP)([0-9OQDIL|]{3})(?:[-\s]?([SP][0-9OQDIL|]{2}))?$", no_space)
    if m:
        sfx = f"-{_letters_fix(m.group(3)[0])}{_digits_fix(m.group(3)[1:])}" if m.group(3) else ""
        fixed = f"{m.group(1)}{_digits_fix(m.group(2))}{sfx}"
        return record(s, fixed, "YOKOGAWA_CENTUM_OCR"), repairs, "Yokogawa CENTUM VP I/O & Controller", "Yokogawa"

    if re.match(r"^EJ[AX][0-9OQDIL|]{3}[A-Z]", no_space):
        segs = re.split(r"[-\s]+", s)
        segs[0] = f"{segs[0][:3]}{_digits_fix(segs[0][3:6])}{_letters_fix(segs[0][6:])}"
        fixed = "-".join(segs)
        return record(s, fixed, "YOKOGAWA_DPHARP_OCR"), repairs, "Yokogawa DPharp Pressure Transmitter", "Yokogawa"

    # 8. Hagglunds Hydraulic Motors
    m = re.match(r"^(CA|CB|CBM)[-\s]?([0-9OQDIL|]{2,4})(?:[-\s]+([0-9OQDIL|]{2,4}))?$", s)
    if m and (brand_hint == "Hagglunds" or m.group(1) == "CBM" or bool(m.group(3))):
        p2 = _digits_fix(m.group(2))
        p3 = f"-{_digits_fix(m.group(3))}" if m.group(3) else ""
        sep = "-" if m.group(1) == "CBM" else ""
        fixed = f"{m.group(1)}{sep}{p2}{p3}"
        return record(s, fixed, "HAGGLUNDS_HYDRAULIC_OCR"), repairs, "Hagglunds Radial Piston Hydraulic Motor", "Hagglunds"

    # 9. EagleBurgmann Mechanical Seals
    m = re.match(r"^(MG[1I][23S]?)[/\-]([0-9OQDIL|]{2,3})(?:[\-/]([A-Z0-9OQDIL|]{1,5}))?$", no_space)
    if m:
        head = f"MG1{m.group(1)[3:]}"
        size = _digits_fix(m.group(2))
        tail = f"-{m.group(3)}" if m.group(3) else ""
        fixed = f"{head}/{size}{tail}"
        return record(s, fixed, "EAGLEBURGMANN_MG_SEAL_OCR"), repairs, "EagleBurgmann Elastomer Bellows Mechanical Seal", "EagleBurgmann"

    m = re.match(r"^([MH]74[A-Z0-9]{0,3}|CARTEX-[A-Z]{2,3})[/\-]([0-9OQDIL|]{2,3})(?:[\-/]([A-Z0-9OQDIL|]{2,6}))?$", no_space)
    if m:
        size = _digits_fix(m.group(2))
        tail = f"-{m.group(3)}" if m.group(3) else ""
        fixed = f"{m.group(1)}/{size}{tail}"
        return record(s, fixed, "EAGLEBURGMANN_PROCESS_SEAL_OCR"), repairs, "EagleBurgmann Process / Cartridge Mechanical Seal", "EagleBurgmann"

    return re.sub(r"\s+", "-", s), repairs, None, brand_hint


def normalize_mpn(raw_input: str, brand_hint: str = "") -> NormalizedMpnResult:
    """Normalize a raw OEM MPN into canonical form, compact key, slug, and brand classification."""
    original = "" if raw_input is None else str(raw_input)
    trimmed = original.strip()
    if not trimmed:
        return NormalizedMpnResult(
            original=original,
            canonical_mpn="",
            compact_key="",
            catalog_slug_candidate="",
            brand=None,
            matched_family=None,
            revision_or_series=None,
            ocr_repaired=False,
            repairs=[],
            search_aliases=[],
            confidence="LOW",
        )

    detected_hint = _detect_brand_hint(trimmed, brand_hint)
    working = unicodedata.normalize("NFKC", trimmed)
    working = re.sub(r"[\u2010-\u2015\u2212]", "-", working)
    working = re.sub(r"^[#*:;\s]+|[.,;:\s]+$", "", working)
    working = _BRAND_PREFIX_STRIP_RE.sub("", working).strip()

    revision_or_series: str | None = None
    pkg_match = _PACKAGING_SUFFIX_RE.search(working)
    if pkg_match:
        rev_val = pkg_match.group(1) or pkg_match.group(2)
        revision_or_series = rev_val.upper() if rev_val else None
        working = working[: pkg_match.start()].strip()
    elif re.match(r"^(?:[1I]7[0-9OQDIL|]{2}|2[0O]8[0O]|5[0O]69)-[A-Z0-9OQDIL|\-]+/[A-Z]$", working, re.IGNORECASE):
        revision_or_series = working[-1].upper()
        working = working[:-2]

    canonical_mpn, repairs, matched_family, resolved_brand = repair_ocr_confusions(working, detected_hint)
    compact_key = re.sub(r"[^A-Z0-9]", "", canonical_mpn)
    catalog_slug = re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", canonical_mpn.lower()))

    aliases: list[str] = []
    for candidate in (
        canonical_mpn,
        compact_key,
        catalog_slug,
        canonical_mpn.replace("/", "-") if "/" in canonical_mpn else "",
    ):
        if candidate and candidate not in aliases:
            aliases.append(candidate)

    final_brand = resolved_brand or detected_hint
    confidence: ConfidenceLevel = "HIGH" if matched_family else ("MEDIUM" if final_brand else "LOW")

    return NormalizedMpnResult(
        original=original,
        canonical_mpn=canonical_mpn,
        compact_key=compact_key,
        catalog_slug_candidate=catalog_slug,
        brand=final_brand,
        matched_family=matched_family,
        revision_or_series=revision_or_series,
        ocr_repaired=len(repairs) > 0,
        repairs=repairs,
        search_aliases=aliases,
        confidence=confidence,
    )


def classify_oem_brand(mpn_input: str, explicit_brand: str = "") -> dict[str, str | None]:
    res = normalize_mpn(mpn_input, brand_hint=explicit_brand)
    return {
        "brand": res.brand,
        "family": res.matched_family,
        "confidence": res.confidence,
    }


def parse_bom_line(line: str) -> ParsedBomLineResult | None:
    raw = str(line or "").strip()
    if not raw:
        return None

    qty = 1
    uom = "EA"
    qty_match = re.search(
        r"(?:\bqty\s*[:=]?\s*|\bx\s*)(\d{1,6})\s*(pcs?|ea|units?|sets?)?\b", raw, re.IGNORECASE
    ) or re.search(r"\b(\d{1,5})\s*(pcs|ea|sets)\b", raw, re.IGNORECASE)
    if qty_match:
        qty = int(qty_match.group(1))
        if qty_match.group(2):
            u = qty_match.group(2).upper()
            uom = "PCS" if u.startswith("PC") else ("SET" if u.startswith("SET") else "EA")

    cleaned = re.sub(r"^(?:line|item|#)\s*\d+\s*[:.)\-]?\s*", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"\|.*$", "", cleaned)
    cleaned = re.sub(
        r"(?:\bqty\s*[:=]?\s*|\bx\s*)\d{1,6}\s*(?:pcs?|ea|units?|sets?)?\b", "", cleaned, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"\b\d{1,5}\s*(?:pcs|ea|sets)\b", "", cleaned, flags=re.IGNORECASE).strip()

    norm = normalize_mpn(cleaned)
    return ParsedBomLineResult(
        **norm.to_dict(),
        quantity=qty,
        uom=uom,
    )
