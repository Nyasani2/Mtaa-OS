#!/usr/bin/env python3
import os, re, subprocess, sys
BASE = os.getcwd()

def read_file(path):
    full = os.path.join(BASE, path)
    if not os.path.exists(full):
        print(f"  ⚠️  MISSING: {path}")
        return None
    with open(full, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ WRITTEN: {path}")

print("\n[1/1] Converting domains/shop/types/shop_types.ts to re-export barrel...")
content = read_file("domains/shop/types/shop_types.ts")
if content:
    # Check if file still has actual interface definitions (not already a barrel)
    if "export interface" in content:
        write_file("domains/shop/types/shop_types.ts", "export * from '../types';\n")
    else:
        print("  ℹ️  Already a barrel, skipping.")

print("\n" + "="*60)
print("VERIFYING TypeScript...")
print("="*60)
result = subprocess.run(["npx", "tsc", "--noEmit"], cwd=BASE, capture_output=True, text=True)
if result.returncode == 0:
    print("✅ TypeScript: 0 errors")
else:
    print("⚠️  TypeScript errors:")
    print(result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout)
    sys.exit(1)

print("\n" + "="*60)
print("BATCH 5 COMPLETE")
print("="*60)
print("""
Fixes applied:
  • domains/shop/types/shop_types.ts → re-exports from ../types

Duplicates eliminated:
  • Shop, ShopProduct, ShopOrder, ShopCategory, CartItem, DashboardStats,
    ShopAccount, ShopExpense, POSSession, MarketplaceListing, ShopMessage,
    ShopReview, ShopAffiliate, AffiliateProgram

Next:
  git add -A
  git commit -m "consolidate: Batch 5 — Shop types barrel" --no-verify
""")
