#!/usr/bin/env python3
"""
Auto-fix pin-engine imports in app/(os)/settings/pin.tsx
Replaces named imports with pinEngine object method calls.
"""

import re
import sys

FILE_PATH = "app/(os)/settings/pin.tsx"

try:
    with open(FILE_PATH, "r") as f:
        content = f.read()
except FileNotFoundError:
    print(f"ERROR: {FILE_PATH} not found")
    sys.exit(1)

# Step 1: Replace the import line
old_import = 'import { hasPin, verifyPin, clearPin, setPin } from '@/lib/security/pin-engine';'
new_import = 'import { pinEngine } from '@/lib/security/pin-engine';'

if old_import in content:
    content = content.replace(old_import, new_import)
    print("[1/5] Fixed import line")
else:
    # Try with double quotes
    old_import2 = 'import { hasPin, verifyPin, clearPin, setPin } from "@/lib/security/pin-engine";'
    if old_import2 in content:
        content = content.replace(old_import2, new_import.replace("'", '"'))
        print("[1/5] Fixed import line (double quotes)")
    else:
        print("[1/5] WARNING: Import line not found exactly — may need manual check")

# Step 2: Replace function calls
replacements = [
    (r'\bhasPin\(', 'pinEngine.hasPin('),
    (r'\bverifyPin\(', 'pinEngine.verifyPin('),
    (r'\bclearPin\(', 'pinEngine.clearPin('),
    (r'\bsetPin\(', 'pinEngine.setPin('),
]

for pattern, replacement in replacements:
    content, count = re.subn(pattern, replacement, content)
    if count > 0:
        print(f"[2-5/5] Replaced {count} call(s): {pattern} → {replacement}")

with open(FILE_PATH, "w") as f:
    f.write(content)

print(f"\nDone. {FILE_PATH} updated.")
print("Review the file to ensure no unintended replacements occurred.")
