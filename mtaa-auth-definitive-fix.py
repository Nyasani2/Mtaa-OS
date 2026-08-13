#!/usr/bin/env python3
"""
MTAA Auth Definitive Fix — Run from ~/MTAA_OS_V10
This script surgically fixes every remaining auth issue.
"""

import os
import re

BASE = os.getcwd()
fixes_applied = []
errors = []

def fix_file(path, replacements, description):
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        errors.append(f"MISSING: {path}")
        return
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(content)
        fixes_applied.append(description)
    else:
        fixes_applied.append(f"{description} — already clean or pattern not found")

# ── 1. Fix useAuth.ts — remove profile and refreshSession ──
fix_file('lib/auth/useAuth.ts', [
    ('profile: store.profile,', '    // profile removed — does not exist in store'),
    ('refreshSession: store.refreshSession,', '    // refreshSession removed — does not exist in store'),
], "useAuth.ts: removed profile/refreshSession")

# ── 2. Fix OS Gate — add pinSet enforcement ──
fix_file('lib/auth/os-gate.tsx', [
    ("const { user, isLoading } = useAuthStore();", "const { user, isLoading, pinSet } = useAuthStore();"),
    ("    if (isLoading) return;", """    if (isLoading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    // Recovery mode — never redirect away from password reset
    const inRecovery = typeof window !== 'undefined' && sessionStorage.getItem('mtaa_in_recovery') === 'true';
    if (inRecovery) {
      if (pathname !== '/update-password') {
        sessionStorage.removeItem('mtaa_in_recovery');
      } else {
        return;
      }
    }"""),
    ("    // ── Not logged in ──", """    // ── Not authenticated ──
    if (!user) {
      if (!isAuthRoute) router.replace('/login');
      return;
    }

    // ── Authenticated but no PIN ──
    if (!pinSet) {
      if (pathname !== '/create-pin') router.replace('/create-pin');
      return;
    }

    // ── Logged in with PIN ──"),
    ("    if (!user) {
      if (!isAuthRoute) {
        router.replace('/login');
      }
      return;
    }

    // ── Logged in ──
    if (isAuthRoute) {
      // Don't bounce logged-in users away from auth routes immediately;
      // let the specific page handle its own logic (e.g. update-password)
      // EXCEPT for login/signup — those should redirect to home
      if (pathname === '/login' || pathname === '/signup') {
        router.replace('/');
      }
    }", """    if (isAuthRoute) {
      if (pathname === '/login' || pathname === '/signup') {
        router.replace('/(os)');
      }
    }"""),
], "os-gate.tsx: added pinSet + recovery + auth route handling")

# ── 3. Fix Profile sign out route ──
fix_file('app/(os)/profile/index.tsx', [
    ("router.replace('/auth/login');", "router.replace('/login');"),
], "profile/index.tsx: sign out route")

# ── 4. Fix Settings sign out route ──
fix_file('app/(os)/settings/profile.tsx', [
    ("router.replace('/auth');", "router.replace('/login');"),
], "settings/profile.tsx: sign out route")

# ── 5. Fix wallet useIdentity imports ──
wallet_files = [
    'app/(os)/wallet/banks.tsx',
    'app/(os)/wallet/escrow.tsx',
    'app/(os)/wallet/qr-scan.tsx',
    'app/(os)/wallet/qr.tsx',
    'app/(os)/wallet/savings-loans.tsx',
]
for wf in wallet_files:
    fix_file(wf, [
        ('import { useIdentity } from "@/lib/auth/store/auth.store";', 'import { useIdentity } from "@/lib/auth";'),
    ], f"{wf}: useIdentity import")

# ── 6. Global sweep — fix any remaining /auth/ prefixed routes in ALL app files ──
print("\n[6/6] Global sweep for remaining /auth/ routes...")
auth_route_patterns = [
    ("'/auth/login'", "'/login'"),
    ("'/auth/signup'", "'/signup'"),
    ("'/auth/forgot-password'", "'/forgot-password'"),
    ("'/auth/create-pin'", "'/create-pin'"),
    ("'/auth/verify-email'", "'/verify-email'"),
    ("router.replace('/auth')", "router.replace('/login')"),
]
for root, dirs, files in os.walk(os.path.join(BASE, 'app')):
    for fname in files:
        if fname.endswith(('.tsx', '.ts')):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for old, new in auth_route_patterns:
                content = content.replace(old, new)
            if content != original:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                rel = os.path.relpath(fpath, BASE)
                fixes_applied.append(f"{rel}: cleaned /auth/ route")

print("\n=== FIXES APPLIED ===")
for f in fixes_applied:
    print(f"  ✓ {f}")
if errors:
    print("\n=== ERRORS ===")
    for e in errors:
        print(f"  ✗ {e}")

# ── Verification ──
print("\n=== VERIFICATION ===")

# Check useAuth.ts
with open(os.path.join(BASE, 'lib/auth/useAuth.ts'), 'r') as f:
    ua = f.read()
if 'profile:' in ua or 'refreshSession:' in ua:
    print("  ✗ useAuth.ts STILL has profile/refreshSession")
else:
    print("  ✓ useAuth.ts clean")

# Check os-gate.tsx
with open(os.path.join(BASE, 'lib/auth/os-gate.tsx'), 'r') as f:
    og = f.read()
if 'pinSet' in og:
    print("  ✓ os-gate.tsx has pinSet check")
else:
    print("  ✗ os-gate.tsx missing pinSet")

# Check profile
with open(os.path.join(BASE, 'app/(os)/profile/index.tsx'), 'r') as f:
    pi = f.read()
if "'/auth/login'" in pi:
    print("  ✗ profile/index.tsx still has /auth/login")
else:
    print("  ✓ profile/index.tsx sign out route clean")

# Check settings
with open(os.path.join(BASE, 'app/(os)/settings/profile.tsx'), 'r') as f:
    sp = f.read()
if "router.replace('/auth')" in sp:
    print("  ✗ settings/profile.tsx still has /auth")
else:
    print("  ✓ settings/profile.tsx sign out route clean")

# Check wallet imports
broken = 0
for wf in wallet_files:
    with open(os.path.join(BASE, wf), 'r') as f:
        if 'auth/store/auth.store' in f.read():
            broken += 1
            print(f"  ✗ {wf} still broken")
if broken == 0:
    print("  ✓ All wallet useIdentity imports clean")

# Check remaining /auth/ routes
remaining = []
for root, dirs, files in os.walk(os.path.join(BASE, 'app')):
    for fname in files:
        if fname.endswith(('.tsx', '.ts')):
            fpath = os.path.join(root, fname)
            with open(fpath, 'r') as f:
                content = f.read()
            if "'/auth/login'" in content or "'/auth/signup'" in content or "'/auth/forgot-password'" in content or "'/auth/create-pin'" in content:
                remaining.append(os.path.relpath(fpath, BASE))
if remaining:
    print(f"  ⚠ {len(remaining)} files still have /auth/ routes:")
    for r in remaining[:5]:
        print(f"     {r}")
else:
    print("  ✓ No /auth/ routes remaining")

print("\nDone. Run: rm -rf .expo node_modules/.cache && npx expo start --clear")
