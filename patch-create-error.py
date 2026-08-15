import re
p = "app/(os)/tribes/create.tsx"
s = open(p).read()
if "const [err, setErr]" not in s:
    s = s.replace("const [busy, setBusy] = useState(false);",
                  "const [busy, setBusy] = useState(false);\n  const [err, setErr] = useState(null);")
    s = s.replace("} catch (e) { Alert.alert('Create failed', e?.message || String(e)); }",
                  "} catch (e) { console.error('[CreateTribe]', e); setErr(e?.message || String(e)); }")
    s = s.replace("<TouchableOpacity onPress={submit} disabled={busy}",
                  "{err && <View style={{ backgroundColor: '#3a1a1a', borderRadius: 8, padding: 10, marginBottom: 10 }}><Text style={{ color: '#ff6b6b', fontSize: 13 }}>{err}</Text></View>}\n      <TouchableOpacity onPress={submit} disabled={busy}")
    open(p, "w").write(s)
    print("✅ create screen shows inline errors")
else:
    print("✅ already patched")
