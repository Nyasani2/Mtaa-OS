#!/usr/bin/env python3
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
path = "lib/auth/store/auth.store.ts"

with open(path, 'r') as f:
    lines = f.readlines()
content = ''.join(lines)

# ── DIAGNOSTIC: show where these symbols currently live ──
print("=== getDisplayName occurrences ===")
for i, l in enumerate(lines):
    if 'getDisplayName' in l:
        print(f"  {i+1}: {l.rstrip()}")
print("=== updateLastActive occurrences ===")
for i, l in enumerate(lines):
    if 'updateLastActive' in l:
        print(f"  {i+1}: {l.rstrip()}")

# Implementation form is:  getDisplayName: () => {
# Interface form is:       getDisplayName: () => string | null;
impl_present = re.search(r'getDisplayName:\s*\(\)\s*=>\s*\{', content)

if impl_present:
    print("\nGetter IMPLEMENTATIONS already present in the store object.")
else:
    # Find the updateLastActive IMPLEMENTATION line: () => {
    idx = None
    for i, l in enumerate(lines):
        if re.search(r'updateLastActive:\s*\(\)\s*=>\s*\{', l):
            idx = i
            break

    if idx is None:
        print("\nERROR: could not locate updateLastActive implementation.")
    else:
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        pad = ' ' * indent
        getters = [
            pad + "getDisplayName: () => {\n",
            pad + "  const p = get().profile;\n",
            pad + "  const u = get().user;\n",
            pad + "  return (p as any)?.display_name || (p as any)?.full_name || u?.email?.split('@')[0] || 'User';\n",
            pad + "},\n",
            pad + "getAvatarUrl: () => {\n",
            pad + "  return (get().profile as any)?.avatar_url || null;\n",
            pad + "},\n",
            pad + "getUserRole: () => {\n",
            pad + "  return (get().profile as any)?.role || 'user';\n",
            pad + "},\n",
        ]
        with open(path, 'w') as f:
            f.writelines(lines[:idx] + getters + lines[idx:])
        print(f"\nInserted 3 getter implementations before updateLastActive (line {idx+1}).")
