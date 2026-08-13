#!/usr/bin/env python3
"""MTAA OS V10 — Barrel File Generator. Auto-creates index.ts exports."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCLUDE_DIRS = {'node_modules', '.expo', '.git', 'backups', 'archive', '.backup', '__tests__', 'test'}
EXCLUDE_FILES = {'index.ts', 'index.tsx', 'types.ts', 'constants.ts'}

def should_barrel(dirpath):
    parts = dirpath.replace(ROOT, '').split(os.sep)
    return any(p in parts for p in ['services', 'hooks', 'components', 'controllers', 'state'])

def generate_barrel(dirpath):
    files = [f for f in os.listdir(dirpath) if f.endswith(('.ts', '.tsx')) and f not in EXCLUDE_FILES]
    if not files: return
    exports = []
    for fn in sorted(files):
        name = fn.replace('.tsx', '').replace('.ts', '')
        if name.startswith('_') or name.endswith('.test') or name.endswith('.spec'): continue
        exports.append(f"export * from './{name}';")
    if not exports: return
    barrel_path = os.path.join(dirpath, 'index.ts')
    content = '// Auto-generated barrel file\n' + '\n'.join(exports) + '\n'
    if os.path.exists(barrel_path):
        with open(barrel_path, 'r') as f: existing = f.read()
        if '// Auto-generated' not in existing and '// MTAA' not in existing:
            print(f'[SKIP] {barrel_path} — manually maintained')
            return
    with open(barrel_path, 'w') as f:
        f.write(content)
    print(f'[GENERATED] {barrel_path} ({len(exports)} exports)')

def main():
    print('=' * 65)
    print('MTAA OS V10 — Barrel Generator')
    print('=' * 65)
    generated = 0
    for dirpath, _, _ in os.walk(ROOT):
        if any(skip in dirpath for skip in EXCLUDE_DIRS): continue
        if should_barrel(dirpath):
            generate_barrel(dirpath)
            generated += 1
    print(f'✅ Scanned {generated} directories.')
    print('=' * 65)

if __name__ == '__main__':
    main()