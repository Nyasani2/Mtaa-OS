p = "lib/auth/store/auth.store.ts"
s = open(p).read()
if "SELF-HEAL" not in s:
    s = s.replace(
      "const { data: { session } } = await supabase.auth.getSession();",
      """const { data: { session } } = await supabase.auth.getSession();
          // SELF-HEAL: never show logged-in when Supabase has no live session
          if (!session?.user) { set({ user: null, session: null, isAuthenticated: false }); }""", 1)
    open(p, "w").write(s)
    print("✅ auth store self-heals session drift")
else:
    print("✅ already patched")
