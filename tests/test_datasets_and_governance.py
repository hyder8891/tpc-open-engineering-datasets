"""Comprehensive dataset parity, Croissant 1.0 schema, trilingual UTF-8, and SHA-256 token hygiene tests."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LIVE_GITHUB_REPO_URL = "https://github.com/hyder8891/tpc-open-engineering-datasets"

DATASETS = [
    ("iraq-industrial-import-cosqc-handbook", "iraq_hs_cosqc_matrix.csv", "iraq_hs_cosqc_matrix.json", 30),
    ("mena-harsh-climate-equipment-derating", "mena_thermal_derating_matrix.csv", "mena_thermal_derating_matrix.json", 12),
    ("iec-ansi-nema-powerplant-crosswalk", "iec_ansi_nema_gb_crosswalk.csv", "iec_ansi_nema_gb_crosswalk.json", 20),
]

# Opaque SHA-256 digests of normalized lowercase out-of-scope / excluded tokens
# (prevents any literal out-of-scope domain or identifier from appearing in public source code).
BLOCKED_TOKEN_SHA256 = frozenset(
    [
        "61877c59b3a74493a73be0d67c74bda409a066c3b06357a5c59ee225c8e22853",
        "fdb518050d13e457a2db999ebf75893f4a619ae47aadfdcd4913ca241645377a",
        "7d296c79bdb526d6baadda6cfbd308fc809c1eb9d376fdba2b9ab153f3870d45",
        "ff21d39338cf8c9628567886b392b35f1a3a65fe5febfde964466a374f884557",
        "bcb6e251f1782674defa4c76b767200b5bbe207f2fb7a33259bf8fc8709663e9",
        "e1a912d193077a85c00906e291653f3ad65f823761711502c2a6d9c3aaed8fa4",
        "9d3cd793575fdf3f8c717e6559e37ecf6bfac47c007d5e34540dd1d0c99caca6",
        "86f05cc438e7ba7072706803d2d92c3bb2dd26b1397421981199253acd0cbd6b",
        "e72c2f76ab3391566c5589a2084bf1345a08ea7704d45617a124e43be120be85",
        "e6bc0cfc3754bdb5a96ec5610b7f82a5ea460dc255ac6f075819cd1e4531d15b",
        "01fe941777c2881447e73653257e322c8416eef3744b7041022adca96472dc0b",
        "87e412cee7484c35e130e5272a50c7b4e88d4f0ad6cb42f5bc5b5fe9b448ef26",
        "43ca21eab85f433e6528534bf00667d3f287ec6b2f9dbd9bf0368c60c37617b3",
        "8f839ec5f9ed92b1032b3852a50a4acc398d52c143ab41286b3ac53c6f18f882",
        "5b60d988ddeed5be54aff5126c5894b99a9f01a2075b28e241aeceff2dc37003",
        "701ac3155b3cd7be887e0361d971bf1eece7659089e5a0f32c95b192ded22681",
        "defd4140a162a89959817293bbe51a9a11b91d917062317f50503261021a659f",
        "22c264294a1d038fb0232f1a8583ead6e93839cf0892522a174503a555c80cb8",
        "939e97b9cdb02495cfad84694859b29120a9890b15c64e651e247ec74b220096",
        "9d3508a8484ee2520ca5fe0e52eab835774efa3fe533267e914eb00ad78d2579",
        "8d3aa1a6f227d714692a9d5a7fbbda496fb09f17f7207a11ffd0a4cca6cf35b7",
        "418a9d354d84a3d7990b9032ff8623dbd2d55fb5cd45e2f275d4401669b5df62",
        "99a71b96a028c17b22540ac94d1b451cfe8e9cfbe03a9efdb3198559a5caef5f",
        "2b9782a769a3537d8e06d1546fe01640dad47f106942dc2485b6d2e8c6e03e2b",
        "0d0f58e7d737fd2e06f64c315677ef6f93d59beb3d1c65a00f191563cbedfcfc",
        "d8af6dd3ef000f7d71af654c0f0cc3d1a11b6f3c61a47511b125b6ab23c0e448",
        "86426cf66b30f5467e4c9a398799359bfe12e31e949341418fcb5c46c9f640b8",
        "fba8d0a8b8cbe0aae78806d04ec894c1d4ce58e79a095c08d829c94bc2a4a006",
        "474c2eeb6aea26731c3061b6153c94391ec075d29506345bdaf2df060dd12d08",
    ]
)


def _sha256_str(val: str) -> str:
    return hashlib.sha256(val.encode("utf-8")).hexdigest()


def _extract_candidate_grams(text: str) -> set[str]:
    lower = text.lower()
    candidates: set[str] = set()
    # Dotted/slashed/hyphenated tokens (e.g. domains, repo paths, compound codes)
    for tok in re.findall(r"[a-z0-9]+(?:[./-][a-z0-9]+)+", lower):
        candidates.add(tok)
    # Plain alphanumeric words + 2-grams + 3-grams
    words = re.findall(r"[a-z0-9]+", lower)
    candidates.update(words)
    for i in range(len(words) - 1):
        candidates.add(f"{words[i]} {words[i + 1]}")
    for i in range(len(words) - 2):
        candidates.add(f"{words[i]} {words[i + 1]} {words[i + 2]}")
    return candidates


def test_csv_json_parity_and_croissant_checksums() -> None:
    for slug, csv_name, json_name, min_rows in DATASETS:
        ds_dir = REPO_ROOT / "datasets" / slug
        csv_path = ds_dir / csv_name
        json_path = ds_dir / json_name
        croissant_path = ds_dir / "croissant.json"
        zenodo_path = ds_dir / ".zenodo.json"
        cff_path = ds_dir / "CITATION.cff"

        with csv_path.open(encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            csv_headers = list(reader.fieldnames or [])
            csv_rows = list(reader)

        json_payload = json.loads(json_path.read_text(encoding="utf-8"))
        json_rows = json_payload["records"]

        assert len(csv_rows) >= min_rows
        assert csv_rows == json_rows, f"CSV vs JSON record mismatch in {slug}"

        # Verify Croissant 1.0 compliance, live URL, byte sizes, SHA-256 hashes, and exact field mapping
        croissant = json.loads(croissant_path.read_text(encoding="utf-8"))
        assert croissant["@type"] == "sc:Dataset"
        assert croissant["dct:conformsTo"] == "http://mlcommons.org/croissant/1.0"
        assert croissant["url"] == f"{LIVE_GITHUB_REPO_URL}/tree/main/datasets/{slug}"

        csv_sha = hashlib.sha256(csv_path.read_bytes()).hexdigest()
        json_sha = hashlib.sha256(json_path.read_bytes()).hexdigest()
        dist_by_name = {d["name"]: d for d in croissant["distribution"]}
        assert dist_by_name[csv_name]["sha256"] == csv_sha
        assert dist_by_name[csv_name]["contentSize"] == f"{csv_path.stat().st_size} B"
        assert dist_by_name[json_name]["sha256"] == json_sha
        assert dist_by_name[json_name]["contentSize"] == f"{json_path.stat().st_size} B"

        cr_fields = [fld["name"] for fld in croissant["recordSet"][0]["field"]]
        assert cr_fields == csv_headers, f"Croissant RecordSet fields != CSV headers in {slug}"

        zenodo = json.loads(zenodo_path.read_text(encoding="utf-8"))
        assert zenodo["upload_type"] == "dataset"
        assert zenodo["license"] == "cc-by-4.0"
        rel_ids = {r["identifier"] for r in zenodo.get("related_identifiers", [])}
        assert LIVE_GITHUB_REPO_URL in rel_ids

        cff_text = cff_path.read_text(encoding="utf-8")
        assert "cff-version: 1.2.0" in cff_text
        assert f'repository-code: "{LIVE_GITHUB_REPO_URL}"' in cff_text


def test_iraq_cosqc_trilingual_and_hs_chapter_integrity() -> None:
    ds1 = REPO_ROOT / "datasets" / "iraq-industrial-import-cosqc-handbook"
    payload = json.loads((ds1 / "iraq_hs_cosqc_matrix.json").read_text(encoding="utf-8"))
    chapters_seen = {r["chapter"] for r in payload["records"]}
    assert chapters_seen == {"84", "85", "90"}

    for row in payload["records"]:
        assert re.match(r"^(?:84|85|90)\d{4}$", row["hs6_code"])
        assert re.search(r"[\u0600-\u06FF]", row["equipment_category_ar"])
        assert re.search(r"[\u4e00-\u9fff]", row["equipment_category_zh"])
        assert "SGS" in row["authorized_cabs"]

    assert (ds1 / "README.md").exists()
    ar_md = (ds1 / "README.ar.md").read_text(encoding="utf-8")
    zh_md = (ds1 / "README.zh-CN.md").read_text(encoding="utf-8")
    assert "COSQC" in ar_md and "ميناء أم قصر" in ar_md and "+86 153 1498 7933" in ar_md
    assert "COSQC" in zh_md and "乌姆盖斯尔港" in zh_md and "+86 153 1498 7933" in zh_md


def test_mena_derating_monotonicity_and_crosswalk_domains() -> None:
    ds2 = json.loads(
        (REPO_ROOT / "datasets" / "mena-harsh-climate-equipment-derating" / "mena_thermal_derating_matrix.json").read_text(
            encoding="utf-8"
        )
    )
    for row in ds2["records"]:
        f40 = float(row["factor_40c"])
        f45 = float(row["factor_45c"])
        f50 = float(row["factor_50c"])
        f55 = float(row["factor_55c"])
        assert 1.0 >= f40 >= f45 >= f50 >= f55 >= 0.0, f"Non-monotonic derating on {row['equipment_id']}"

    ds3 = json.loads(
        (REPO_ROOT / "datasets" / "iec-ansi-nema-powerplant-crosswalk" / "iec_ansi_nema_gb_crosswalk.json").read_text(
            encoding="utf-8"
        )
    )
    domains = {r["domain"] for r in ds3["records"]}
    assert domains == {
        "PROTECTION_RELAY_FUNCTION",
        "ENCLOSURE_AND_EX_RATING",
        "ELECTRICAL_EQUIPMENT_STANDARD",
        "MECHANICAL_VALVE_AND_SEAL",
    }


def test_wikidata_powerchina_disambiguation_lock() -> None:
    wd_sheet = (REPO_ROOT / "ops-kit" / "wikidata-entity-sheet.md").read_text(encoding="utf-8")
    assert "Q10873928" in wd_sheet
    assert "P1889" in wd_sheet
    assert "china-power-contractor.cn" in wd_sheet
    assert LIVE_GITHUB_REPO_URL in wd_sheet


def test_sha256_scope_isolation_across_all_repo_files() -> None:
    scanned_count = 0
    for path in REPO_ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel_parts = path.relative_to(REPO_ROOT).parts
        if any(p.startswith(".git") or p in {"__pycache__", ".pytest_cache", "node_modules"} for p in rel_parts):
            continue
        text = path.read_text(encoding="utf-8")
        scanned_count += 1
        for cand in _extract_candidate_grams(text):
            digest = _sha256_str(cand)
            assert digest not in BLOCKED_TOKEN_SHA256, (
                f"Blocked out-of-scope token digest {digest[:12]}... matched in {path.relative_to(REPO_ROOT)}"
            )

    assert scanned_count >= 25
