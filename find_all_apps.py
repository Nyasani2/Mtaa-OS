#!/usr/bin/env python3
import os

def find_all(root="."):
    result = []
    for rd, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in ['node_modules','.git','.expo','dist','build']]
        for f in files:
            if f.endswith(('.tsx','.ts','.jsx','.js')):
                result.append(os.path.join(rd, f))
    return sorted(result)

files = find_all(".")
print("="*70)
print("COMPLETE APP FINDER — " + str(len(files)) + " files total")
print("="*70)

apps = ["mtaxi","mtruck","marketplace","jobs","shop","education","messages",
        "calls","tv","feed","command","treasury","revenue","police","courts",
        "ports","boda","taxi","truck","commerce","communication","civic",
        "work","social","media","local","utility"]

for app in apps:
    m = [f for f in files if app.lower() in f.lower()]
    if m:
        print(f"\n✅ {app.upper()} — {len(m)} files:")
        for f in m[:12]: print(f"    {f}")
        if len(m)>12: print(f"    ... +{len(m)-12} more")

print("\n" + "="*70)
print("ROUTE GROUPS:")
print("="*70)
if os.path.exists("app"):
    for item in sorted(os.listdir("app")):
        p = os.path.join("app", item)
        if os.path.isdir(p) and not item.startswith('.'):
            c = len([f for f in files if f.startswith(p+os.sep)])
            print(f"  📁 app/{item}/ — {c} files")

print("\n" + "="*70)
print("DOMAINS:")
print("="*70)
if os.path.exists("domains"):
    for d in sorted(os.listdir("domains")):
        p = os.path.join("domains", d)
        if os.path.isdir(p) and not d.startswith('.'):
            c = len([f for f in files if f.startswith(p+os.sep)])
            if c: print(f"  ✅ domains/{d}/ — {c} files")

print("\n" + "="*70)
