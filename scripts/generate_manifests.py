#!/usr/bin/env python3
"""
scripts/generate_manifests_minimal.py
"""

import os
import json
import sys
import re
from pathlib import Path
from datetime import datetime
from xml.etree import ElementTree as ET
from typing import Optional, List, Tuple

try:
    import exifread
except Exception:
    exifread = None

GALLERY_DIR = Path("gallery")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif"}

def extract_xmp_packet(data: bytes):
    """
    Find an XMP packet in the file bytes and return it as a string.
    """
    try:
        text = data.decode("utf-8", errors="ignore")
    except Exception:
        return None
    start = text.find("<x:xmpmeta")
    if start == -1:
        start = text.find("<xpacket")
    if start == -1:
        return None
    end = text.find("</x:xmpmeta>", start)
    if end != -1:
        end += len("</x:xmpmeta>")
        return text[start:end]
    return None

def parse_xmp_fields(xmp_xml: str) -> Tuple[Optional[str], Optional[str], Optional[List[str]], Optional[str]]:
    if not xmp_xml:
        return None, None, None, None

    root = ET.fromstring(xmp_xml)
    DC = "http://purl.org/dc/elements/1.1/"

    def _text(tag: str) -> Optional[str]:
        el = root.find(f".//{{{DC}}}{tag}")
        return el.text.strip() if el is not None and el.text and el.text.strip() else None

    title = _text("title")
    description = _text("description")
    date_val = _text("date")

    # dc:subject
    subjects = None
    subj_el = root.find(f".//{{{DC}}}subject")
    if subj_el is not None:
        children_text = [c.text.strip() for c in subj_el.findall(".//") if c.text and c.text.strip()]
        if children_text:
            subjects = children_text
        else:
            raw = subj_el.text.strip() if subj_el.text and subj_el.text.strip() else None
            if raw:
                subjects = [p.strip() for p in re.split(r"[;,]", raw) if p.strip()]

    return title, description, subjects, date_val

def extract_minimal_metadata(path: Path):
    """
    Return dict with keys: title, description, creation_date, tags
    """
    title = description = creation = tags = None

    try:
        with open(path, "rb") as f:
            data = f.read(200 * 1024)
    except Exception:
        data = b""

    xmp_packet = extract_xmp_packet(data)
    if xmp_packet:
        t, d, s, date_val = parse_xmp_fields(xmp_packet)
        if t:
            title = t
        if d:
            description = d
        if s:
            tags = s
        if date_val:
            creation = date_val

    # normalize empty strings to None
    def norm(x):
        if isinstance(x, str) and x.strip() == "":
            return None
        return x

    return {
        "title": norm(title),
        "description": norm(description),
        "creation_date": norm(creation),
        "tags": tags or None,
    }

def is_image_file(name: str):
    return Path(name).suffix.lower() in IMAGE_EXTS


def generate_manifest_for_dir(dirpath: Path):
    items = sorted(os.listdir(dirpath))
    folders = [n for n in items if (dirpath / n).is_dir()]

    manifest = {
        "folders": folders,
        "images": {},
    }

    for n in items:
        p = dirpath / n
        if not p.is_file():
            continue
        if n == "manifest.json":
            continue
        if is_image_file(n):
            meta = extract_minimal_metadata(p)
            manifest["images"][n] = meta

    return manifest


def main():
    changed = False

    for root, dirs, files in os.walk(GALLERY_DIR):
        dirpath = Path(root)
        manifest = generate_manifest_for_dir(dirpath)
        manifest_path = dirpath / "manifest.json"
        new_content = json.dumps(manifest, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        if manifest_path.exists():
            old = manifest_path.read_text(encoding="utf-8")
            if old != new_content:
                manifest_path.write_text(new_content, encoding="utf-8")
                changed = True
        else:
            manifest_path.write_text(new_content, encoding="utf-8")
            changed = True

    if changed:
        print("Manifests updated.")
    else:
        print("No changes to manifests.")


if __name__ == "__main__":
    main()