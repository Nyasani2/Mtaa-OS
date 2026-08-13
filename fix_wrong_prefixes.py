#!/usr/bin/env python3
"""
MTAA OS V10 — Route Prefix Fix Script
Run from ~/MTAA_OS_V10
Fixes wrong-prefix navigation targets across all source files.
"""

import os
import re

FIXES = [
    # (bad_prefix, good_prefix, source_files)
    ("/(auth)/login", "/auth/login", [
        "app/(education)/register/parent.tsx",
        "app/(education)/register/teacher.tsx",
        "app/(education)/register/school.tsx",
        "app/(education)/register/student.tsx",
        "app/(os)/asis/chat.tsx",
    ]),
    ("/(auth)/register", "/auth/register", [
        "app/(education)/register/parent.tsx",
        "app/(education)/register/teacher.tsx",
        "app/(education)/register/school.tsx",
        "app/(education)/register/student.tsx",
    ]),
    ("/(auth)/forgot-password", "/auth/forgot-password", [
        "app/(education)/register/parent.tsx",
        "app/(education)/register/teacher.tsx",
        "app/(education)/register/school.tsx",
        "app/(education)/register/student.tsx",
    ]),
    ("/(auth)/verify-email", "/auth/verify-email", [
        "app/(education)/register/parent.tsx",
        "app/(education)/register/teacher.tsx",
        "app/(education)/register/school.tsx",
        "app/(education)/register/student.tsx",
    ]),
    ("/(auth)/set-pin", "/auth/set-pin", [
        "app/(os)/settings/security-center.tsx",
    ]),
    ("/(os)/wallet/pin", "/(os)/settings/pin", [
        "app/(os)/wallet/index.tsx",
    ]),
    ("/profile/pin", "/(os)/settings/pin", [
        "app/(os)/profile/index.tsx",
    ]),
    ("/profile/qr-code", "/(os)/profile/qr-code", [
        "app/(os)/profile/index.tsx",
    ]),
]

total_replacements = 0

for bad, good, files in FIXES:
    for filepath in files:
        full_path = os.path.join(os.getcwd(), filepath)
        if not os.path.exists(full_path):
            print(f"  SKIP (not found): {filepath}")
            continue

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content.replace(bad, good)

        if new_content != content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count = content.count(bad)
            total_replacements += count
            print(f"  FIXED {count}x in {filepath}: {bad} -> {good}")
        else:
            print(f"  OK (no match): {filepath}")

print(f"\nTotal replacements: {total_replacements}")
print("Done!")
