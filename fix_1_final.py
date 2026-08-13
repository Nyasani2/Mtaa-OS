#!/usr/bin/env python3
"""MTAA OS V10 — FINAL FIX: 1 error"""
import os, subprocess

ROOT = os.getcwd()

def read(p):
    fp = os.path.join(ROOT, p)
    return open(fp, 'r', encoding='utf-8').read() if os.path.exists(fp) else None

def write(p, c):
    fp = os.path.join(ROOT, p)
    open(fp, 'w', encoding='utf-8').write(c)
    print(f'[FIXED] {p}')

print('=' * 70)
print('MTAA OS V10 — FINAL FIX')
print('=' * 70)

f = read('lib/mtruck/services/shipper-service.ts')
if f:
    f = f.replace('updatedAt', 'updated_at')
    write('lib/mtruck/services/shipper-service.ts', f)

print('\n' + '=' * 70)
print('Running tsc --noEmit...')
print('=' * 70)
r = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True)
errs = [ln for ln in (r.stdout + r.stderr).splitlines() if 'error TS' in ln]
print(f'Remaining errors: {len(errs)}')
if errs:
    for e in errs[:10]: print('  ', e)
else:
    print('✅✅✅ ZERO TypeScript errors! ✅✅✅')
    print('MTAA OS V10 is deployment-ready.')
print('=' * 70)