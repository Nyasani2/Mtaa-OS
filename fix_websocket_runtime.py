#!/usr/bin/env python3
import os, subprocess

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
print('MTAA OS V10 — WebSocket Runtime Fix')
print('=' * 70)

# Check if ws is installed
r = subprocess.run(['npm', 'list', 'ws'], cwd=ROOT, capture_output=True, text=True)
if 'ws@' not in r.stdout:
    print('[INFO] Installing ws package...')
    subprocess.run(['npm', 'install', 'ws'], cwd=ROOT)

# Fix lib/supabase.ts
supabase_file = 'lib/supabase.ts'
f = read(supabase_file)
if f:
    # Check if already fixed
    if 'require("ws")' in f or 'from "ws"' in f:
        print('[SKIP] lib/supabase.ts already has ws import')
    else:
        # Add ws import at the top
        import_line = 'import { createClient } from \'@supabase/supabase-js\';\n'
        ws_import = 'import ws from \'ws\';\n'

        if import_line in f:
            f = f.replace(import_line, import_line + ws_import)
        else:
            f = ws_import + f

        # Find the createClient call and add realtime transport
        # Look for the auth config block and add realtime after it
        if 'realtime:' not in f:
            # Add realtime config before the closing of the options object
            f = f.replace(
                'autoRefreshToken: true,',
                'autoRefreshToken: true,\n  },\n  realtime: {\n    transport: typeof window !== "undefined" ? undefined : ws,'
            )
            # Fix the double closing brace issue
            f = f.replace('},\n  },\n  realtime:', '},\n  realtime:')

        write(supabase_file, f)

# Alternative: if the above pattern doesn't match, just rewrite the file with safe defaults
f = read(supabase_file)
if f and 'createClient' in f and 'realtime' not in f:
    # Find where auth block ends and add realtime
    lines = f.split('\n')
    out = []
    auth_block_depth = 0
    added_realtime = False
    for i, ln in enumerate(lines):
        out.append(ln)
        if 'auth:' in ln:
            auth_block_depth = 1
        if auth_block_depth > 0:
            if '{' in ln:
                auth_block_depth += ln.count('{')
            if '}' in ln:
                auth_block_depth -= ln.count('}')
            if auth_block_depth == 0 and not added_realtime:
                # Add realtime block after auth block closes
                out.append('  realtime: {')
                out.append('    transport: typeof window !== "undefined" ? undefined : ws,')
                out.append('  },')
                added_realtime = True
    write(supabase_file, '\n'.join(out))

print('\n' + '=' * 70)
print('WebSocket fix applied.')
print('Run: npm install ws (if not already installed)')
print('=' * 70)
