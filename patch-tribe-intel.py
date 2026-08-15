import re

# ── 1. getTribe: robust fetch (no maybeSingle quirks) ──
p = "lib/tribes/services/tribes.service.ts"
s = open(p).read()
old = """export async function getTribe(id: string) {
  const { data, error } = await supabase.from('tribes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}"""
new = """export async function getTribe(id: string) {
  const { data, error } = await supabase.from('tribes').select('*').eq('id', id).limit(1);
  if (error) throw error;
  return (data && data[0]) || null;
}"""
if old in s:
    s = s.replace(old, new); open(p, "w").write(s); print("✅ getTribe hardened")
else:
    print("⚠️ getTribe pattern not found (may already be patched)")

# ── 2. AskAsis: allow inserting answers into the composer ──
p = "lib/tribes/components/AskAsis.tsx"
s = open(p).read()
if "onInsert" not in s:
    s = s.replace("export default function AskAsis({ tribeId, tribeName, context }: { tribeId: string; tribeName: string; context?: string }) {",
                  "export default function AskAsis({ tribeId, tribeName, context, onInsert }: { tribeId: string; tribeName: string; context?: string; onInsert?: (t: string) => void }) {")
    s = s.replace("""                  <Text style={{ color: a.verification === 'verified' ? '#4ade80' : '#fbbf24', fontSize: 11, marginTop: 6 }}>
                    {a.verification === 'verified' ? '✓ Verified' : a.verification === 'community' ? 'Community contribution' : 'Uncertain'} · {a.kind}
                  </Text>""",
"""                  <Text style={{ color: a.verification === 'verified' ? '#4ade80' : '#fbbf24', fontSize: 11, marginTop: 6 }}>
                    {a.verification === 'verified' ? '✓ Verified' : a.verification === 'community' ? 'Community contribution' : 'Uncertain'} · {a.kind}
                  </Text>
                  {onInsert ? (
                    <TouchableOpacity onPress={() => { onInsert(((a.title || '') + '. ' + (a.summary || a.body || '')).trim()); setOpen(false); }} style={{ marginTop: 8, backgroundColor: '#2a2a3e', borderRadius: 8, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ color: '#a78bfa', fontSize: 12, fontWeight: '700' }}>Use in post</Text>
                    </TouchableOpacity>
                  ) : null}""")
    open(p, "w").write(s); print("✅ AskAsis can insert into composer")
else:
    print("✅ AskAsis already supports insert")

# ── 3. Tribe home: diagnostics + ASIS intel strip + composer help ──
p = "app/(os)/tribes/[id].tsx"
s = open(p).read()
if "diag" not in s:
    s = s.replace("import { useAuthStore } from '@/lib/auth/store/auth.store';",
                  "import { useAuthStore } from '@/lib/auth/store/auth.store';\nimport { supabase } from '@/lib/supabase';")
    s = s.replace("const [loading, setLoading] = useState(true);",
                  "const [loading, setLoading] = useState(true);\n  const [diag, setDiag] = useState(null);")
    s = s.replace("setTribe(t); setPosts(p); setCount(c); setRole(r || 'none');",
"""if (!t) {
        const { data, error } = await supabase.from('tribes').select('id,name,visibility,status').eq('id', id);
        setDiag('tribe load null → ' + JSON.stringify({ rows: data, err: error?.message || null }));
      }
      setTribe(t); setPosts(p); setCount(c); setRole(r || 'none');""")
    s = s.replace("if (!tribe) return <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#888' }}>Tribe not found</Text></View>;",
"""if (!tribe) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: '#888', marginBottom: 12 }}>Tribe not found</Text>
      {diag ? <Text style={{ color: '#ff6b6b', fontSize: 11, textAlign: 'center' }}>{diag}</Text> : null}
    </View>
  );""")
    # ASIS intel strip + composer help inside Discussion tab
    s = s.replace("{isMember && (\n              <View style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 12 }}>",
"""{isMember && (
              <View style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#a78bfa', fontSize: 12, fontWeight: '700' }}>ASIS helps you draft posts, campaigns & speeches</Text>
                  <AskAsis tribeId={id} tribeName={tribe.name} context="draft content" onInsert={setDraft} />
                </View>""")
    # Intel strip above tabs: who/what + latest knowledge (real DB data)
    s = s.replace("{/* Tabs */}",
"""<View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#101018', borderBottomWidth: 1, borderBottomColor: '#1f1f1f' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{tribe.name} · intelligence</Text>
          <Text style={{ color: '#9aa', fontSize: 12, marginTop: 4 }}>{tribe.description || 'No description yet.'}</Text>
          {knowledge.slice(0, 2).map((k) => (
            <Text key={k.id} style={{ color: '#7dd3fc', fontSize: 12, marginTop: 4 }}>• {k.title}{k.summary ? ': ' + k.summary : ''}</Text>
          ))}
        </View>
        {/* Tabs */}""")
    open(p, "w").write(s); print("✅ tribe home: diagnostics + ASIS intel + composer help")
else:
    print("✅ tribe home already patched")
