#!/usr/bin/env python3
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

path = "app/(os)/streets/create.tsx"
with open(path, "r") as f:
    src = f.read()

# FIX 1: Fix the broken useStreets import path + add auth store + createPost
old_import = "import { useStreets } from '@/domains/streets/hooks/useStreets';"
new_import = """import { useStreets } from '@/lib/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { createPost } from '@/lib/services/streets-service';"""

if old_import in src:
    src = src.replace(old_import, new_import)
    print("✅ Fixed imports (auth store + service)")

# FIX 2: Add user ID extraction after the hook call
# Find where the hook is used and add user extraction
# The hook likely has: const { ... publishPost ... } = useStreets();
# We need to add: const user = useAuthStore((s) => s.user);

# Check if useAuthStore is already being used in the component
if "useAuthStore" not in src.split("return (")[0] if "return (" in src else "":
    # Find the useStreets hook call and add auth after it
    lines = src.split('\n')
    for i, line in enumerate(lines):
        if 'useStreets()' in line and 'const' in line:
            lines.insert(i + 1, "  const user = useAuthStore((s) => s.user);")
            print(f"✅ Added user extraction after hook call (line {i+2})")
            break
    src = '\n'.join(lines)

# FIX 3: Replace publishPost call with direct createPost call that includes creatorId
old_call = """const result = await publishPost({
      content: content.trim(),
      caption: caption.trim() || undefined,
      file: selectedFile,
      mediaType,
      hashtags,
      isPublic,
    });"""

new_call = """if (!user?.id) { setLocalError('You must be logged in to post.'); return; }
    const result = await createPost({
      creatorId: user.id,
      content: content.trim(),
      caption: caption.trim() || undefined,
      mediaUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      mediaType,
      hashtags,
      isPublic,
    });"""

if old_call in src:
    src = src.replace(old_call, new_call)
    print("✅ Replaced publishPost with direct createPost + creatorId")

# FIX 4: Remove publishPost from the destructured hook values if present
src = src.replace("publishPost,", "")
src = src.replace(", publishPost", "")
src = src.replace("publishPost", "")

# Clean up double commas or trailing commas from removal
src = src.replace(", ,", ",")
src = src.replace("{ ,", "{")
src = src.replace(", }", " }")

with open(path, "w") as f:
    f.write(src)

print("\n✅ create.tsx fully patched")
