import os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ── 1. Add publishPost to the useStreets hook ──
hook = "lib/hooks/useStreets.ts"
src = open(hook).read()

# ensure service imports include uploadMedia + createPost
if "uploadMedia" not in src:
    src = src.replace("fetchStreetsPosts,", "fetchStreetsPosts,\n  uploadMedia,\n  createPost,", 1)

if "publishPost" not in src:
    fn = '''
  const publishPost = useCallback(async (params: {
    content: string;
    caption?: string;
    file?: any;
    mediaType?: 'image' | 'video';
    hashtags?: string[];
    isPublic?: boolean;
  }) => {
    if (!user?.id) throw new Error('You must be signed in to post.');
    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    if (params.file) {
      const up = await uploadMedia(params.file, user.id, () => {});
      mediaUrl = up.url;
      thumbnailUrl = up.thumbnailUrl;
    }
    return await createPost({
      creatorId: user.id,
      content: params.content,
      caption: params.caption,
      mediaUrl,
      thumbnailUrl,
      mediaType: params.mediaType,
      hashtags: params.hashtags,
      isPublic: params.isPublic,
    });
  }, [user?.id]);
'''
    m = re.search(r"\n  return \{", src)
    if m:
        src = src[:m.start()] + fn + src[m.start():]
        src = src.replace("\n  return {", "\n  return {\n    publishPost,", 1)
        open(hook, "w").write(src)
        print("OK: publishPost added to useStreets hook")
    else:
        print("WARN: could not find hook return block")
else:
    print("OK: hook already has publishPost")

# ── 2. Make sure create.tsx gets publishPost from the hook ──
create = "app/(os)/streets/create.tsx"
c = open(create).read()

if "useStreets" not in c:
    c = c.replace(
        "import { useAuthStore } from '@/lib/auth/store/auth.store';",
        "import { useAuthStore } from '@/lib/auth/store/auth.store';\nimport { useStreets } from '@/lib/hooks/useStreets';",
        1,
    )

m = re.search(r"const \{([^}]*)\} = useStreets\(\)", c)
if m:
    if "publishPost" not in m.group(1):
        c = c.replace(m.group(0), "const {" + m.group(1).rstrip().rstrip(",") + ", publishPost } = useStreets()", 1)
        print("OK: publishPost added to existing useStreets destructuring")
else:
    imports = list(re.finditer(r"^import .*$", c, re.M))
    if imports:
        pos = imports[-1].end()
        c = c[:pos] + "\nconst { publishPost } = useStreets();" + c[pos:]
        print("OK: added `const { publishPost } = useStreets();` after imports")

open(create, "w").write(c)
print("DONE")
