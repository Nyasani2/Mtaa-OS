#!/usr/bin/env python3
"""
Remove duplicate refreshProfile declaration from auth.store.ts
"""

filepath = 'lib/auth/store/auth.store.ts'

with open(filepath, 'r') as f:
    lines = f.readlines()

seen = set()
new_lines = []
removed = 0

for line in lines:
    stripped = line.strip()
    if stripped == 'refreshProfile: () => Promise<void>;':
        if stripped in seen:
            removed += 1
            continue
        seen.add(stripped)
    new_lines.append(line)

with open(filepath, 'w') as f:
    f.writelines(new_lines)

print(f"Removed {removed} duplicate refreshProfile declaration(s)")
print(f"File: {filepath}")
