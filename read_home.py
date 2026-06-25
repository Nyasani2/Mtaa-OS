#!/usr/bin/env python3
import os
print("="*60); print("HOME & ASSETS AUDIT"); print("="*60)
for f in ["app/(os)/index.tsx","app/index.tsx","app/(tabs)/index.tsx","app/demo.tsx","app/(os)/launcher.tsx"]:
    if os.path.exists(f):
        print(f"\n✅ {f} ({os.path.getsize(f)} bytes):")
        with open(f,'r',errors='ignore') as fh:
            for i,l in enumerate(fh.readlines()[:25],1): print(f"  {i:2}: {l.rstrip()[:90]}")
    else: print(f"\n❌ {f} NOT FOUND")
print("\n🖼️ ASSETS:")
for root,dirs,files in os.walk("assets"):
    for f in sorted(files):
        if f.endswith(('.jpg','.jpeg','.png','.webp','.gif')):
            p=os.path.join(root,f); print(f"  {p} ({os.path.getsize(p)/1024:.1f} KB)")
print("\n🔍 BACKGROUND/HOME IMAGES:")
for root,dirs,files in os.walk("assets"):
    for f in files:
        if any(k in f.lower() for k in ['bg','background','hero','home','maasai','africa','landing']):
            p=os.path.join(root,f); print(f"  {p} ({os.path.getsize(p)/1024:.1f} KB)")
print("\n"+"="*60)
