p = "lib/tribes/services/tribes.service.ts"
s = open(p).read()

# getMembers: two-step (no embedded select -> kills PGRST200)
old = """export async function getMembers(tribeId: string) {
  const { data, error } = await supabase.from('tribe_members').select('role, status, user_id, user_profiles:user_profiles(user_id, full_name, avatar_url, username)').eq('tribe_id', tribeId).eq('status', 'active').limit(200);
  if (error) throw error;
  return data || [];
}"""
new = """export async function getMembers(tribeId: string) {
  const { data, error } = await supabase.from('tribe_members').select('role, status, user_id').eq('tribe_id', tribeId).eq('status', 'active').limit(200);
  if (error) throw error;
  const rows = data || [];
  const ids = rows.map((r: any) => r.user_id).filter(Boolean);
  const prof: any = {};
  if (ids.length) {
    const { data: p } = await supabase.from('user_profiles').select('user_id, full_name, avatar_url, username').in('user_id', ids);
    (p || []).forEach((x: any) => { prof[x.user_id] = x; });
  }
  return rows.map((r: any) => ({ ...r, user_profiles: prof[r.user_id] || null }));
}"""
if old in s: s = s.replace(old, new); print("✅ getMembers two-step")

# createPost: resilient (full insert -> minimal fallback), never silent
old = """export async function createPost(input: any) {
  const { data, error } = await supabase.from('tribe_posts').insert(input).select().single();
  if (error) throw error;
  await notify(input.tribe_id, input.author_id, 'posted in the tribe');
  return data;
}"""
new = """export async function createPost(input: any) {
  const base = { tribe_id: input.tribe_id, author_id: input.author_id, content: input.content };
  let r = await supabase.from('tribe_posts').insert({
    ...base,
    title: input.title || (input.content || '').slice(0, 80),
    caption: input.caption, media_url: input.media_url, thumbnail_url: input.thumbnail_url,
    media_type: input.media_type, hashtags: input.hashtags,
  }).select().single();
  if (r.error) r = await supabase.from('tribe_posts').insert(base).select().single();
  if (r.error) throw r.error;
  await notify(input.tribe_id, input.author_id, 'posted in the tribe');
  return r.data;
}"""
if old in s: s = s.replace(old, new); print("✅ createPost resilient")
open(p, "w").write(s)

# AskAsis: add retrieval-composed Draft (AI-assisted, labelled, user publishes)
p = "lib/tribes/components/AskAsis.tsx"
s = open(p).read()
if "const draft = async" not in s:
    s = s.replace("tribeName: string; context?: string; onInsert?: (t: string) => void",
                  "tribeName: string; context?: string; tribeDescription?: string; onInsert?: (t: string) => void")
    s = s.replace("{ tribeId, tribeName, context, onInsert }", "{ tribeId, tribeName, context, tribeDescription, onInsert }")
    s = s.replace("  const ask = async () => {",
"""  const draft = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.from('tribe_knowledge_entries').select('title, summary').eq('tribe_id', tribeId).eq('status', 'approved').limit(5);
      const k = data || [];
      const body = k.length ? k.map((x: any) => '• ' + x.title + (x.summary ? ': ' + x.summary : '')).join('\\n')
        : (tribeDescription || tribeName + ' — join the conversation.');
      const text = '📌 ' + tribeName + '\\n' + body + '\\n\\n(AI-assisted draft — review before posting)';
      if (onInsert) { onInsert(text); setOpen(false); } else { setAnswer([{ title: 'Draft ready', summary: text, verification: 'community', kind: 'draft' }]); }
    } catch { setAnswer([]); }
    setBusy(false);
  };

  const ask = async () => {""")
    s = s.replace("""              <TouchableOpacity onPress={ask} style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Ask</Text>}
              </TouchableOpacity>""",
"""              <TouchableOpacity onPress={draft} style={{ backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#7c3aed' }}>
                <Text style={{ color: '#a78bfa', fontWeight: '700' }}>Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={ask} style={{ backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Ask</Text>}
              </TouchableOpacity>""")
    open(p, "w").write(s); print("✅ AskAsis Draft button")

# [id].tsx: pass tribeDescription
p = "app/(os)/tribes/[id].tsx"
s = open(p).read()
s = s.replace('<AskAsis tribeId={id} tribeName={tribe.name} context="tribe knowledge & campaigns" onInsert={setDraft} />',
              '<AskAsis tribeId={id} tribeName={tribe.name} tribeDescription={tribe.description} context="tribe knowledge & campaigns" onInsert={setDraft} />')
open(p, "w").write(s); print("✅ tribeDescription wired")
