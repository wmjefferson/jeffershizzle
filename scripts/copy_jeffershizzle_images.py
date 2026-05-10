"""
Copy and rename jeffershizzle gallery image folders.

Copies image files (not HTML) from:
    E:\\jeffershizzle-legacy\\EXP\\<old-folder>\\
To:
    E:\\jeffershizzle\\images\\<three-digit-number>\\

Usage:
    python copy_jeffershizzle_images.py --dry-run    # Preview changes
    python copy_jeffershizzle_images.py               # Execute copy
"""

import json
import os
import shutil
import sys
from pathlib import Path

SOURCE_ROOT = Path(r"E:\jeffershizzle-legacy\EXP")
DEST_ROOT = Path(r"E:\jeffershizzle\images")
TREE_DATA = SOURCE_ROOT / "_tree_data.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".avif", ".jfif"}

DRY_RUN = "--dry-run" in sys.argv


def load_mappings() -> list[dict]:
    """Load the gallery tree data with old->new folder mappings."""
    with open(TREE_DATA, "r", encoding="utf-8") as f:
        return json.load(f)


def copy_images(source_dir: Path, dest_dir: Path) -> tuple[int, int]:
    """Copy only image files from source to dest. Returns (copied, skipped)."""
    copied = 0
    skipped = 0

    if not source_dir.exists():
        return 0, 0

    for entry in sorted(source_dir.iterdir()):
        if entry.is_file() and entry.suffix.lower() in IMAGE_EXTS:
            dest_file = dest_dir / entry.name
            if dest_file.exists():
                skipped += 1
            else:
                if not DRY_RUN:
                    shutil.copy2(entry, dest_file)
                copied += 1

    return copied, skipped


def main():
    print("=" * 60)
    print("Jeffershizzle Gallery Image Copy Script")
    print("=" * 60)
    print(f"  Source:  {SOURCE_ROOT}")
    print(f"  Dest:   {DEST_ROOT}")
    print(f"  Mode:   {'DRY RUN (no files will be copied)' if DRY_RUN else 'EXECUTE'}")
    print()

    # Load mappings
    galleries = load_mappings()
    print(f"Loaded {len(galleries)} gallery mappings from _tree_data.json")
    print()

    # Create destination root
    if not DRY_RUN:
        DEST_ROOT.mkdir(parents=True, exist_ok=True)

    total_copied = 0
    total_skipped = 0
    total_missing = 0
    errors = []

    for g in galleries:
        old_folder = g["folder"]       # e.g. "52-rid"
        new_folder = g["seq"]          # e.g. "056"
        code = g["code"]               # e.g. "rid"

        source_dir = SOURCE_ROOT / old_folder
        dest_dir = DEST_ROOT / new_folder

        if not source_dir.exists():
            print(f"  !!  {old_folder} -> {new_folder}  MISSING SOURCE")
            total_missing += 1
            errors.append(f"Missing: {old_folder}")
            continue

        # Count images in source
        source_images = [f for f in source_dir.iterdir()
                         if f.is_file() and f.suffix.lower() in IMAGE_EXTS]

        if not source_images:
            print(f"  --  {old_folder} -> {new_folder}  (no images)")
            continue

        # Create dest folder
        if not DRY_RUN:
            dest_dir.mkdir(parents=True, exist_ok=True)

        # Copy
        copied, skipped = copy_images(source_dir, dest_dir)
        total_copied += copied
        total_skipped += skipped

        status = "OK" if copied > 0 else "--"
        skip_note = f" ({skipped} already exist)" if skipped > 0 else ""
        print(f"  {status}  {old_folder:>10} -> {new_folder}  {copied} images{skip_note}")

    # Summary
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Galleries processed:  {len(galleries)}")
    print(f"  Images copied:        {total_copied}")
    print(f"  Already existed:      {total_skipped}")
    print(f"  Missing sources:      {total_missing}")

    if errors:
        print()
        print("Errors:")
        for e in errors:
            print(f"  - {e}")

    if DRY_RUN:
        print()
        print("This was a DRY RUN. No files were copied.")
        print("Run without --dry-run to execute.")
    else:
        print()
        print(f"Done! Images are in {DEST_ROOT}")

    # Write a mapping reference file to dest
    if not DRY_RUN:
        mapping = {}
        for g in galleries:
            mapping[g["seq"]] = {
                "oldFolder": g["folder"],
                "code": g["code"],
                "imageCount": g["imageFileCount"],
            }
        mapping_file = DEST_ROOT / "_folder_mapping.json"
        with open(mapping_file, "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        print(f"Mapping reference saved to {mapping_file}")


if __name__ == "__main__":
    main()
