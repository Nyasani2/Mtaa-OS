#!/usr/bin/env python3
"""MTAA OS V10 — Module Isolation Guard. Blocks cross-domain imports."""
import os, re, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINS = ['education', 'health', 'wallet', 'mtruck', 'mtaxi', 'shop', 'marketplace',
    'tribes', 'streets', 'studio', 'jobs', 'garage', 'restaurant', 'civic',
    'police', 'courts', 'prisons', 'treasury', 'regulatory', 'phone', 'stay',
    'hookup', 'commerce', 'work', 'finance', 'device', 'driver', 'local',
    'mboda', 'agent', 'media', 'communication', 'social', 'admin']

def get_domain(file_path):
    rel = os.path.relpath(file_path, ROOT)
    m = re.search(r"app/\(([^)]+)\)/", rel)
    if m: return m.group(1)
    m = re.search(r"domains/([^/]+)/", rel)
    if m: return m.group(1)
    for d in DOMAINS:
        if f'lib/{d}/' in rel or f'lib/mt{d}/' in rel: return d
    return None

def scan_imports():
    violations = []
    for dirpath, _, filenames in os.walk(ROOT):
        if any(skip in dirpath for skip in ['node_modules', '.expo', '.git', 'backups', 'archive', '.backup']): continue
        for fn in filenames:
            if not fn.endswith(('.ts', '.tsx')): continue
            fp = os.path.join(dirpath, fn)
            owner = get_domain(fp)
            if not owner: continue
            with open(fp, 'r', encoding='utf-8') as f: lines = f.readlines()
            for i, line in enumerate(lines, 1):
                m = re.search(r"from\s+['"]@/([^'"]+)['"]", line)
                if not m: continue
                import_path = m.group(1)
                for other in DOMAINS:
                    if other == owner: continue
                    if re.search(rf"(^|/)(domains|app/\(|lib/){other}(/|$)", import_path):
                        if 'types/' in import_path or 'constants/' in import_path: continue
                        violations.append({'file': os.path.relpath(fp, ROOT), 'line': i, 'owner': owner,
                            'imports_from': other, 'import_path': import_path})
    return violations

def main():
    print('=' * 65)
    print('MTAA OS V10 — Module Isolation Guard')
    print('=' * 65)
    violations = scan_imports()
    if not violations:
        print('✅ No cross-domain import violations found.')
        sys.exit(0)
    print(f'❌ Found {len(violations)} cross-domain import violation(s):\n')
    by_owner = defaultdict(list)
    for v in violations: by_owner[v['owner']].append(v)
    for owner, vs in sorted(by_owner.items()):
        print(f'  📦 {owner}')
        for v in vs[:5]:
            print(f"     {v['file']}:{v['line']} imports from '{v['import_path']}' ({v['imports_from']})")
        if len(vs) > 5: print(f'     ... and {len(vs)-5} more')
    print()
    print('Fix: Move shared code to lib/shared/ or types/')
    sys.exit(1)

if __name__ == '__main__':
    main()