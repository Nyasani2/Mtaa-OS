#!/usr/bin/env python3
import os, re

os.chdir(os.path.dirname(os.path.abspath(__file__)))
path = "app/(os)/streets/create.tsx"
with open(path, "r") as f:
    src = f.read()

# 1. Drop the stale useStreets import + destructuring (create screen doesn't need it)
src = re.sub(r"import \{ useStreets \} from '[^']+';\n", "", src)
src = re.sub(r"const \{[^}]*\} = useStreets\(\);\n", "", src)

# 2. Ensure service import includes uploadMedia
src = src.replace(
    "import { createPost } from '@/lib/services/streets-service';",
    "import { createPost, uploadMedia } from '@/lib/services/streets-service';"
)
if "from '@/lib/services/streets-service'" not in src:
    src = "import { createPost, uploadMedia } from '@/lib/services/streets-service';\n" + src
if "from '@/lib/auth/store/auth.store'" not in src:
    src = "import { useAuthStore } from '@/lib/auth/store/auth.store';\n" + src

# 3. Add user + local UI state after the localError state line
state_block = (
    "  const user = useAuthStore((s) => s.user);\n"
    "  const [isPosting, setIsPosting] = useState(false);\n"
    "  const [uploadProgress, setUploadProgress] = useState(0);\n"
    "  const [postError, setPostError] = useState<string | null>(null);\n"
)
if "const [isPosting" not in src:
    m = re.search(r"[^\n]*const \[localError[^\n]*\n", src)
    if m:
        src = src[:m.end()] + state_block + src[m.end():]
        print("✅ inserted user + state after localError")
    else:
        m2 = re.search(r"export default function[^\n]*\{\n", src)
        if m2:
            src = src[:m2.end()] + state_block + src[m2.end():]
            print("✅ inserted user + state after component start")

# 4. Replace the post body with uploadMedia -> createPost flow
old_block = """    if (!user?.id) { setLocalError('You must be logged in to post.'); return; }
    const result = await createPost({
      creatorId: user.id,
      content: content.trim(),
      caption: caption.trim() || undefined,
      mediaUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      mediaType,
      hashtags,
      isPublic,
    });
    if (result) router.back();"""

new_block = """    if (!user?.id) { setLocalError('You must be logged in to post.'); return; }
    setIsPosting(true);
    setUploadProgress(0);
    setPostError(null);
    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      if (selectedFile) {
        const up = await uploadMedia(selectedFile, user.id, (pct: number) => setUploadProgress(pct));
        mediaUrl = up.url;
        thumbnailUrl = up.thumbnailUrl;
      }
      const result = await createPost({
        creatorId: user.id,
        content: content.trim(),
        caption: caption.trim() || undefined,
        mediaUrl,
        thumbnailUrl,
        mediaType,
        hashtags,
        isPublic,
      });
      if (result) router.back();
      else setPostError('Failed to create post.');
    } catch (e: any) {
      setPostError(e?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
      setUploadProgress(0);
    }"""

if old_block in src:
    src = src.replace(old_block, new_block)
    print("✅ replaced post body with uploadMedia -> createPost")
else:
    print("⚠️ post body pattern not found — check handlePost manually")

with open(path, "w") as f:
    f.write(src)
print("✅ create.tsx written")
