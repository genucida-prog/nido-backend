#!/usr/bin/env python3
"""Sweep for original brand references in clone codebase."""

import argparse
import os
import re
import sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="Directory to sweep")
    ap.add_argument("--avoid", nargs="*", default=[], help="Words to flag")
    ap.add_argument("--domains", nargs="*", default=[], help="Domains to flag")
    ap.add_argument("--colors", nargs="*", default=[], help="Hex colors to flag")
    ap.add_argument("--config", help="JSON config file")
    args = ap.parse_args()

    if args.config:
        import json
        with open(args.config) as f:
            cfg = json.load(f)
        avoid = cfg.get("avoid", [])
        domains = cfg.get("domains", [])
        colors = cfg.get("colors", {}).get("original", [])
    else:
        avoid = args.avoid
        domains = args.domains
        colors = args.colors

    skip_dirs = {"node_modules", ".git", ".expo", "dist", "build", "__pycache__"}
    skip_exts = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".mp3", ".mp4", ".webm", ".lottie", ".json", ".arsc"}

    findings = []

    for root, dirs, files in os.walk(args.path):
        # Skip unwanted dirs
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        for fname in files:
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, args.path)

            # Skip binary and certain extensions
            ext = os.path.splitext(fname)[1].lower()
            if ext in skip_exts:
                continue

            try:
                with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception:
                continue

            # Check file name
            for word in avoid:
                if word.lower() in fname.lower():
                    findings.append((rel, f"filename contains '{word}'"))

            # Check content
            lines = content.split("\n")
            for i, line in enumerate(lines, 1):
                # Check avoid words (case insensitive)
                for word in avoid:
                    pattern = re.compile(re.escape(word), re.IGNORECASE)
                    if pattern.search(line):
                        findings.append((rel, f"line {i}: '{word}' found"))

                # Check domains
                for domain in domains:
                    if domain.lower() in line.lower():
                        findings.append((rel, f"line {i}: domain '{domain}' found"))

                # Check colors
                for color in colors:
                    hex_color = color.lstrip("#").lower()
                    if hex_color in line.lower():
                        findings.append((rel, f"line {i}: original color {color} found"))

    if findings:
        print(f"!! {len(findings)} issues found:\n")
        for fpath, msg in findings[:50]:
            print(f"  {fpath}: {msg}")
        if len(findings) > 50:
            print(f"  ... and {len(findings) - 50} more")
        sys.exit(1)
    else:
        print("OK Sweep clean - no original brand references found!")
        sys.exit(0)

if __name__ == "__main__":
    main()