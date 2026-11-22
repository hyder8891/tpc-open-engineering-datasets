"""
tpc-mpn-normalizer (`mpn_normalizer`)
Zero-dependency OEM Manufacturer Part Number (MPN) normalization, OCR confusion
repair, and brand-family classification library maintained by The Power Contractor
(https://pc-cn.com · info@pc-cn.com · +86 153 1498 7933).
"""

from .core import (
    SUPPORTED_BRANDS,
    NormalizedMpnResult,
    ParsedBomLineResult,
    classify_oem_brand,
    normalize_mpn,
    parse_bom_line,
    repair_ocr_confusions,
)

__all__ = [
    "SUPPORTED_BRANDS",
    "NormalizedMpnResult",
    "ParsedBomLineResult",
    "classify_oem_brand",
    "normalize_mpn",
    "parse_bom_line",
    "repair_ocr_confusions",
]

__version__ = "1.0.1"
