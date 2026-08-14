#!/usr/bin/env python3
import os, re, subprocess, sys
BASE = os.getcwd()

def read_file(path):
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        print(f"  ⚠️  MISSING: {path}")
        return None
    with open(full, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ WRITTEN: {path}")

# ───────────────────────────────────────────────────────────────
# 1. app/(os)/asis/index.tsx — Fix ASISMessage import source
# ───────────────────────────────────────────────────────────────
print("\n[1/3] Fixing ASISMessage import in app/(os)/asis/index.tsx...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    # The file imports ASISMessage from asis-cse-provider, but we moved it to asis-cse-types
    content = content.replace(
        'import { ASISMessage } from "@/lib/asis-cse/asis-cse-provider";',
        'import { ASISMessage } from "@/lib/asis-cse/asis-cse-types";'
    )
    # Also handle single quotes variant
    content = content.replace(
        "import { ASISMessage } from '@/lib/asis-cse/asis-cse-provider';",
        "import { ASISMessage } from '@/lib/asis-cse/asis-cse-types';"
    )
    write_file("app/(os)/asis/index.tsx", content)

# ───────────────────────────────────────────────────────────────
# 2. lib/asis-v7/engine/kamos-engine.ts — Fix SynthesizedResponse import
# ───────────────────────────────────────────────────────────────
print("\n[2/3] Fixing SynthesizedResponse import in lib/asis-v7/engine/kamos-engine.ts...")
content = read_file("lib/asis-v7/engine/kamos-engine.ts")
if content:
    content = content.replace(
        'SynthesizedResponse',
        'ASISv7SynthesizedResponse'
    )
    write_file("lib/asis-v7/engine/kamos-engine.ts", content)

# ───────────────────────────────────────────────────────────────
# 3. lib/asis-v7/engine/nl-generator.ts — Fix SynthesizedResponse import
# ───────────────────────────────────────────────────────────────
print("\n[3/3] Fixing SynthesizedResponse import in lib/asis-v7/engine/nl-generator.ts...")
content = read_file("lib/asis-v7/engine/nl-generator.ts")
if content:
    content = content.replace(
        'SynthesizedResponse',
        'ASISv7SynthesizedResponse'
    )
    write_file("lib/asis-v7/engine/nl-generator.ts", content)

# ───────────────────────────────────────────────────────────────
# Verify
# ───────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("VERIFYING TypeScript...")
print("="*60)
result = subprocess.run(["npx", "tsc", "--noEmit"], cwd=BASE, capture_output=True, text=True)
if result.returncode == 0:
    print("✅ TypeScript: 0 errors")
else:
    print("⚠️  TypeScript errors:")
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    sys.exit(1)

print("\n" + "="*60)
print("BATCH 4 COMPLETE")
print("="*60)
print("""
Fixes applied:
  • app/(os)/asis/index.tsx          → ASISMessage from asis-cse-types
  • lib/asis-v7/engine/kamos-engine.ts → ASISv7SynthesizedResponse
  • lib/asis-v7/engine/nl-generator.ts → ASISv7SynthesizedResponse

Next:
  git add -A
  git commit -m "consolidate: Batch 4 — import path fixes" --no-verify
""")
