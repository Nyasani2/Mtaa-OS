#!/usr/bin/env python3
"""
Surgical fix for streets/index.tsx import corruption.
Removes 'Platform, ' from imports that are NOT 'react-native'.
Leaves every other line untouched.
"""
import sys

filepath = 'app/(os)/streets/index.tsx'

try:
    with open(filepath, 'r') as f:
        lines = f.readlines()
except FileNotFoundError:
    print(f"ERROR: {filepath} not found")
    sys.exit(1)

fixed = []
changes = []
for i, line in enumerate(lines, 1):
    original = line
    # Only fix lines that have 'Platform, ' but are NOT from 'react-native'
    if 'Platform, ' in line and 'from' in line and 'react-native' not in line:
        line = line.replace('import { Platform, ', 'import { ')
        changes.append(f"Line {i}: removed Platform from import")
    fixed.append(line)

with open(filepath, 'w') as f:
    f.writelines(fixed)

if changes:
    print("Fixed imports:")
    for c in changes:
        print(f"  {c}")
else:
    print("No corrupted Platform imports found — file may already be clean.")

print("\nDone. Verify with:")
print("  head -12 app/(os)/streets/index.tsx")
