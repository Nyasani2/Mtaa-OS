#!/usr/bin/env python3
"""MTAA OS V10 — Batch 3.5b: Precise Syntax Repair"""
import os, re, subprocess

ROOT = os.getcwd()

def read(p):
    fp = os.path.join(ROOT, p)
    return open(fp, "r", encoding="utf-8").read() if os.path.exists(fp) else None

def write(p, c):
    fp = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w", encoding="utf-8").write(c)
    print(f"[FIXED] {p}")

print("=" * 65)
print("Batch 3.5b: Precise Syntax Repair")
print("=" * 65)

# === FILE 1: app-lock-provider.tsx ===
# Fix: useCallback closing parens are missing before semicolons
f = read("lib/security/app-lock-provider.tsx")
if f:
    # Remove any ts-nocheck we added (it won't help parse errors)
    f = f.replace("// @ts-nocheck\n", "")

    # Fix 1: `}, [session];` → `}, [session]);`
    f = f.replace("}, [session];", "}, [session]);")

    # Fix 2: `}, [isLocked, segments, router, shouldLock];` → `}, [isLocked, segments, router, shouldLock]);`
    f = f.replace("}, [isLocked, segments, router, shouldLock];", "}, [isLocked, segments, router, shouldLock]);")

    # Fix 3: `}, [];` → `}, []);`
    f = f.replace("}, [];", "}, []);")

    # Fix 4: The // @ts-ignore line 49 is inside the useCallback body which is wrong
    # It should be before the useEffect or useCallback, not inside
    # Remove the misplaced @ts-ignore
    f = f.replace("    // @ts-ignore\n  }, [isLocked", "  }, [isLocked")

    write("lib/security/app-lock-provider.tsx", f)

# === FILE 2: PaymentSelector.tsx ===
# Fix: Remove literal backslashes before quotes, fix unbalanced braces
f = read("lib/transport/components/PaymentSelector.tsx")
if f:
    # Remove ts-nocheck if present
    f = f.replace("// @ts-nocheck\n", "")

    # Fix literal backslash-quote sequences
    f = f.replace(r"\'", "'")
    f = f.replace(r'\"', '"')

    # Check if the file has balanced braces for StyleSheet.create
    lines = f.split("\n")

    # Find the StyleSheet.create block and ensure it closes properly
    in_stylesheet = False
    brace_count = 0
    stylesheet_start = -1
    stylesheet_end = -1

    for i, ln in enumerate(lines):
        if "StyleSheet.create(" in ln:
            in_stylesheet = True
            stylesheet_start = i
            brace_count += ln.count("{") - ln.count("}")
        elif in_stylesheet:
            brace_count += ln.count("{") - ln.count("}")
            if brace_count == 0 and ");" in ln:
                stylesheet_end = i
                break

    # If we can't find a proper close, rebuild the styles block
    if stylesheet_end == -1:
        # Find where StyleSheet.create starts and rebuild from there
        new_lines = []
        for i, ln in enumerate(lines):
            if "StyleSheet.create(" in ln:
                new_lines.append(ln)  # Keep the opening line
                # Add all style properties until we hit a corrupted line
                # Then add activeText and close properly
                new_lines.append("  container: { padding: 16, backgroundColor: '#1a1a2e', borderRadius: 12, marginVertical: 8 },")
                new_lines.append("  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },")
                new_lines.append("  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },")
                new_lines.append("  icon: { fontSize: 20, marginRight: 12 },")
                new_lines.append("  info: { flex: 1 },")
                new_lines.append("  label: { color: '#fff', fontSize: 15, fontWeight: '600' },")
                new_lines.append("  sub: { color: '#8892b0', fontSize: 12, marginTop: 2 },")
                new_lines.append("  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e94560' },")
                new_lines.append("  warn: { color: '#ff6b6b', fontSize: 12, marginTop: 8 },")
                new_lines.append("  activeText: { color: '#10B981', fontWeight: '700' },")
                new_lines.append("});")
                # Skip all lines until we find the component function or export
                break
            else:
                new_lines.append(ln)

        # Add the rest of the file (skip the corrupted styles block)
        found_close = False
        for j in range(i+1, len(lines)):
            if not found_close and ("export default" in lines[j] or "const PaymentSelector" in lines[j] or "function PaymentSelector" in lines[j]):
                found_close = True
            if found_close:
                new_lines.append(lines[j])

        f = "\n".join(new_lines)
    else:
        # The stylesheet block was found, just ensure activeText is valid
        # Check if activeText line exists and is valid
        for i in range(stylesheet_start, stylesheet_end + 1):
            if "activeText" in lines[i]:
                lines[i] = "  activeText: { color: '#10B981', fontWeight: '700' },"
                break
        f = "\n".join(lines)

    write("lib/transport/components/PaymentSelector.tsx", f)

print("\n" + "=" * 65)
print("Running tsc --noEmit...")
print("=" * 65)

r = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, text=True)
errs = [ln for ln in (r.stdout + r.stderr).splitlines() if "error TS" in ln]
print(f"Remaining errors: {len(errs)}")
if errs:
    for e in errs[:20]:
        print("  ", e)
else:
    print("✅ ZERO TypeScript errors!")
print("=" * 65)
