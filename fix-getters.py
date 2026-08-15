#!/usr/bin/env python3
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
path = "lib/auth/store/auth.store.ts"

with open(path, 'r') as f:
    lines = f.readlines()

content = ''.join(lines)
if 'getDisplayName:' in content:
    print("Getters already present — nothing to do.")
else:
    # Find the updateLastActive IMPLEMENTATION: () => {  (not the interface: () => void;)
    idx = None
    for i, line in enumerate(lines):
        if re.search(r'updateLastActive:\s*\(\)\s*=>\s*\{', line):
            idx = i
            break

    if idx is None:
        print("ERROR: could not locate updateLastActive implementation.")
    else:
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        pad = ' ' * indent
        getters = [
            f"{pad}getDisplayName: () => {{\n",
            f"{pad}  const p = get().profile;\n",
            f"{pad}  const u = get().user;\n",
            f"{pad}  return (p as any)?.display_name || (p as any)?.full_name || u?.email?.split('@')[0] || 'User';\n",
            f"{pad}}},\n",
            f"{pad}getAvatarUrl: () => {{\n",
            f"{pad}  return (get().profile as any)?.avatar_url || null;\n",
            f"{pad}}},\n",
            f"{pad}getUserRole: () => {{\n",
            f"{pad}  return (get().profile as any)?.role || 'user';\n",
            f"{pad}}},\n",
        ]
        with open(path, 'w') as f:
            f.writelines(lines[:idx] + getters + lines[idx:])
        print(f"FIXED: {path} — inserted 3 getters before updateLastActive (line {idx+1})")
