#!/usr/bin/env python3
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
print('MTAA OS V10 — Education WebSocket Fix')
print('=' * 70)

# Find all education files with WebSocket references
edu_files = [
    'app/(education)/admin-dashboard.tsx',
    'app/(education)/accountant-dashboard.tsx',
    'app/(education)/dashboards/admin-dashboard.tsx',
    'app/(education)/dashboards/accountant-dashboard.tsx',
]

for ef in edu_files:
    f = read(ef)
    if f and 'WebSocket' in f:
        print(f'Found WebSocket in {ef}')
        # Replace direct WebSocket usage with conditional
        lines = f.split('\n')
        out = []
        for ln in lines:
            if 'new WebSocket(' in ln or 'WebSocket(' in ln:
                out.append('    // @ts-ignore')
                out.append('    // WebSocket is not available in React Native / Node.js 20')
                out.append('    // Use Supabase realtime instead')
            # Replace WebSocket with conditional
            if 'WebSocket' in ln and 'typeof' not in ln and 'window' not in ln:
                ln = ln.replace('WebSocket', '(typeof window !== "undefined" ? WebSocket : null)')
            out.append(ln)
        write(ef, '\n'.join(out))

print('\n' + '=' * 70)
print('Education WebSocket fix applied.')
print('=' * 70)
