#!/usr/bin/env python3
import os
def list_files(path, max_depth=3):
    if not os.path.exists(path): return []
    result = []
    for root, dirs, files in os.walk(path):
        depth = root[len(path):].count(os.sep)
        if depth <= max_depth:
            for f in files:
                if f.endswith(('.tsx','.ts','.jsx','.js')):
                    result.append(os.path.join(root, f))
    return sorted(result)
def check_placeholders(fp):
    try:
        with open(fp,'r',encoding='utf-8',errors='ignore') as f:
            c = f.read().lower()
            return [p for p in ['coming soon','placeholder','not implemented','todo:','fixme'] if p in c]
    except: return []
print("="*60); print("MTAA OS V10 AUDIT"); print("="*60)
print("\n📱 OS ROUTES:"); [print(f"  {f}") for f in list_files("app/(os)",3)]
print("\n📊 BY MODULE:")
if os.path.exists("app/(os)"):
    for i in sorted(os.listdir("app/(os)")):
        p=os.path.join("app/(os)",i)
        if os.path.isdir(p): print(f"  {i}: {len(list_files(p,2))} files")
print("\n⚠️ PLACEHOLDERS:")
for f in list_files("app",5)+list_files("lib",5)+list_files("domains",5):
    ph=check_placeholders(f)
    if ph: print(f"  {f} → {', '.join(ph)}")
print("\n🔍 APP CHECK:")
for a in ["streets","wallet","health","settings","appstore","mtaxi","mtruck","marketplace","jobs","shop","education","tribes","messages","calls","mtaa-tv","studio","feed","command-centre","treasury","revenue","police","courts","ports"]:
    p=f"app/(os)/{a}"; e=os.path.exists(p); print(f"  {'✅' if e else '❌'} {a} ({len(list_files(p,2)) if e else 0} files)")
print("\n"+"="*60)
