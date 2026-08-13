#!/usr/bin/env python3
"""Fix broken route replacements from previous script"""
import re, os

def rf(p):
    with open(p, "r", encoding="utf-8") as f: return f.read()

def wf(p, c):
    with open(p, "w", encoding="utf-8") as f: f.write(c)
    print(f"  FIXED: {p}")

# ── FIX 1: marketplace/cart.tsx ──
try:
    c = rf("app/(commerce)/marketplace/cart.tsx")
    # Fix broken: router.push('/marketplace' as any') -> router.push('/marketplace')
    c = c.replace("router.push('/marketplace' as any')", "router.push('/marketplace')")
    c = c.replace('router.push("/marketplace" as any")', 'router.push("/marketplace")')
    # Fix any other broken patterns
    c = re.sub(r"router\.push\(['\"]([^'\"]+)['\"]\s+as\s+any['\"]\)", r'router.push("\1")', c)
    c = re.sub(r"router\.push\(`([^`]+)`\s+as\s+any\)", r'router.push(`\1`)', c)
    wf("app/(commerce)/marketplace/cart.tsx", c)
except Exception as e: print(f"  SKIP cart: {e}")

# ── FIX 2: marketplace/index.tsx ──
try:
    c = rf("app/(commerce)/marketplace/index.tsx")
    # Fix broken template literal: router.push(`/marketplace/listing/` as any${listing.id}`)
    c = re.sub(r"router\.push\(`([^`]+)`\s+as\s+any\$\{([^}]+)\}`\)", r'router.push(`\1${\2}`)', c)
    # Also fix plain string patterns
    c = re.sub(r"router\.push\(['\"]([^'\"]+)['\"]\s+as\s+any['\"]\)", r'router.push("\1")', c)
    wf("app/(commerce)/marketplace/index.tsx", c)
except Exception as e: print(f"  SKIP marketplace/index: {e}")

# ── FIX 3: marketplace/order-success.tsx ──
try:
    c = rf("app/(commerce)/marketplace/order-success.tsx")
    # Fix broken: router.push('/marketplace' as any/orders') -> router.push('/marketplace/orders')
    c = c.replace("router.push('/marketplace' as any/orders')", "router.push('/marketplace/orders')")
    c = c.replace("router.push('/marketplace' as any')", "router.push('/marketplace')")
    c = c.replace('router.push("/marketplace" as any/orders")', 'router.push("/marketplace/orders")')
    c = c.replace('router.push("/marketplace" as any")', 'router.push("/marketplace")')
    # General fix
    c = re.sub(r"router\.push\(['\"]([^'\"]+)['\"]\s+as\s+any['\"]\)", r'router.push("\1")', c)
    wf("app/(commerce)/marketplace/order-success.tsx", c)
except Exception as e: print(f"  SKIP order-success: {e}")

# ── FIX 4: education/analytics/index.tsx ──
try:
    c = rf("app/(education)/analytics/index.tsx")
    # Fix broken template literal
    c = re.sub(r"router\.push\(`([^`]+)`\s+as\s+any\$\{([^}]+)\}`\)", r'router.push(`\1${\2}`)', c)
    c = re.sub(r"router\.push\(['\"]([^'\"]+)['\"]\s+as\s+any['\"]\)", r'router.push("\1")', c)
    # Check for unclosed ScrollView
    scroll_opens = c.count('<ScrollView')
    scroll_closes = c.count('</ScrollView>')
    if scroll_opens > scroll_closes:
        # Add closing tag before the last closing View/fragment
        c = c.rstrip() + "\n    </ScrollView>\n"
    wf("app/(education)/analytics/index.tsx", c)
except Exception as e: print(f"  SKIP analytics: {e}")

# ── FIX 5: education/assignments/[id].tsx ──
try:
    c = rf("app/(education)/assignments/[id].tsx")
    # Fix broken template literal
    c = re.sub(r"router\.push\(`([^`]+)`\s+as\s+any\$\{([^}]+)\}`\)", r'router.push(`\1${\2}`)', c)
    c = re.sub(r"router\.push\(['\"]([^'\"]+)['\"]\s+as\s+any['\"]\)", r'router.push("\1")', c)
    # Check for unclosed ScrollView
    scroll_opens = c.count('<ScrollView')
    scroll_closes = c.count('</ScrollView>')
    if scroll_opens > scroll_closes:
        c = c.rstrip() + "\n    </ScrollView>\n"
    wf("app/(education)/assignments/[id].tsx", c)
except Exception as e: print(f"  SKIP assignments/[id]: {e}")

print("\nDone. Run: npx tsc --noEmit")
