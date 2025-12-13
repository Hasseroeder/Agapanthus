#!/usr/bin/env python3
"""
scripts/generate_manifests.py

Scan gallery/ and create manifest.json in every directory.
- Lists immediate folders and files (excluding manifest.json).
- For image files extracts title, description, creation_date, tags when available.
- Supports common image formats: jpg jpeg png gif tiff tif webp
- Writes pretty JSON with stable ordering.
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

try:
    from PIL import Image
except Exception:
    Image = None

try:
    import exifread
except Exception:
    exifread = None

GALLERY_DIR = Path("gallery")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".tiff", ".tif", ".webp"}


def normalize_date(s):
    if not s:
        return None
    s = str(s).strip()
    # EXIF common format "YYYY:MM:DD HH:MM:SS"
    try:
        if ":" in s and s.count(":") >= 2 and " " in s:
            date_part, time_part = s.split(" ", 1)
            # replace first two colons with dashes
            dp = date_part.replace(":", "-", 2)
            dt = f"{dp} {time_part}"
            parsed = datetime.strptime(dt, "%Y-%m-%d %H:%M:%S")
            return parsed.isoformat()
        # try ISO parse
        parsed = datetime.fromisoformat(s)
        return parsed.isoformat()
    except Exception:
        return s


def read_exif_via_exifread(path: Path):
    if exifread is None:
        return None, None, None, None
    try:
        with open(path, "rb") as f:
            tags = exifread.process_file(f, details=False)
        title = None
        description = None
        creation = None
        tags_list = None

        # common keys
        if "Image ImageDescription" in tags:
            description = str(tags.get("Image ImageDescription"))
        for k in ("Image XPTitle", "Image XPComment", "Image XPSubject"):
            if k in tags:
                title = str(tags.get(k))
                break
        if "EXIF DateTimeOriginal" in tags:
            creation = str(tags.get("EXIF DateTimeOriginal"))
        elif "Image DateTime" in tags:
            creation = str(tags.get("Image DateTime"))
        if "Image XPKeywords" in tags:
            kw = tags.get("Image XPKeywords")
            try:
                tags_list = [s.strip() for s in str(kw).split(";") if s.strip()]
            except Exception:
                tags_list = None

        return title, description, creation, tags_list
    except Exception:
        return None, None, None, None


def read_png_text(img):
    info = getattr(img, "info", {}) or {}
    title = info.get("Title") or info.get("title")
    description = (
        info.get("Description")
        or info.get("description")
        or info.get("Comment")
        or info.get("comment")
    )
    creation = (
        info.get("Creation Time")
        or info.get("creation_time")
        or info.get("date:create")
        or info.get("DateTime")
    )
    keywords = info.get("Keywords") or info.get("keywords") or info.get("Subject") or info.get("Tags")
    tags_list = None
    if keywords:
        if isinstance(keywords, (list, tuple)):
            tags_list = list(keywords)
        else:
            tags_list = [s.strip() for s in str(keywords).split(";") if s.strip()]
    return title, description, creation, tags_list


def extract_image_metadata(path: Path):
    title = description = creation = tags_list = None
    ext = path.suffix.lower()
    try:
        if ext in {".jpg", ".jpeg", ".tiff", ".tif"}:
            t, d, c, tags = read_exif_via_exifread(path)
            title = t or None
            description = d or None
            creation = normalize_date(c) if c else None
            tags_list = tags or None
            # fallback to Pillow info if available
            if Image is not None:
                try:
                    with Image.open(path) as im:
                        info = getattr(im, "info", {}) or {}
                        if not title:
                            title = info.get("Title") or info.get("title")
                        if not description:
                            description = info.get("Description") or info.get("comment")
                except Exception:
                    pass
        elif ext == ".png":
            if Image is not None:
                try:
                    with Image.open(path) as im:
                        t, d, c, tags = read_png_text(im)
                        title = t or None
                        description = d or None
                        creation = normalize_date(c) if c else None
                        tags_list = tags or None
                except Exception:
                    pass
        else:
            # other formats try Pillow info
            if Image is not None:
                try:
                    with Image.open(path) as im:
                        info = getattr(im, "info", {}) or {}
                        title = info.get("Title") or info.get("title")
                        description = info.get("Description") or info.get("comment")
                        creation = normalize_date(info.get("Creation Time") or info.get("DateTime"))
                        keywords = info.get("Keywords") or info.get("keywords")
                        if keywords:
                            tags_list = [s.strip() for s in str(keywords).split(";") if s.strip()]
                except Exception:
                    pass
    except Exception:
        pass

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
        "tags": tags_list or None,
    }


def is_image_file(name: str):
    return Path(name).suffix.lower() in IMAGE_EXTS


def generate_manifest_for_dir(dirpath: Path):
    items = sorted(os.listdir(dirpath))
    folders = [n for n in items if (dirpath / n).is_dir()]
    files = [n for n in items if (dirpath / n).is_file() and n != "manifest.json"]

    manifest = {
        "path": str(dirpath.as_posix()),
        "folders": folders,
        "files": files,
        "images": {},
    }

    for f in files:
        if is_image_file(f):
            meta = extract_image_metadata(dirpath / f)
            manifest["images"][f] = meta

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
