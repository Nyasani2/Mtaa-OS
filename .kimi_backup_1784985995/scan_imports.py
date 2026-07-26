#!/usr/bin/env python3
"""
MTAA OS — Missing Import Scanner
Scans app/ and lib/ for imports that point to non-existent local files.
Skips node_modules, React, RN, and Expo packages.
"""

import os, re, sys
from pathlib import Path

# ── Config ──
PROJECT_ROOT = os.getcwd()
SEARCH_DIRS = ['app', 'lib']
SKIP_PACKAGES = {
    'react', 'react-native', 'react-native-safe-area-context', 'react-native-webview',
    'expo-router', 'expo-constants', 'expo-secure-store', 'expo-image-picker',
    'expo-notifications', 'expo-linking', 'expo-font', 'expo-splash-screen',
    'expo-status-bar', 'expo-updates', 'expo-auth-session', 'expo-web-browser',
    '@expo/vector-icons', '@expo/config-plugins', '@expo/prebuild-config',
    'zustand', 'axios', 'date-fns', 'lodash', 'uuid', 'base64-js',
    'typescript', 'tslib', '@types/react', '@types/react-native',
    'metro', 'metro-config', '@babel', 'babel-preset-expo',
    'jest', '@testing-library', 'eslint', 'prettier',
    'tailwindcss', 'nativewind', 'class-variance-authority', 'clsx', 'tailwind-merge',
    '@radix-ui', '@tanstack', 'react-query', '@react-navigation',
    'i18next', 'react-i18next', 'i18next-http-backend',
    'socket.io-client', '@supabase/supabase-js', '@supabase/realtime-js',
    'react-native-maps', 'react-native-gesture-handler', 'react-native-reanimated',
    'react-native-screens', 'react-native-svg', 'react-native-paper',
    'react-native-elements', 'react-native-vector-icons',
    '@stripe/stripe-react-native', '@react-native-async-storage/async-storage',
    'react-native-keychain', 'react-native-encrypted-storage',
    'react-native-image-picker', 'react-native-document-picker',
    'react-native-fs', 'react-native-share', 'react-native-webview',
    'react-native-linear-gradient', 'react-native-blur', 'lottie-react-native',
    'react-native-chart-kit', 'victory-native', 'react-native-calendars',
    'react-native-modal', 'react-native-toast-message', 'react-native-flash-message',
}

EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

# ── Helpers ──
def resolve_alias(import_path: str) -> list[str]:
    """Convert @/path to actual file paths to check."""
    if import_path.startswith('@/'):
        base = os.path.join(PROJECT_ROOT, import_path[2:])
    else:
        return []
    candidates = []
    for ext in EXTENSIONS:
        candidates.append(base + ext)
    candidates.append(os.path.join(base, 'index.tsx'))
    candidates.append(os.path.join(base, 'index.ts'))
    candidates.append(os.path.join(base, 'index.js'))
    return candidates

def resolve_relative(source_file: str, import_path: str) -> list[str]:
    """Convert ./path or ../path to actual file paths."""
    source_dir = os.path.dirname(source_file)
    target = os.path.normpath(os.path.join(source_dir, import_path))
    candidates = []
    for ext in EXTENSIONS:
        candidates.append(target + ext)
    candidates.append(os.path.join(target, 'index.tsx'))
    candidates.append(os.path.join(target, 'index.ts'))
    candidates.append(os.path.join(target, 'index.js'))
    return candidates

def is_package(name: str) -> bool:
    """Check if import is a known npm package."""
    root = name.split('/')[0]
    if root.startswith('@'):
        scope = '/'.join(name.split('/')[:2])
        return scope in SKIP_PACKAGES or name in SKIP_PACKAGES
    return root in SKIP_PACKAGES or name in SKIP_PACKAGES

def find_imports(filepath: str) -> list[tuple[int, str]]:
    """Extract (line_no, import_path) from a file."""
    imports = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                # import X from 'path'
                m = re.search(r"import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]", line)
                if m:
                    path = m.group(1)
                    if path.startswith('.') or path.startswith('@/'):
                        imports.append((i, path))
                # require('path')
                m2 = re.search(r"require\s*\(\s*['"]([^'"]+)['"]\s*\)", line)
                if m2:
                    path = m2.group(1)
                    if path.startswith('.') or path.startswith('@/'):
                        imports.append((i, path))
                # dynamic import
                m3 = re.search(r"import\s*\(\s*['"]([^'"]+)['"]\s*\)", line)
                if m3:
                    path = m3.group(1)
                    if path.startswith('.') or path.startswith('@/'):
                        imports.append((i, path))
    except Exception as e:
        print(f"  ⚠️  Could not read {filepath}: {e}")
    return imports

# ── Main ──
def main():
    print("═" * 70)
    print("  MTAA OS — Missing Import Scanner")
    print("  Project:", PROJECT_ROOT)
    print("  Scanning:", ', '.join(SEARCH_DIRS))
    print("═" * 70)

    missing = []
    checked = 0
    files_scanned = 0

    for search_dir in SEARCH_DIRS:
        dir_path = os.path.join(PROJECT_ROOT, search_dir)
        if not os.path.isdir(dir_path):
            print(f"  ⚠️  Directory not found: {search_dir}")
            continue

        for root, _, files in os.walk(dir_path):
            for fname in files:
                if not fname.endswith(('.ts', '.tsx', '.js', '.jsx')):
                    continue
                filepath = os.path.join(root, fname)
                files_scanned += 1
                imports = find_imports(filepath)
                for line_no, imp in imports:
                    checked += 1
                    if imp.startswith('@/'):
                        candidates = resolve_alias(imp)
                    else:
                        candidates = resolve_relative(filepath, imp)

                    found = any(os.path.exists(c) for c in candidates)
                    if not found:
                        missing.append((filepath, line_no, imp))

    print(f"
  Files scanned: {files_scanned}")
    print(f"  Imports checked: {checked}")
    print(f"  Missing imports: {len(missing)}")
    print("─" * 70)

    if not missing:
        print("
  ✅ ALL IMPORTS RESOLVED — no missing local modules!")
        return 0

    # Group by file
    by_file = {}
    for fp, ln, imp in missing:
        by_file.setdefault(fp, []).append((ln, imp))

    for fp in sorted(by_file):
        rel = os.path.relpath(fp, PROJECT_ROOT)
        print(f"
  ❌ {rel}")
        for ln, imp in by_file[fp]:
            print(f"      Line {ln}:  import from '{imp}'")

    print(f"
  Total missing: {len(missing)} import(s) across {len(by_file)} file(s)")
    return 1

if __name__ == '__main__':
    sys.exit(main())
