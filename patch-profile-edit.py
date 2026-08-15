import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
p = "app/(os)/profile/index.tsx"; s = open(p).read()
if "Pencil" not in s:
    s = s.replace("Trash2, Eye, Heart, Share2, Play, LogOut, X", "Trash2, Eye, Heart, Share2, Play, LogOut, X, Pencil")
    s = s.replace("  const onRefresh = async () => {",
"""  const handleEdit = (post) => {
    Alert.prompt ? null : null;
    const next = window.prompt('Edit caption/content:', post.caption || post.content || '');
    if (next === null) return;
    (async () => {
      try {
        const svc = require('@/lib/services/streets-service');
        const ok = await svc.updatePost(post.id, user?.id, { caption: next, content: next });
        if (ok) setMyPosts((prev) => prev.map((x) => x.id === post.id ? { ...x, caption: next, content: next } : x));
        else Alert.alert('Edit failed', 'Could not update post');
      } catch (e) { Alert.alert('Edit failed', String(e?.message || e)); }
    })();
  };

  const onRefresh = async () => {""")
    s = s.replace("<TouchableOpacity onPress={() => handleAnalytics(post)} style={st.cellBtn}><Eye size={13} color=\"#7dd3fc\" /></TouchableOpacity>",
"<TouchableOpacity onPress={() => handleEdit(post)} style={st.cellBtn}><Pencil size={13} color=\"#fbbf24\" /></TouchableOpacity>\n                <TouchableOpacity onPress={() => handleAnalytics(post)} style={st.cellBtn}><Eye size={13} color=\"#7dd3fc\" /></TouchableOpacity>")
    open(p, "w").write(s); print("✅ profile: edit button wired to updatePost")
else:
    print("✅ profile already has edit")
