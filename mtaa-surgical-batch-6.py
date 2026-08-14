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

print("\n[1/2] Converting domains/tribes/types/tribe_types.ts to barrel...")
content = read_file("domains/tribes/types/tribe_types.ts")
if content and "export interface" in content:
    write_file("domains/tribes/types/tribe_types.ts", "export * from '../types';\n")
elif content:
    print("  ℹ️  Already a barrel or empty, skipping.")

print("\n[2/2] Converting lib/tribes/types.ts to re-export...")
content = read_file("lib/tribes/types.ts")
if content and "export interface" in content:
    write_file("lib/tribes/types.ts", "export * from '@/domains/tribes/types';\n")
elif content:
    print("  ℹ️  Already a re-export or empty, skipping.")

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
print("BATCH 6 COMPLETE — Tribes types consolidated")
print("="*60)
print("""
Next:
  git add -A
  git commit -m "consolidate: Batch 6 — Tribes types barrel" --no-verify
""")
