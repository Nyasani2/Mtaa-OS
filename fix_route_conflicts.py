#!/usr/bin/env python3
"""
MTAA OS V10 — Route Conflict Fixer
Detects and removes placeholder files that conflict with existing .tsx files.
In Expo Router, app/(group)/path/file.tsx and app/(group)/path/file/index.tsx
both resolve to the same route — this causes a crash.
"""

import os

conflicts_found = []

for root, dirs, files in os.walk('app'):
    for d in dirs:
        dir_path = os.path.join(root, d)
        index_path = os.path.join(dir_path, 'index.tsx')
        if os.path.exists(index_path):
            sibling_tsx = os.path.join(root, d + '.tsx')
            if os.path.exists(sibling_tsx):
                conflicts_found.append((sibling_tsx, index_path))

if not conflicts_found:
    print("No route conflicts found.")
else:
    print(f"Found {len(conflicts_found)} route conflict(s):\n")
    for sibling, index in conflicts_found:
        print(f"  CONFLICT: {sibling}")
        print(f"            {index}")
        print(f"  ACTION:   Removing placeholder {index}")
        os.remove(index)
        dir_of_index = os.path.dirname(index)
        if os.path.isdir(dir_of_index) and not os.listdir(dir_of_index):
            os.rmdir(dir_of_index)
            print(f"  ACTION:   Removed empty directory {dir_of_index}")
        print()
    print("Done! Restart Expo with --clear.")
