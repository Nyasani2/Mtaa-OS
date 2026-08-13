#!/usr/bin/env python3
"""MTAA OS V10 — Schema-to-Type Sync Check. Finds old table name references."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OLD_NAMES = {
    'rides': 'mtaxi_rides',
    'vehicles': 'mtaxi_vehicles',
    'trucks': 'mtruck_trucks',
    'shop_products': 'shop_items',
    'streets': 'streets_posts',
    'patients': 'health_patients',
    'civic_cases': 'court_cases',
}

def scan():
    mismatches = []
    for dirpath, _, filenames in os.walk(ROOT):
        if any(skip in dirpath for skip in ['node_modules', '.expo', '.git', 'backups', 'archive']): continue
        for fn in filenames:
            if not fn.endswith(('.ts', '.tsx')): continue
            fp = os.path.join(dirpath, fn)
            with open(fp, 'r', encoding='utf-8') as f: content = f.read()
            for old, new in OLD_NAMES.items():
                pattern = rf"\.from\(['"]{old}['"]\)"
                if re.search(pattern, content):
                    mismatches.append(f"{os.path.relpath(fp, ROOT)}: uses '{old}' → should be '{new}'")
    return mismatches

def main():
    print('=' * 65)
    print('MTAA OS V10 — Schema-to-Type Sync Check')
    print('=' * 65)
    mismatches = scan()
    if not mismatches:
        print('✅ No schema naming mismatches found.')
        sys.exit(0)
    print(f'⚠️  Found {len(mismatches)} mismatch(es):\n')
    for m in mismatches[:20]: print(f'  {m}')
    if len(mismatches) > 20: print(f'  ... and {len(mismatches)-20} more')
    print('\nFix: Update .from() calls to use correct table names.')
    sys.exit(1)

if __name__ == '__main__':
    main()