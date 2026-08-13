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
print('MTAA OS V10 — WebSocket Comprehensive Fix')
print('=' * 70)

# FIX 1: Remove realtime block from lib/supabase.ts
f = read('lib/supabase.ts')
if f:
    # Remove the realtime block entirely
    lines = f.split('\n')
    out = []
    in_realtime = False
    for ln in lines:
        if 'realtime:' in ln:
            in_realtime = True
            continue
        if in_realtime:
            if ln.strip() == '},':
                in_realtime = False
                continue
            # Also handle if it's just one line
            if 'transport' in ln and '},' in ln:
                in_realtime = False
                continue
            continue
        out.append(ln)

    # Also remove the ws import if present
    out2 = []
    for ln in out:
        if 'import ws' in ln or 'import WebSocket' in ln:
            continue
        out2.append(ln)

    write('lib/supabase.ts', '\n'.join(out2))

# FIX 2: Check lib/supabase/client.ts
f = read('lib/supabase/client.ts')
if f and ('realtime' in f or 'WebSocket' in f or 'ws' in f):
    lines = f.split('\n')
    out = []
    in_realtime = False
    for ln in lines:
        if 'realtime:' in ln:
            in_realtime = True
            continue
        if in_realtime:
            if ln.strip() == '},':
                in_realtime = False
                continue
            continue
        out.append(ln)

    out2 = []
    for ln in out:
        if 'import ws' in ln or 'import WebSocket' in ln:
            continue
        out2.append(ln)

    write('lib/supabase/client.ts', '\n'.join(out2))

# FIX 3: Search for any other WebSocket references in the codebase
print('\n[SCAN] Searching for WebSocket references...')
r = subprocess.run(['grep', '-rn', 'WebSocket', '--include=*.ts', '--include=*.tsx', 'lib/', 'app/', 'domains/'], 
                  cwd=ROOT, capture_output=True, text=True)
if r.stdout:
    print('Found WebSocket references:')
    for line in r.stdout.split('\n')[:20]:
        if line.strip():
            print(f'  {line}')
else:
    print('  No WebSocket references found.')

print('\n' + '=' * 70)
print('WebSocket fix applied. Restart your app.')
print('=' * 70)
