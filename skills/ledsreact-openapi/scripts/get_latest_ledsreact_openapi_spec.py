#!/usr/bin/env python3
"""
Fetches the latest Ledsreact OpenAPI spec and saves it to the assets folder.

Usage:
    python get_latest_ledsreact_openapi_spec.py [--format yaml|json] [--output <path>]

Defaults: format=yaml, output=../assets/ledsreact_openapi.<format>
"""

import argparse
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

BASE = "https://open-api.eu.ledsreact.com"
URLS = {
    "yaml": f"{BASE}/docs-yaml",
    "json": f"{BASE}/docs-json",
}

SCRIPT_DIR = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description="Fetch latest Ledsreact OpenAPI spec")
    parser.add_argument(
        "--format",
        choices=["yaml", "json"],
        default="yaml",
        help="Spec format (default: yaml)",
    )
    parser.add_argument("--output", type=str, default=None, help="Output file path")
    args = parser.parse_args()

    url = URLS[args.format]
    output = (
        Path(args.output)
        if args.output
        else SCRIPT_DIR.parent / "assets" / f"ledsreact_openapi.{args.format}"
    )

    print(f"Fetching {args.format.upper()} spec from {url} ...")

    try:
        req = Request(url, headers={"Accept": "*/*", "User-Agent": "ledsreact-skill"})
        with urlopen(req) as resp:
            body = resp.read()
    except HTTPError as e:
        print(f"HTTP {e.code}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except URLError as e:
        print(f"Request failed: {e.reason}", file=sys.stderr)
        sys.exit(1)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(body)
    print(f"Saved to {output} ({len(body) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
