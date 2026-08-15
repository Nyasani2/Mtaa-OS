import re
p = "lib/services/streets-service.ts"
src = open(p).read()

guard = """
  // SESSION GUARD: uploads require a valid login token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Session expired. Log out and log back in, then retry.');
  }
"""

if "SESSION GUARD" not in src:
    new = re.sub(
        r"(export async function uploadMedia\([\s\S]*?\)\s*\{)",
        r"\1" + guard,
        src,
        count=1,
    )
    if new != src:
        open(p, "w").write(new)
        print("OK: session guard added to uploadMedia")
    else:
        print("WARN: uploadMedia signature not matched")
else:
    print("OK: guard already present")
