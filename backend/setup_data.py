"""
setup_data.py — link or copy Pretty Fly CSVs into backend/data/

Usage:
    python setup_data.py --source ../../pretty_fly_data_pack/data

This creates backend/data/ and makes each required CSV available there
(symlink on macOS/Linux, copy on Windows or when --copy is passed).
"""

import argparse
import os
import shutil
import sys
from pathlib import Path

REQUIRED = [
    "orders.csv",
    "order_line_items.csv",
    "products.csv",
    "product_variants.csv",
    "refunds.csv",
    "customers.csv",
    "support_tickets.csv",
    "inventory_levels.csv",
    "google_ads.csv",
    "meta_ads.csv",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Set up backend/data/ from the raw data pack.")
    parser.add_argument(
        "--source",
        required=True,
        help="Path to the directory containing the Pretty Fly CSV files",
    )
    parser.add_argument(
        "--copy",
        action="store_true",
        help="Copy files instead of symlinking (always used on Windows)",
    )
    args = parser.parse_args()

    src_dir = Path(args.source).expanduser().resolve()
    if not src_dir.is_dir():
        sys.exit(f"ERROR: source directory not found: {src_dir}")

    # backend/data/ lives next to this script
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)

    use_copy = args.copy or sys.platform == "win32"
    action   = "Copied" if use_copy else "Linked"

    ok = 0
    for name in REQUIRED:
        src  = src_dir / name
        dest = data_dir / name

        if not src.exists():
            print(f"  MISSING  {name}  (looked in {src_dir})")
            continue

        # Remove stale symlink or file
        if dest.exists() or dest.is_symlink():
            dest.unlink()

        if use_copy:
            shutil.copy2(src, dest)
        else:
            dest.symlink_to(src)

        print(f"  {action:6s}  {name}")
        ok += 1

    print()
    if ok == len(REQUIRED):
        print(f"All {ok} files ready in {data_dir}")
        print("Run:  uvicorn main:app --reload --port 8000")
    else:
        missing = len(REQUIRED) - ok
        print(f"WARNING: {missing} file(s) missing — backend may not start correctly.")
        sys.exit(1)


if __name__ == "__main__":
    main()
