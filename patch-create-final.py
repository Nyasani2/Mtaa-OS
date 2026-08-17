import re
p = "app/(commerce)/shop/create.tsx"
s = open(p).read()

m1 = re.search(r"from\('shops'\)\.insert\(\{[\s\S]*?\}\)", s)
m2 = re.search(r"from\('shop_staff'\)\.insert\(\{[\s\S]*?\}\)", s)
print("OLD shops insert:", m1.group(0)[:220] if m1 else "NOT FOUND")
print("OLD staff insert:", m2.group(0)[:220] if m2 else "NOT FOUND")

s2 = s
if m1:
    s2 = s2.replace(m1.group(0), """from('shops').insert({
        name: name.trim(), category: type, address: location.trim() || null,
        city: location.trim() || null, description: description.trim() || null,
        owner_id: user.id, status: 'open', is_active: true, is_verified: false,
      })""")
if m2:
    s2 = s2.replace(m2.group(0), """from('shop_staff').insert({
        shop_id: data.id, user_id: user.id,
        full_name: (user as any)?.email?.split('@')[0] || 'Owner',
        role_name: 'owner', is_active: true, joined_at: new Date().toISOString(),
      })""")
open(p, "w").write(s2)
print("✅ create.tsx rewritten to real schema" if s2 != s else "❌ NO CHANGE")
