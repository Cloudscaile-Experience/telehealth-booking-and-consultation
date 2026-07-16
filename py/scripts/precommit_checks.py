"""
Native re-implementations of the generic pre-commit-hooks checks that used to
run via py/.pre-commit-config.yaml. Invoked directly by lefthook.yml jobs so
the repo only needs one git-hook runner (lefthook) instead of two.

Usage:
    uv run python scripts/precommit_checks.py <check> [files...]
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tomllib
from collections import defaultdict
from collections.abc import Callable
from pathlib import Path

import yaml

MERGE_CONFLICT_RE = re.compile(rb"^(<<<<<<<|=======|>>>>>>>)( |$)", re.MULTILINE)
PRIVATE_KEY_RE = re.compile(rb"-----BEGIN (RSA |OPENSSH |DSA |EC |PGP )?PRIVATE KEY-----")
DEBUG_STATEMENT_RE = re.compile(r"^\s*(import (pdb|ipdb|pudb)\b|(pdb|ipdb|pudb)\.set_trace\(\)|breakpoint\(\))")


def _is_binary(data: bytes) -> bool:
    return b"\0" in data


def check_large_files(paths: list[str], max_kb: int) -> int:
    failed = False
    for path in paths:
        size_kb = Path(path).stat().st_size / 1024
        if size_kb > max_kb:
            print(f"{path}: {size_kb:.0f}KB exceeds the {max_kb}KB limit", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_merge_conflicts(paths: list[str]) -> int:
    failed = False
    for path in paths:
        data = Path(path).read_bytes()
        if _is_binary(data):
            continue
        if MERGE_CONFLICT_RE.search(data):
            print(f"{path}: contains merge conflict markers", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_private_keys(paths: list[str]) -> int:
    failed = False
    for path in paths:
        if PRIVATE_KEY_RE.search(Path(path).read_bytes()):
            print(f"{path}: appears to contain a private key", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_case_conflicts() -> int:
    tracked = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.splitlines()
    seen: dict[str, list[str]] = defaultdict(list)
    for path in tracked:
        seen[path.lower()].append(path)
    failed = False
    for paths in seen.values():
        if len(paths) > 1:
            print(f"Case conflict: {', '.join(paths)}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_yaml(paths: list[str]) -> int:
    failed = False
    for path in paths:
        try:
            list(yaml.safe_load_all(Path(path).read_text()))
        except yaml.YAMLError as exc:
            print(f"{path}: invalid YAML — {exc}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_toml(paths: list[str]) -> int:
    failed = False
    for path in paths:
        try:
            tomllib.loads(Path(path).read_text())
        except tomllib.TOMLDecodeError as exc:
            print(f"{path}: invalid TOML — {exc}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def check_json(paths: list[str]) -> int:
    failed = False
    for path in paths:
        try:
            json.loads(Path(path).read_text())
        except json.JSONDecodeError as exc:
            print(f"{path}: invalid JSON — {exc}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def fix_whitespace(paths: list[str]) -> int:
    for path in paths:
        file = Path(path)
        data = file.read_bytes()
        if _is_binary(data):
            continue
        text = data.decode("utf-8")
        is_markdown = file.suffix == ".md"
        fixed_lines = [
            (line.rstrip() + "  " if is_markdown and line.endswith("  ") and line.strip() else line.rstrip())
            for line in text.split("\n")
        ]
        fixed = "\n".join(fixed_lines)
        if fixed != text:
            file.write_text(fixed)
    return 0


def fix_eof(paths: list[str]) -> int:
    for path in paths:
        file = Path(path)
        data = file.read_bytes()
        if _is_binary(data) or not data:
            continue
        fixed = data.rstrip(b"\n") + b"\n"
        if fixed != data:
            file.write_bytes(fixed)
    return 0


def debug_statements(paths: list[str]) -> int:
    failed = False
    for path in paths:
        for lineno, line in enumerate(Path(path).read_text().splitlines(), start=1):
            if DEBUG_STATEMENT_RE.match(line):
                print(f"{path}:{lineno}: debug statement found — {line.strip()}", file=sys.stderr)
                failed = True
    return 1 if failed else 0


CHECKS: dict[str, Callable[[argparse.Namespace], int]] = {
    "large-files": lambda args: check_large_files(args.files, args.max_kb),
    "merge-conflicts": lambda args: check_merge_conflicts(args.files),
    "private-keys": lambda args: check_private_keys(args.files),
    "case-conflicts": lambda _args: check_case_conflicts(),
    "yaml": lambda args: check_yaml(args.files),
    "toml": lambda args: check_toml(args.files),
    "json": lambda args: check_json(args.files),
    "fix-whitespace": lambda args: fix_whitespace(args.files),
    "fix-eof": lambda args: fix_eof(args.files),
    "debug-statements": lambda args: debug_statements(args.files),
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("check", choices=sorted(CHECKS))
    parser.add_argument("files", nargs="*")
    parser.add_argument("--max-kb", type=int, default=1000)
    args = parser.parse_args()
    sys.exit(CHECKS[args.check](args))


if __name__ == "__main__":
    main()
