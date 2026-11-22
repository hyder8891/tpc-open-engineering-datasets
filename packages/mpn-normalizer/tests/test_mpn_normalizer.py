"""Comprehensive pytest suite for tpc-mpn-normalizer across all 9 OEM families."""

from __future__ import annotations

import pytest

from mpn_normalizer import (
    SUPPORTED_BRANDS,
    classify_oem_brand,
    normalize_mpn,
    parse_bom_line,
    repair_ocr_confusions,
)

GOLDEN_CASES = [
    # 1. ABB
    ("ABB 3BDS 005799 R1", "3BDS005799R1", "ABB", False, None),
    ("3BDS005799R1", "3BDS005799R1", "ABB", False, None),
    ("Original ABB 3BDSOO5799RI", "3BDS005799R1", "ABB", True, None),
    ("3BSE0I8I57R1", "3BSE018157R1", "ABB", True, None),
    ("3BHB005171R0101", "3BHB005171R0101", "ABB", False, None),
    ("ISDA073688RI", "1SDA073688R1", "ABB", True, None),
    ("ACS88O-OI-O45A-3", "ACS880-01-045A-3", "ABB", True, None),
    ("ABB M2QA 132M4A", "M2QA132M4A", "ABB", False, None),
    ("AZ2O/112112221112E/STD", "AZ20/112112221112E/STD", "ABB", True, None),
    # 2. Siemens
    ("Siemens 6ES7 315-2EH14-0AB0", "6ES7315-2EH14-0AB0", "Siemens", False, None),
    ("6ES73I5-2EHI4-OABO", "6ES7315-2EH14-0AB0", "Siemens", True, None),
    ("6EP13321LB00", "6EP1332-1LB00", "Siemens", False, None),
    ("3RW4O26-IBBI4", "3RW4026-1BB14", "Siemens", True, None),
    ("3TF3200-OB-Z", "3TF3200-0B-Z", "Siemens", True, None),
    ("3WLI1O8-2BB32-IAA2", "3WL1108-2BB32-1AA2", "Siemens", True, None),
    # 3. Allen-Bradley
    ("Allen-Bradley 1756 PA75", "1756-PA75", "Allen-Bradley", False, None),
    ("I747-L553/B", "1747-L553", "Allen-Bradley", True, "B"),
    ("1784-KT", "1784-KT", "Allen-Bradley", False, None),
    ("2O8O-LC5O-24QVB", "2080-LC50-24QVB", "Allen-Bradley", True, None),
    # 4. Schneider Electric
    ("SCHNEIDER 140 CPS 11420", "140CPS11420", "Schneider Electric", False, None),
    ("I4OCHSI1OOO", "140CHS11000", "Schneider Electric", True, None),
    ("LCID25M7", "LC1D25M7", "Schneider Electric", True, None),
    ("BMXP342O2O", "BMXP342020", "Schneider Electric", True, None),
    # 5. Yokogawa
    ("YOKOGAWA F3XD64-3N", "F3XD64-3N", "Yokogawa", False, None),
    ("F3BUO6-ON", "F3BU06-0N", "Yokogawa", True, None),
    ("CP345", "CP345", "Yokogawa", False, None),
    ("AAII43-SOO", "AAI143-S00", "Yokogawa", True, None),
    ("EJAI1OE-JMS5J-912EA", "EJA110E-JMS5J-912EA", "Yokogawa", True, None),
    # 6. Rosemount
    ("Rosemount 3O5ICD-2A22AIAB4-M5", "3051CD2A22A1AB4M5", "Rosemount", True, None),
    ("3051S2TG2A2E11A1AB4M5", "3051S2TG2A2E11A1AB4M5", "Rosemount", False, None),
    ("3I44PD1A1E5B4M5", "3144PD1A1E5B4M5", "Rosemount", True, None),
    # 7. Bently Nevada
    ("Bently Nevada 330180 91 00", "330180-91-00", "Bently Nevada", False, None),
    ("33OI3O-O45-OO-O5", "330130-045-00-05", "Bently Nevada", True, None),
    ("35OO/42M-OI-OO", "3500/42M-01-00", "Bently Nevada", True, None),
    # 8. Hagglunds
    ("Hagglunds CA70 60", "CA70-60", "Hagglunds", False, None),
    ("CA14O-I2O", "CA140-120", "Hagglunds", True, None),
    ("CBM 2OOO", "CBM-2000", "Hagglunds", True, None),
    # 9. EagleBurgmann
    ("EagleBurgmann MG13-28-Z", "MG13/28-Z", "EagleBurgmann", False, None),
    ("MGI3/28-Z", "MG13/28-Z", "EagleBurgmann", True, None),
    ("M74S2/I25-G95A", "M74S2/125-G95A", "EagleBurgmann", True, None),
]


def test_supported_brands() -> None:
    assert len(SUPPORTED_BRANDS) == 9
    assert set(SUPPORTED_BRANDS) == {
        "ABB",
        "Siemens",
        "Allen-Bradley",
        "Schneider Electric",
        "Yokogawa",
        "Rosemount",
        "Bently Nevada",
        "Hagglunds",
        "EagleBurgmann",
    }


@pytest.mark.parametrize("raw,expected_canonical,expected_brand,expected_ocr,expected_rev", GOLDEN_CASES)
def test_golden_normalization_and_idempotence(
    raw: str,
    expected_canonical: str,
    expected_brand: str,
    expected_ocr: bool,
    expected_rev: str | None,
) -> None:
    res = normalize_mpn(raw)
    assert res.canonical_mpn == expected_canonical
    assert res.brand == expected_brand
    assert res.ocr_repaired is expected_ocr
    assert res.confidence == "HIGH"
    if expected_rev is not None:
        assert res.revision_or_series == expected_rev

    # Property: idempotence on canonical output
    second = normalize_mpn(res.canonical_mpn, brand_hint=res.brand or "")
    assert second.canonical_mpn == expected_canonical
    assert second.ocr_repaired is False


def test_classify_and_direct_ocr_helper() -> None:
    cls = classify_oem_brand("3BHB003154R0101")
    assert cls["brand"] == "ABB"
    assert cls["confidence"] == "HIGH"

    token, repairs, _, brand = repair_ocr_confusions("6ES73I52EHI4OABO")
    assert token == "6ES7315-2EH14-0AB0"
    assert brand == "Siemens"
    assert len(repairs) >= 1


def test_bom_line_parser_and_packaging_suffix() -> None:
    parsed = parse_bom_line("Line 3: Genuine ABB 3BDSOO5799RI SER B Qty: 6 PCS | Basra Turbine")
    assert parsed is not None
    assert parsed.canonical_mpn == "3BDS005799R1"
    assert parsed.brand == "ABB"
    assert parsed.revision_or_series == "B"
    assert parsed.quantity == 6
    assert parsed.uom == "PCS"

    assert parse_bom_line("   ") is None
    assert normalize_mpn("").canonical_mpn == ""
