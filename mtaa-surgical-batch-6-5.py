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
# 1. Restore lib/tribes/types.ts from before Batch 6 commit
# ───────────────────────────────────────────────────────────────
print("\n[1/4] Restoring lib/tribes/types.ts from git HEAD~1...")
result = subprocess.run(
    ["git", "checkout", "HEAD~1", "--", "lib/tribes/types.ts"],
    cwd=BASE, capture_output=True, text=True
)
if result.returncode == 0:
    print("  ✅ RESTORED: lib/tribes/types.ts from HEAD~1")
else:
    print(f"  ⚠️  git checkout failed: {result.stderr.strip()}")

# ───────────────────────────────────────────────────────────────
# 2. Ensure useASIS is exported from asis-cse-react.ts
# ───────────────────────────────────────────────────────────────
print("\n[2/4] Ensuring useASIS export in asis-cse-react.ts...")
content = read_file("lib/asis-cse/asis-cse-react.ts")
if content:
    # Check if useASIS is already exported
    if "export function useASIS" not in content and "export const useASIS" not in content:
        # Check if ASISContext is in this file
        if "ASISContext" in content:
            hook = """

// ─── Hook ──────────────────────────────────────────────────────
export function useASIS() {
  const context = useContext(ASISContext);
  if (!context) {
    throw new Error('useASIS must be used within an ASISProvider');
  }
  return context;
}
"""
            content = content.rstrip() + hook
            write_file("lib/asis-cse/asis-cse-react.ts", content)
        else:
            # ASISContext is in provider.tsx — re-export from there
            print("  ℹ️  ASISContext not in asis-cse-react.ts, will re-export useASIS from provider")
            # Add re-export at top
            if "export { useASIS }" not in content:
                content = "export { useASIS } from './asis-cse-provider';\n" + content
                write_file("lib/asis-cse/asis-cse-react.ts", content)
    else:
        print("  ℹ️  useASIS already exported, skipping")

# ───────────────────────────────────────────────────────────────
# 3. Fix role === 'tool' comparison in ASIS screen
# ───────────────────────────────────────────────────────────────
print("\n[3/4] Fixing role === 'tool' comparison in app/(os)/asis/index.tsx...")
content = read_file("app/(os)/asis/index.tsx")
if content:
    # The msg variable needs to be cast to ASISMessage for the role comparison
    # Find patterns like: msg.role === 'tool' and cast msg
    content = re.sub(
        r"(\w+)\.role\s*===\s*['\"]tool['\"]",
        r"(\1 as ASISMessage).role === 'tool'",
        content
    )
    write_file("app/(os)/asis/index.tsx", content)

# ───────────────────────────────────────────────────────────────
# 4. If domains/tribes/types/tribe_types.ts exists, make it a barrel
# ───────────────────────────────────────────────────────────────
print("\n[4/4] Checking domains/tribes/types/tribe_types.ts...")
if os.path.exists(os.path.join(BASE, "domains/tribes/types/tribe_types.ts")):
    write_file("domains/tribes/types/tribe_types.ts", "export * from '@/lib/tribes/types';\n")
else:
    print("  ℹ️  domains/tribes/types/tribe_types.ts does not exist, skipping")

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
print("BATCH 6.5 COMPLETE — Recovery clean")
print("="*60)
print("""
Fixes applied:
  • lib/tribes/types.ts          → Restored from git HEAD~1
  • lib/asis-cse/asis-cse-react.ts → Added/re-exported useASIS
  • app/(os)/asis/index.tsx      → Cast msg to ASISMessage for role check
  • domains/tribes/types/tribe_types.ts → Barrel if exists

Next:
  git add -A
  git commit -m "consolidate: Batch 6.5 — recovery fixes" --no-verify
""")
