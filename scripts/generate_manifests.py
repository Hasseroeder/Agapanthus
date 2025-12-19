#!/usr/bin/env python3
"""
scripts/generate_manifests_minimal.py

Scan gallery/ and create manifest.json in every directory.
Only extracts these fields:
- Exif.Photo.DateTimeOriginal -> creation_date
- Xmp.dc.title -> title
- Xmp.dc.description -> description
- Xmp.dc.subject -> tags (list)
"""

import os
import json
import sys
import re
from pathlib import Path
from datetime import datetime
from xml.etree import ElementTree as ET

try:
    import exifread
except Exception:
    exifread = None

GALLERY_DIR = Path("gallery")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif"}


def normalize_date(s):
    if not s:
        return None
    s = str(s).strip()
    try:
        # EXIF common format "YYYY:MM:DD HH:MM:SS"
        if ":" in s and s.count(":") >= 2 and " " in s:
            date_part, time_part = s.split(" ", 1)
            dp = date_part.replace(":", "-", 2)
            dt = f"{dp} {time_part}"
            parsed = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
            return parsed.isoformat()
        # try ISO parse
        parsed = datetime.fromisoformat(s)
        return parsed.isoformat()
    except Exception:
        return s


def read_exif_datetimeoriginal(path: Path):
    """Return EXIF DateTimeOriginal string if available (via exifread)."""
    if exifread is None:
        return None
    try:
        with open(path, "rb") as f:
            tags = exifread.process_file(f, details=False)
        # exifread key for DateTimeOriginal
        if "EXIF DateTimeOriginal" in tags:
            return str(tags.get("EXIF DateTimeOriginal"))
        # fallback common key
        if "Image DateTime" in tags:
            return str(tags.get("Image DateTime"))
    except Exception:
        pass
    return None


def extract_xmp_packet(data: bytes):
    """
    Find an XMP packet in the file bytes and return it as a string.
    XMP is usually embedded as an XML packet between <x:xmpmeta ...> ... </x:xmpmeta>.
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
    # fallback: try to find rdf:RDF block
    start_rdf = text.find("<rdf:RDF", start)
    if start_rdf != -1:
        end_rdf = text.find("</rdf:RDF>", start_rdf)
        if end_rdf != -1:
            end_rdf += len("</rdf:RDF>")
            return text[start_rdf:end_rdf]
    return None


def parse_xmp_fields(xmp_xml: str):
    """
    Parse XMP XML and extract dc:title, dc:description, dc:subject.
    Returns (title, description, subjects_list)
    """
    if not xmp_xml:
        return None, None, None
    # Remove common XMP namespace prefixes to simplify parsing if needed
    try:
        # Ensure well-formed XML by wrapping if necessary
        # Some XMP packets include processing instructions; ElementTree can usually handle them.
        root = ET.fromstring(xmp_xml)
    except Exception:
        # Try to extract rdf:RDF block only
        m = re.search(r"(<rdf:RDF[\s\S]*</rdf:RDF>)", xmp_xml)
        if not m:
            return None, None, None
        try:
            root = ET.fromstring(m.group(1))
        except Exception:
            return None, None, None

    # register common namespaces
    ns = {
        "dc": "http://purl.org/dc/elements/1.1/",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    }

    title = None
    description = None
    subjects = None

    # dc:title -> may be rdf:Alt with rdf:li
    for title_el in root.findall(".//{http://purl.org/dc/elements/1.1/}title"):
        # look for rdf:Alt/rdf:li
        li = title_el.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li")
        if li is not None and li.text:
            title = li.text.strip()
            break
        if title_el.text and title_el.text.strip():
            title = title_el.text.strip()
            break

    # dc:description -> rdf:Alt/rdf:li
    for desc_el in root.findall(".//{http://purl.org/dc/elements/1.1/}description"):
        li = desc_el.find(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li")
        if li is not None and li.text:
            description = li.text.strip()
            break
        if desc_el.text and desc_el.text.strip():
            description = desc_el.text.strip()
            break

    # dc:subject -> rdf:Bag/rdf:li or simple list
    for subj_el in root.findall(".//{http://purl.org/dc/elements/1.1/}subject"):
        # look for rdf:Bag/rdf:li or rdf:Seq/rdf:li
        lis = subj_el.findall(".//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}li")
        if lis:
            subjects = [li.text.strip() for li in lis if li.text and li.text.strip()]
            break
        # sometimes subject is a simple string with separators
        if subj_el.text and subj_el.text.strip():
            # try splitting on semicolon or comma
            raw = subj_el.text.strip()
            parts = [p.strip() for p in re.split(r"[;,]", raw) if p.strip()]
            if parts:
                subjects = parts
                break

    return title or None, description or None, subjects or None


def extract_minimal_metadata(path: Path):
    """
    Return dict with keys: title, description, creation_date, tags
    Only reads the four fields requested.
    """
    title = description = creation = tags = None

    # EXIF DateTimeOriginal
    dt = read_exif_datetimeoriginal(path)
    creation = normalize_date(dt) if dt else None

    # XMP parsing: read a chunk of the file (XMP is usually near start)
    try:
        with open(path, "rb") as f:
            data = f.read(200 * 1024)  # read first 200KB which should contain XMP
    except Exception:
        data = b""

    xmp_packet = extract_xmp_packet(data)
    if xmp_packet:
        t, d, s = parse_xmp_fields(xmp_packet)
        if t:
            title = t
        if d:
            description = d
        if s:
            tags = s

    # normalize empty strings to None
    def norm(x):
        if x is None:
            return None
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
    if not GALLERY_DIR.exists() or not GALLERY_DIR.is_dir():
        print("No gallery directory found. Exiting.")
        sys.exit(0)

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