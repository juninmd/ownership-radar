#!/usr/bin/env python3
"""
Script to check if changed files have designated code owners according to CODEOWNERS.
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Optional, Tuple


def pattern_to_regex(pattern: str) -> re.Pattern:
    """
    Converts a CODEOWNERS path pattern into a compiled Python regular expression according to GitHub CODEOWNERS syntax rules.
    """
    pattern = pattern.strip()
    if pattern in ("*", "**"):
        return re.compile(r"^.*$")

    has_leading_slash = pattern.startswith("/")
    if has_leading_slash:
        pattern = pattern[1:]

    has_trailing_slash = pattern.endswith("/")
    if has_trailing_slash:
        pattern = pattern[:-1]

    has_slash = "/" in pattern

    i = 0
    n = len(pattern)
    res = []

    while i < n:
        if pattern[i : i + 3] == "/**":
            res.append(r"(?:/.*)?")
            i += 3
        elif pattern[i : i + 3] == "**/" and i == 0:
            res.append(r"(?:.*/)?")
            i += 3
        elif pattern[i : i + 2] == "**":
            res.append(r".*")
            i += 2
        elif pattern[i] == "*":
            res.append(r"[^/]*")
            i += 1
        elif pattern[i] == "?":
            res.append(r"[^/]")
            i += 1
        else:
            res.append(re.escape(pattern[i]))
            i += 1

    body = "".join(res)

    if has_trailing_slash:
        body = body + r"(?:/.*)?"

    if has_leading_slash or has_slash:
        regex_str = f"^{body}$"
    else:
        regex_str = f"^(?:.*/)?{body}$"

    return re.compile(regex_str)


def find_codeowners_file(custom_path: Optional[str] = None) -> Optional[Path]:
    """
    Finds CODEOWNERS file at specified or default standard locations.
    """
    if custom_path:
        p = Path(custom_path)
        if p.is_file():
            return p
        return None

    candidates = [
        Path(".github/CODEOWNERS"),
        Path("CODEOWNERS"),
        Path("docs/CODEOWNERS"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def parse_codeowners(file_path: Path) -> List[Tuple[re.Pattern, List[str]]]:
    """
    Parses a CODEOWNERS file into a list of (pattern_regex, owners) tuples.
    """
    rules = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.split("#")[0].strip()
            if not line:
                continue

            parts = line.split()
            if not parts:
                continue

            pattern = parts[0]
            owners = parts[1:]

            regex = pattern_to_regex(pattern)
            rules.append((regex, owners))

    return rules


def normalize_file_path(path: str) -> str:
    """
    Normalizes a relative file path for CODEOWNERS matching.
    """
    path = path.replace("\\", "/").strip()
    if path.startswith("./"):
        path = path[2:]
    if path.startswith("/"):
        path = path[1:]
    return path


def check_ownership(
    files: List[str], rules: List[Tuple[re.Pattern, List[str]]]
) -> Tuple[List[str], dict]:
    """
    Checks each file against rules (last matching rule wins).
    Returns (unowned_files, file_owners_map).
    """
    unowned = []
    owners_map = {}

    for raw_file in files:
        file_path = normalize_file_path(raw_file)
        if not file_path:
            continue

        matched_owners: Optional[List[str]] = None
        for regex, owners in rules:
            if regex.match(file_path):
                matched_owners = owners

        if matched_owners and len(matched_owners) > 0:
            owners_map[file_path] = matched_owners
        else:
            unowned.append(file_path)

    return unowned, owners_map


def main():
    parser = argparse.ArgumentParser(
        description="Check if changed files have clear code owners in CODEOWNERS."
    )
    parser.add_argument(
        "files", nargs="*", help="List of file paths to check for ownership."
    )
    parser.add_argument(
        "--codeowners",
        "-c",
        help="Path to CODEOWNERS file. Defaults to .github/CODEOWNERS, CODEOWNERS, or docs/CODEOWNERS.",
    )
    parser.add_argument(
        "--files-file",
        "-f",
        help="Path to file containing list of changed files (one path per line).",
    )

    args = parser.parse_args()

    codeowners_path = find_codeowners_file(args.codeowners)
    if not codeowners_path:
        if args.codeowners:
            print(f"Error: CODEOWNERS file not found at '{args.codeowners}'", file=sys.stderr)
        else:
            print(
                "Error: No CODEOWNERS file found at .github/CODEOWNERS, CODEOWNERS, or docs/CODEOWNERS",
                file=sys.stderr,
            )
        sys.exit(1)

    file_list = []
    if args.files:
        file_list.extend(args.files)
    elif args.files_file:
        if os.path.exists(args.files_file):
            with open(args.files_file, "r", encoding="utf-8") as f:
                file_list.extend([line.strip() for line in f if line.strip()])
        else:
            print(f"Error: Files list file not found at '{args.files_file}'", file=sys.stderr)
            sys.exit(1)
    elif not sys.stdin.isatty():
        file_list.extend([line.strip() for line in sys.stdin if line.strip()])

    if not file_list:
        print("No files to check.")
        sys.exit(0)

    rules = parse_codeowners(codeowners_path)
    unowned, owners_map = check_ownership(file_list, rules)

    if unowned:
        print("Error: The following changed files do not have a clear code owner in CODEOWNERS:\n", file=sys.stderr)
        for u in unowned:
            print(f"  - {u}", file=sys.stderr)
        print(f"\nPlease update '{codeowners_path}' to assign owners for these files.", file=sys.stderr)
        sys.exit(1)

    print(f"All {len(file_list)} file(s) have assigned code owners according to '{codeowners_path}'.")
    for f_path, f_owners in owners_map.items():
        print(f"  [OK] {f_path} -> {', '.join(f_owners)}")
    sys.exit(0)


if __name__ == "__main__":
    main()
