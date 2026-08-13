#!/usr/bin/env python3
"""MTAA OS V10 — Batch 12: Final 5-Error Sweep"""
import os, re, subprocess, sys

ROOT = os.getcwd()

def read(p):
    fp = os.path.join(ROOT, p)
    return open(fp, 'r', encoding='utf-8').read() if os.path.exists(fp) else None

def write(p, c):
    fp = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w', encoding='utf-8').write(c)
    print(f'[FIXED] {p}')

print('=' * 70)
print('MTAA OS V10 — Batch 12: Final 5-Error Sweep')
print('=' * 70)

# --- FIX 1: Add status to Load and Truck ---
f = read('lib/mtruck/types.ts')
if f:
    # Add status to Load interface
    f = f.replace('export interface Load {', 'export interface Load {\n  status: string;')
    # Add status to Truck interface
    f = f.replace('export interface Truck {', 'export interface Truck {\n  status: string;')
    write('lib/mtruck/types.ts', f)

# --- FIX 2: shipper-service.ts createdAt ---
f = read('lib/mtruck/services/shipper-service.ts')
if f:
    f = f.replace('createdAt', 'created_at')
    write('lib/mtruck/services/shipper-service.ts', f)

print('\n' + '=' * 70)
print('Batch 12 applied. Running tsc --noEmit...')
print('=' * 70)
r = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True)
errs = [ln for ln in (r.stdout + r.stderr).splitlines() if 'error TS' in ln]
print(f'Remaining errors: {len(errs)}')
if errs:
    for e in errs[:30]: print('  ', e)
    if len(errs) > 30: print(f'  ... and {len(errs)-30} more')
else: print('✅ ZERO TypeScript errors!')
print('=' * 70)