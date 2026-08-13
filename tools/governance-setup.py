#!/usr/bin/env python3
"""MTAA OS V10 — Governance Setup. Run once."""
import os, json, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUSKY_DIR = os.path.join(ROOT, '.husky')
PRE_COMMIT = os.path.join(HUSKY_DIR, 'pre-commit')
PACKAGE_JSON = os.path.join(ROOT, 'package.json')

def ensure_dir(d):
    os.makedirs(d, exist_ok=True)

def setup_husky():
    ensure_dir(HUSKY_DIR)
    lines = [
        '#!/bin/sh',
        '# MTAA OS V10 — Pre-Commit Gate',
        '. "$(dirname "$0")/_/husky.sh"',
        'echo "🔒 MTAA OS Pre-Commit Gate"',
        'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"',
        'echo "[1/4] TypeScript check..."',
        'npx tsc --noEmit',
        'if [ $? -ne 0 ]; then',
        '  echo "❌ TypeScript errors found. Commit BLOCKED."',
        '  exit 1',
        'fi',
        'echo "✅ TypeScript clean"',
        'echo "[2/4] Lint check..."',
        'npm run lint',
        'if [ $? -ne 0 ]; then',
        '  echo "❌ Lint errors found. Commit BLOCKED."',
        '  exit 1',
        'fi',
        'echo "✅ Lint clean"',
        'echo "[3/4] Type consolidation check..."',
        'python3 tools/type-consolidation-audit.py --check-only',
        'if [ $? -ne 0 ]; then',
        '  echo "❌ Duplicate types found. Commit BLOCKED."',
        '  exit 1',
        'fi',
        'echo "✅ Types consolidated"',
        'echo "[4/4] Module isolation check..."',
        'python3 tools/module-isolation-guard.py',
        'if [ $? -ne 0 ]; then',
        '  echo "❌ Cross-domain imports found. Commit BLOCKED."',
        '  exit 1',
        'fi',
        'echo "✅ Module isolation clean"',
        'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"',
        'echo "🚀 All gates passed. Commit allowed."',
    ]
    with open(PRE_COMMIT, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    os.chmod(PRE_COMMIT, 0o755)
    print(f'[INSTALLED] {PRE_COMMIT}')

def setup_package_json():
    if not os.path.exists(PACKAGE_JSON):
        print('[SKIP] package.json not found'); return
    with open(PACKAGE_JSON, 'r') as f:
        pkg = json.load(f)
    scripts = pkg.get('scripts', {})
    scripts['type-check'] = 'npx tsc --noEmit'
    scripts['type-check:watch'] = 'npx tsc --noEmit --watch'
    scripts['governance:audit'] = 'python3 tools/type-consolidation-audit.py --check-only && python3 tools/module-isolation-guard.py'
    scripts['governance:fix'] = 'python3 tools/type-consolidation-audit.py --fix && python3 tools/barrel-generator.py'
    scripts['barrels'] = 'python3 tools/barrel-generator.py'
    pkg['scripts'] = scripts
    with open(PACKAGE_JSON, 'w') as f:
        json.dump(pkg, f, indent=2)
    print(f'[UPDATED] {PACKAGE_JSON} scripts')

def install_husky_npm():
    print('[INFO] Installing husky...')
    r = subprocess.run(['npm', 'install', 'husky', '--save-dev'], cwd=ROOT, capture_output=True)
    if r.returncode != 0:
        print('[WARN] npm install husky failed. Run manually.')
    r2 = subprocess.run(['npx', 'husky', 'install'], cwd=ROOT, capture_output=True)
    if r2.returncode != 0:
        print('[WARN] npx husky install failed. Run manually.')
    else:
        print('[INSTALLED] husky')

if __name__ == '__main__':
    print('=' * 60)
    print('MTAA OS V10 — Governance Setup')
    print('=' * 60)
    setup_husky()
    setup_package_json()
    install_husky_npm()
    print('=' * 60)
    print("Done. Run 'npm run governance:audit' anytime.")
    print('=' * 60)