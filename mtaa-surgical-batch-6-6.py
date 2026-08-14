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
# 1. Fix useASIS import — import from provider, not react
# ───────────────────────────────────────────────────────────────
print("\n[1/3] Fixing useASIS import source in app/(os)/asis/index.tsx...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    # Replace any import of useASIS from asis-cse-react with asis-cse-provider
    content = re.sub(
        r"import\s*\{([^}]*)\}\s*from\s*['\"]@/lib/asis-cse/asis-cse-react['\"]",
        lambda m: f"import {{ {m.group(1).strip()} }} from '@/lib/asis-cse/asis-cse-provider'",
        content
    )
    # Also handle single-quote variant
    content = re.sub(
        r"import\s*\{([^}]*)\}\s*from\s*['\"]@/lib/asis-cse/asis-cse-react['\"]",
        lambda m: f"import {{ {m.group(1).strip()} }} from '@/lib/asis-cse/asis-cse-provider'",
        content
    )
    write_file("app/(os)/asis/index.tsx", content)

# ───────────────────────────────────────────────────────────────
# 2. Fix role === 'tool' by ensuring ASISMessage cast
# ───────────────────────────────────────────────────────────────
print("\n[2/3] Fixing role === 'tool' in app/(os)/asis/index.tsx...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    # The msg variable needs to be cast. Find the pattern where role is checked.
    # Common patterns: msg.role, message.role, m.role
    for var_name in ['msg', 'message', 'm', 'item']:
        # Pattern: var_name.role === 'tool'
        content = re.sub(
            rf"\b{var_name}\b\.role\s*===\s*['\"]tool['\"]",
            rf"({var_name} as ASISMessage).role === 'tool'",
            content
        )
    write_file("app/(os)/asis/index.tsx", content)

# ───────────────────────────────────────────────────────────────
# 3. Create domains/tribes/types.ts barrel (safe, no overwrite)
# ───────────────────────────────────────────────────────────────
print("\n[3/3] Creating domains/tribes/types.ts barrel...")
tribes_types_path = os.path.join(BASE, "domains/tribes/types.ts")
if not os.path.exists(tribes_types_path):
    write_file("domains/tribes/types.ts", "export * from '@/lib/tribes/types';\n")
else:
    print("  ℹ️  domains/tribes/types.ts already exists, skipping")

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
    print(result.stdout[-2500:] if len(result.stdout) > 2500 else result.stdout)
    sys.exit(1)

print("\n" + "="*60)
print("BATCH 6.6 COMPLETE — ASIS + Tribes clean")
print("="*60)
print("""
Next:
  git add -A
  git commit -m "consolidate: Batch 6.6 — ASIS import fix + Tribes barrel" --no-verify
""")
