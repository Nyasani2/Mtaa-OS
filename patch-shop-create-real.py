p = "app/(commerce)/shop/create.tsx"
s = open(p).read()

old_shops = """      const { data, error } = await supabase.from('shops').insert({
        name: name.trim(), type, location: location.trim() || null,
        description: description.trim() || null, owner_id: user.id,
        status: 'open', verified: false,
      }).select().single();"""
new_shops = """      const { data, error } = await supabase.from('shops').insert({
        name: name.trim(), category: type, address: location.trim() || null,
        city: location.trim() || null, description: description.trim() || null,
        owner_id: user.id, status: 'open', is_verified: false, is_active: true,
      }).select().single();"""

old_staff = """      await supabase.from('shop_staff').insert({
        shop_id: data.id, user_id: user.id, role: 'owner', status: 'active',
      });"""
new_staff = """      await supabase.from('shop_staff').insert({
        shop_id: data.id, user_id: user.id,
        full_name: (user as any)?.email?.split('@')[0] || 'Owner',
        role_name: 'owner', is_active: true, joined_at: new Date().toISOString(),
      });"""

ok = 0
if old_shops in s: s = s.replace(old_shops, new_shops); ok += 1
if old_staff in s: s = s.replace(old_staff, new_staff); ok += 1
open(p, "w").write(s)
print(f"✅ create.tsx mapped to real schema ({ok}/2 blocks)" if ok else "⚠️ patterns not found — print create.tsx insert section")
