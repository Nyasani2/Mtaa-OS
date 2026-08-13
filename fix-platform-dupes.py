#!/usr/bin/env python3
"""
Fix duplicate Platform imports in streets/index.tsx.
Platform is already imported from 'react-native' — remove it from all other imports.
"""
import sys

filepath = "app/(os)/streets/index.tsx"
try:
    with open(filepath, "r") as f:
        lines = f.readlines()
except FileNotFoundError:
    print("ERROR: " + filepath + " not found")
    sys.exit(1)

fixed = []
changes = []
for i, line in enumerate(lines, 1):
    original = line.rstrip('\n')
    # If line imports Platform AND is NOT from react-native, remove Platform
    if 'Platform' in line and 'from' in line and 'react-native' not in line:
        # Replace "{ Platform, " with "{ " 
        new_line = line.replace('{ Platform, ', '{ ')
        # Also handle "{ Platform }" case (no comma)
        new_line = new_line.replace('{ Platform }', '{ }')
        if new_line != line:
            changes.append(f"Line {i}: removed Platform from: {original.strip()}")
            line = new_line
    fixed.append(line)

with open(filepath, "w") as f:
    f.writelines(fixed)

if changes:
    print("Fixed Platform duplicates:")
    for c in changes:
        print("  " + c)
else:
    print("No Platform duplicates found.")

print("\nVerify:")
print("  head -20 app/(os)/streets/index.tsx")
