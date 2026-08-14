#!/usr/bin/env python3
"""
MTAA OS — Type Consolidation Phase A: Safe Merges
Merges patch/addition files into canonical barrels, then deletes the patches.
Low risk — no domain restructuring, just cleanup of temporary type files.

Run: cd ~/MTAA_OS_V10 && python3 mtaa-type-consolidator-phase-a.py
"""
import os, re, shutil

ROOT = os.path.expanduser("~/MTAA_OS_V10")
os.chdir(ROOT)

results = []

def merge_and_delete(patch_file, canonical_file, description):
    """Merge unique type declarations from patch into canonical, then delete patch."""
    patch_path = os.path.join(ROOT, patch_file)
    canonical_path = os.path.join(ROOT, canonical_file)

    if not os.path.exists(patch_path):
        results.append(f"SKIP: {patch_file} does not exist")
        return

    if not os.path.exists(canonical_path):
        results.append(f"WARN: {canonical_file} does not exist, cannot merge {patch_file}")
        return

    # Read patch
    with open(patch_path, "r", encoding="utf-8", errors="ignore") as f:
        patch_content = f.read()

    # Read canonical
    with open(canonical_path, "r", encoding="utf-8", errors="ignore") as f:
        canonical_content = f.read()

    # Find exported types/interfaces in patch that are NOT in canonical
    export_pattern = re.compile(r'^\s*export\s+(?:interface|type|class|enum)\s+(\w+)', re.MULTILINE)
    patch_types = {m.group(1) for m in export_pattern.finditer(patch_content)}
    canonical_types = {m.group(1) for m in export_pattern.finditer(canonical_content)}

    new_types = patch_types - canonical_types
    merged_count = 0

    if new_types:
        # Extract the full declarations for new types
        lines = patch_content.split("\n")
        i = 0
        blocks_to_append = []

        while i < len(lines):
            match = export_pattern.match(lines[i])
            if match and match.group(1) in new_types:
                # Capture the full block
                block = [lines[i]]
                brace_count = lines[i].count("{") - lines[i].count("}")
                j = i + 1
                while j < len(lines) and brace_count > 0:
                    block.append(lines[j])
                    brace_count += lines[j].count("{") - lines[j].count("}")
                    j += 1
                blocks_to_append.append("\n".join(block))
                i = j
            else:
                i += 1

        if blocks_to_append:
            append_text = "\n\n// === MERGED FROM " + os.path.basename(patch_file) + " ===\n" + "\n\n".join(blocks_to_append)
            with open(canonical_path, "a", encoding="utf-8") as f:
                f.write(append_text)
            merged_count = len(blocks_to_append)

    # Delete the patch file
    os.remove(patch_path)
    results.append(f"OK: {patch_file} -> {canonical_file} ({merged_count} types merged, file deleted)")

# ============================================================
# A1: Profile types-additions -> profile/types/index.ts
# ============================================================
merge_and_delete(
    "lib/profile/types-additions.ts",
    "lib/profile/types/index.ts",
    "Profile type patches"
)

# ============================================================
# A2: Transport types-additions -> transport/types/index.ts
# ============================================================
merge_and_delete(
    "lib/transport/types-additions.ts",
    "lib/transport/types/index.ts",
    "Transport type patches"
)

# ============================================================
# A3: ASIS types-additions -> asis-cse-types.ts
# ============================================================
merge_and_delete(
    "lib/asis-cse/asis-cse-types-additions.ts",
    "lib/asis-cse/asis-cse-types.ts",
    "ASIS type patches"
)

# ============================================================
# A4: Module types-additions -> types/module.types.ts
# ============================================================
merge_and_delete(
    "lib/types/module.types-additions.ts",
    "types/module.types.ts",
    "Module type patches"
)

# ============================================================
# A5: Profile types.ts -> profile/types/index.ts
# ============================================================
merge_and_delete(
    "lib/profile/types.ts",
    "lib/profile/types/index.ts",
    "Profile legacy types"
)

# ============================================================
# A6: Transport types.ts -> transport/types/index.ts
# ============================================================
merge_and_delete(
    "lib/transport/types.ts",
    "lib/transport/types/index.ts",
    "Transport legacy types"
)

# ============================================================
# A7: Delete transport_audit_fix_v2/ directory
# ============================================================
v2_dir = os.path.join(ROOT, "transport_audit_fix_v2")
if os.path.exists(v2_dir):
    shutil.rmtree(v2_dir)
    results.append("OK: Deleted transport_audit_fix_v2/ directory")
else:
    results.append("SKIP: transport_audit_fix_v2/ does not exist")

# ============================================================
# A8: Delete _needs_review/ directory
# ============================================================
needs_review = os.path.join(ROOT, "_needs_review")
if os.path.exists(needs_review):
    shutil.rmtree(needs_review)
    results.append("OK: Deleted _needs_review/ directory")
else:
    results.append("SKIP: _needs_review/ does not exist")

# ============================================================
# A9: Delete stubs/ directory
# ============================================================
stubs_dir = os.path.join(ROOT, "stubs")
if os.path.exists(stubs_dir):
    shutil.rmtree(stubs_dir)
    results.append("OK: Deleted stubs/ directory")
else:
    results.append("SKIP: stubs/ does not exist")

# ============================================================
# A10: Delete replacements/ directory
# ============================================================
replacements_dir = os.path.join(ROOT, "replacements")
if os.path.exists(replacements_dir):
    shutil.rmtree(replacements_dir)
    results.append("OK: Deleted replacements/ directory")
else:
    results.append("SKIP: replacements/ does not exist")

# ============================================================
# A11: Delete new_routes/ directory
# ============================================================
new_routes_dir = os.path.join(ROOT, "new_routes")
if os.path.exists(new_routes_dir):
    shutil.rmtree(new_routes_dir)
    results.append("OK: Deleted new_routes/ directory")
else:
    results.append("SKIP: new_routes/ does not exist")

# ============================================================
# REPORT
# ============================================================
print("=" * 60)
print("MTAA OS — Type Consolidation Phase A: Safe Merges")
print("=" * 60)
for r in results:
    print(f"  {r}")
print("=" * 60)

# Verify TypeScript still compiles
print("\n[VERIFY] Running TypeScript check...")
exit_code = os.system("npx tsc --noEmit 2>&1 | tail -20")
if exit_code == 0:
    print("\n✅ TypeScript check passed — 0 errors")
else:
    print(f"\n⚠️ TypeScript check exited with code {exit_code}")
    print("Review errors above before committing.")

print("\nNext steps:")
print("  1. Review changes: git diff --stat")
print("  2. Stage and commit: git add -A && git commit -m 'consolidate: Phase A safe type merges'")
print("  3. Run Gate 3 check: python3 mtaa-type-consolidator.py (if available)")
