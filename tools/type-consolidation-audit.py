#!/usr/bin/env python3
"""MTAA OS V10 — Type Consolidation Audit. Finds duplicate type declarations."""
import os, re, sys, argparse
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANONICAL = {
    'Profile': 'types/profile.ts',
    'AppManifest': 'types/module.types.ts',
    'HealthRole': 'types/health.ts',
    'StreetsPost': 'lib/services/streets-service.ts',
    'CartItem': 'types/commerce.ts',
    'Listing': 'types/commerce.ts',
    'ShippingAddress': 'types/commerce.ts',
    'ShopProduct': 'types/shop.ts',
    'ShopOrder': 'types/shop.ts',
    'TribePost': 'lib/tribes/types.ts',
    'TribeMember': 'lib/tribes/types.ts',
    'Driver': 'lib/mtruck/types.ts',
    'Truck': 'lib/mtruck/types.ts',
    'Load': 'lib/mtruck/types.ts',
    'FreightListing': 'lib/mtruck/types.ts',
    'FuelStation': 'lib/mtruck/types.ts',
    'Route': 'lib/mtruck/types.ts',
    'GeoPoint': 'lib/mtruck/types.ts',
    'TruckDocument': 'lib/mtruck/types.ts',
}

def scan_types():
    declarations = defaultdict(list)
    for dirpath, _, filenames in os.walk(ROOT):
        if any(skip in dirpath for skip in ['node_modules', '.expo', '.git', 'backups', 'archive', '.backup']):
            continue
        for fn in filenames:
            if not fn.endswith(('.ts', '.tsx')): continue
            fp = os.path.join(dirpath, fn)
            rel = os.path.relpath(fp, ROOT)
            try:
                with open(fp, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            except: continue
            for i, line in enumerate(lines, 1):
                m = re.match(r"^\s*export\s+(interface|type|class)\s+(\w+)", line)
                if m:
                    kind, name = m.groups()
                    declarations[name].append((rel, i, kind, line.strip()))
    return declarations

def find_duplicates(declarations):
    duplicates = {}
    for name, locs in declarations.items():
        if len(locs) > 1:
            real = [l for l in locs if l[2] in ('interface', 'class') or (l[2] == 'type' and '=' in l[3] and 'any' not in l[3])]
            aliases = [l for l in locs if l[2] == 'type' and 'any' in l[3]]
            if len(real) > 1 or aliases:
                duplicates[name] = {'locations': locs, 'real': real, 'aliases': aliases, 'canonical': CANONICAL.get(name)}
    return duplicates

def fix_aliases(duplicates):
    fixed = 0
    for name, info in duplicates.items():
        for rel, line_no, kind, text in info['aliases']:
            fp = os.path.join(ROOT, rel)
            with open(fp, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            new_lines = [ln for j, ln in enumerate(lines, 1) if j != line_no]
            with open(fp, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f'  [REMOVED] {rel}:{line_no} — {text}')
            fixed += 1
    return fixed

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--fix', action='store_true')
    args = parser.parse_args()
    print('=' * 65)
    print('MTAA OS V10 — Type Consolidation Audit')
    print('=' * 65)
    declarations = scan_types()
    duplicates = find_duplicates(declarations)
    if not duplicates:
        print('✅ No duplicate type declarations found.')
        sys.exit(0)
    print(f'⚠️  Found {len(duplicates)} duplicated type(s):\n')
    for name, info in sorted(duplicates.items()):
        print(f'  📛 {name}')
        if info['canonical']: print(f'     Canonical: {info["canonical"]}')
        for rel, line_no, kind, text in info['locations']:
            marker = '  ← ALIAS' if (kind == 'type' and 'any' in text) else ''
            print(f'     {rel}:{line_no}  ({kind}){marker}')
        print()
    if args.fix:
        print('[FIX MODE] Removing duplicate aliases...')
        fixed = fix_aliases(duplicates)
        print(f'✅ Removed {fixed} duplicate alias(es).')
        declarations = scan_types()
        duplicates = find_duplicates(declarations)
        if not duplicates:
            print('✅ All duplicates resolved.')
            sys.exit(0)
        print(f'⚠️  {len(duplicates)} type(s) still have multiple real declarations. Manual review needed.')
        for name in duplicates: print(f'   - {name}')
        sys.exit(1)
    if args.check_only:
        print('❌ Duplicate types found. Commit would be blocked.')
        sys.exit(1)
    print('Run with --fix to auto-remove aliases, or resolve manually.')
    sys.exit(1)

if __name__ == '__main__':
    main()