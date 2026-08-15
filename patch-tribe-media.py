p = "app/(os)/tribes/[id].tsx"
s = open(p).read()

s = s.replace("import React, { useEffect, useState, useCallback } from 'react';",
              "import React, { useEffect, useState, useCallback, useRef } from 'react';")
s = s.replace("import { Heart, MessageCircle, Share, UserPlus, Flag, Radio, Send, MessageSquare } from 'lucide-react-native';",
              "import { Heart, MessageCircle, Share, UserPlus, Flag, Radio, Send, MessageSquare, Image as ImageIcon, Video as VideoIcon } from 'lucide-react-native';")
s = s.replace("const [commentDraft, setCommentDraft] = useState('');",
              "const [commentDraft, setCommentDraft] = useState('');\n  const [media, setMedia] = useState(null);\n  const [mediaType, setMediaType] = useState('image');\n  const fileRef = useRef(null);")

s = s.replace("""  const publish = async () => {
    if (!draft.trim() || !user?.id) return;
    setPosting(true);
    try { await T.createPost({ tribe_id: id, author_id: user.id, content: draft.trim() }); setDraft(''); load(); }
    catch (e) { Alert.alert('Post failed', e?.message || String(e)); }
    setPosting(false);
  };""",
"""  const pickMedia = (type) => { setMediaType(type); if (fileRef.current) { fileRef.current.accept = type === 'video' ? 'video/*' : 'image/*'; fileRef.current.click(); } };
  const onFile = (e) => { const f = e.target?.files?.[0]; if (f) setMedia(f); };
  const publish = async () => {
    if ((!draft.trim() && !media) || !user?.id) return;
    setPosting(true);
    try {
      let mediaUrl, thumbnailUrl, mtype;
      if (media) {
        const up = await T.uploadTribeMedia(media, user.id);
        mediaUrl = up.url; thumbnailUrl = up.thumbnailUrl;
        mtype = media.type && media.type.startsWith('video') ? 'video' : 'image';
      }
      await T.createPost({ tribe_id: id, author_id: user.id, content: draft.trim(), media_url: mediaUrl, thumbnail_url: thumbnailUrl, media_type: mtype });
      setDraft(''); setMedia(null); load();
    } catch (e) { Alert.alert('Post failed', e?.message || String(e)); }
    setPosting(false);
  };""")

s = s.replace("""              <TextInput value={draft} onChangeText={setDraft} placeholder="Write something..." placeholderTextColor="#666" multiline style={{ color: '#fff', fontSize: 14, minHeight: 60 }} />
              <TouchableOpacity onPress={publish} disabled={posting}""",
"""              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFile} />
              <TextInput value={draft} onChangeText={setDraft} placeholder="Write something..." placeholderTextColor="#666" multiline style={{ color: '#fff', fontSize: 14, minHeight: 60 }} />
              {media ? (
                <View style={{ marginTop: 8 }}>
                  {media.type && media.type.startsWith('video')
                    ? <video src={URL.createObjectURL(media)} controls muted style={{ width: '100%', maxHeight: 240, borderRadius: 10 }} />
                    : <img src={URL.createObjectURL(media)} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />}
                  <TouchableOpacity onPress={() => setMedia(null)} style={{ marginTop: 6 }}><Text style={{ color: '#ff6b6b', fontSize: 12 }}>Remove media</Text></TouchableOpacity>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => pickMedia('image')} style={{ backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={16} color="#4ade80" /><Text style={{ color: '#fff', fontSize: 12 }}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pickMedia('video')} style={{ backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <VideoIcon size={16} color="#60a5fa" /><Text style={{ color: '#fff', fontSize: 12 }}>Video</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={publish} disabled={posting}""")

# render video posts as video in the feed
s = s.replace("{p.media_url ? <Image source={{ uri: p.media_url }} style={{ width: '100%', height: 220, borderRadius: 10, marginTop: 8 }} /> : null}",
"{p.media_url ? (p.media_type === 'video'\n                ? <video src={p.media_url} controls style={{ width: '100%', maxHeight: 320, borderRadius: 10, marginTop: 8 }} />\n                : <Image source={{ uri: p.media_url }} style={{ width: '100%', height: 220, borderRadius: 10, marginTop: 8 }} />) : null}")

open(p, "w").write(s)
print("✅ tribe media posting wired")
