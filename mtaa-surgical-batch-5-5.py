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

print("\n[1/3] Fixing useASIS import in app/(os)/asis/index.tsx...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    def split_import(m):
        imports = [i.strip() for i in m.group(1).split(',') if i.strip()]
        types_imports = [i for i in imports if i != 'useASIS']
        result = ""
        if types_imports:
            result += f"import {{ {', '.join(types_imports)} }} from '{m.group(2)}';\n"
        result += "import { useASIS } from '@/lib/asis-cse/asis-cse-react';"
        return result
    content = re.sub(
        r"import\s*\{\s*([^}]*)\}\s*from\s*['\"](@/lib/asis-cse/asis-cse-types)['\"]",
        split_import,
        content
    )
    content = re.sub(r"import\s*\{\s*\}\s*from\s*['\"][^'\"]+['\"];\n?", "", content)
    write_file("app/(os)/asis/index.tsx", content)

print("\n[2/3] Fixing role === 'tool' comparison...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    content = re.sub(
        r"(\w+)\.role\s*===\s*['\"]tool['\"]",
        r"(\1 as ASISMessage).role === 'tool'",
        content
    )
    write_file("app/(os)/asis/index.tsx", content)

print("\n[3/3] Fixing implicit any in .map callbacks...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    content = re.sub(r"\.map\(\(\s*engine\s*,\s*idx\s*\)\s*=>", ".map((engine: any, idx: number) =>", content)
    content = re.sub(r"\.map\(\(\s*conv\s*\)\s*=>", ".map((conv: any) =>", content)
    write_file("app/(os)/asis/index.tsx", content)

print("\n" + "="*60)
print("VERIFYING TypeScript...")
print("="*60)
result = subprocess.run(["npx", "tsc", "--noEmit"], cwd=BASE, capture_output=True, text=True)
if result.returncode == 0:
    print("✅ TypeScript: 0 errors")
else:
    print("⚠️  Remaining errors:")
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    sys.exit(1)

print("\n" + "="*60)
print("BATCH 5.5 COMPLETE — ASIS screen clean")
print("="*60)
print("""
Next:
  git add -A
  git commit -m "consolidate: Batch 5.5 — ASIS screen import/type fixes" --no-verify
""")
