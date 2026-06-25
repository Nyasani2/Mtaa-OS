#!/usr/bin/env python3
import os
print("="*60); print("MTAA PROFILE AUDIT"); print("="*60)
print("\n📱 PROFILE SCREENS:")
for root,dirs,files in os.walk('app'):
    for f in files:
        if 'profile' in f.lower() and f.endswith('.tsx'):
            p=os.path.join(root,f); print(f"  ✅ {p} ({os.path.getsize(p)} bytes)")
print("\n🔧 PROFILE SERVICES/HOOKS:")
for root,dirs,files in os.walk('lib'):
    for f in files:
        if 'profile' in f.lower() and f.endswith('.ts'):
            p=os.path.join(root,f); print(f"  ✅ {p} ({os.path.getsize(p)} bytes)")
print("\n📊 PROFILE TABLES (in SQL files):")
for t in ['profiles','user_profiles','creator_profiles','business_profiles','profile_verifications','profile_followers','profile_following']:
    found=False
    for r,d,fl in os.walk('.'):
        for f in fl:
            if f.endswith('.sql'):
                try:
                    with open(os.path.join(r,f),'r',errors='ignore') as fh:
                        if t in fh.read(): found=True; break
                except: pass
        if found: break
    print(f"  {'✅' if found else '❌'} {t}")
print("\n🔗 STREETS → PROFILE:")
for r,d,fl in os.walk('lib/services'):
    for f in fl:
        if 'streets' in f.lower() and f.endswith('.ts'):
            p=os.path.join(r,f)
            with open(p,'r',errors='ignore') as fh:
                c=fh.read()
                print(f"  {'✅' if 'creator_id' in c or 'profile' in c.lower() else '⚠️'} {p}")
print("\n"+"="*60)
