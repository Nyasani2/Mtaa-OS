p = "app/(os)/tribes/create.tsx"
s = open(p).read()
if "refreshSession" not in s:
    s = s.replace("import { useAuthStore } from '@/lib/auth/store/auth.store';",
                  "import { useAuthStore } from '@/lib/auth/store/auth.store';\nimport { supabase } from '@/lib/supabase';")
    s = s.replace("setBusy(true);",
"""setBusy(true);
    let { data: { session } } = await supabase.auth.getSession();
    if (!session) { const r = await supabase.auth.refreshSession(); session = r.data.session; }
    if (!session) { setErr('Session expired. Log out and log back in, then retry.'); setBusy(false); return; }""", 1)
    open(p, "w").write(s)
    print("✅ create now guarantees a live Supabase session before insert")
else:
    print("✅ already patched")
