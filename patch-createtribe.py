import re
p = "lib/tribes/services/tribes.service.ts"
s = open(p).read()
new_fn = """export async function createTribe(input: any) {
  const slug = ((input.name || 'tribe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tribe') + '-' + Date.now().toString(36);
  const payload = {
    ...input,
    slug: input.slug || slug,
    short_description: input.short_description || input.description || null,
    status: input.status || 'active',
  };
  const { data, error } = await supabase.from('tribes').insert(payload).select().single();
  if (error) throw error;
  return data;
}"""
s2 = re.sub(r"export async function createTribe\(input: any\) \{[\s\S]*?\n\}", new_fn, s, count=1)
open(p, "w").write(s2)
print("✅ createTribe patched (slug/status/short_description)")
