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

print("\n[1/1] Renaming ASIS v7 duplicate types in lib/asis-v7/types/index.ts...")
content = read_file("lib/asis-v7/types/index.ts")
if content:
    # Rename ASISMessage → ASISv7Message (whole word only)
    content = re.sub(r'\bASISMessage\b', 'ASISv7Message', content)
    # Rename SynthesizedResponse → ASISv7SynthesizedResponse (whole word only)
    content = re.sub(r'\bSynthesizedResponse\b', 'ASISv7SynthesizedResponse', content)
    write_file("lib/asis-v7/types/index.ts", content)

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
print("BATCH 3 COMPLETE")
print("="*60)
print("""
Duplicates eliminated:
  • ASISMessage        → ASISv7Message        (lib/asis-v7/types/index.ts)
  • SynthesizedResponse → ASISv7SynthesizedResponse (lib/asis-v7/types/index.ts)

Next:
  git add -A
  git commit -m "consolidate: Batch 3 — ASIS v7 type rename" --no-verify
""")
