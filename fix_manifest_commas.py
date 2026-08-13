#!/usr/bin/env python3
"""
MTAA OS V10 — Manifest Comma Fix
Adds missing comma before screens: [] as any, in manifest files.
"""

import os
import subprocess

manifests = [
    'lib/mtaa/appstore/apps/health/manifest.ts',
    'lib/mtaa/appstore/apps/hookup/manifest.ts',
    'lib/mtaa/appstore/apps/settings/manifest.ts',
]

for manifest in manifests:
    if not os.path.exists(manifest):
        print(f"[SKIP] {manifest} not found")
        continue
    with open(manifest, "r", encoding="utf-8") as f:
        lines = f.readlines()
    original = list(lines)
    for i, line in enumerate(lines):
        if "screens:" in line and "[] as any" in line:
            # Check previous non-empty line
            for j in range(i - 1, -1, -1):
                prev = lines[j].strip()
                if prev and not prev.startswith("//"):
                    if not prev.endswith(",") and not prev.endswith("{"):
                        # Add comma to end of previous line
                        lines[j] = lines[j].rstrip("\n") + ",\n"
                        print(f"[FIXED] {manifest} — added comma on line {j+1}")
                    break
    if lines != original:
        with open(manifest, "w", encoding="utf-8") as f:
            f.writelines(lines)
    else:
        print(f"[NO CHANGE] {manifest}")

print("\nVerifying with tsc...")
result = subprocess.run(
    ['npx', 'tsc', '--noEmit'],
    capture_output=True,
    text=True
)
errors = [line for line in result.stdout.splitlines() if 'error TS' in line]
if not errors:
    print("✅ ZERO TypeScript errors remaining!")
else:
    print(f"⚠️  {len(errors)} error(s) still remain:")
    for e in errors[:20]:
        print("   ", e)
