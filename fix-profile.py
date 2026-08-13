
import os
import re

base = os.path.expanduser("~/MTAA_OS_V10")
profile_path = os.path.join(base, "app/(os)/profile/index.tsx")

if not os.path.exists(profile_path):
    print(f"[!] Profile not found at {profile_path}")
    exit(1)

with open(profile_path, "r") as f:
    content = f.read()

original = content

# 1. Ensure useEffect is imported
if "useEffect" not in content:
    content = content.replace(
        "import React, { useState } from 'react';",
        "import React, { useState, useEffect } from 'react';"
    )
    content = content.replace(
        "import React from 'react';",
        "import React, { useEffect } from 'react';"
    )

# 2. Ensure supabase client is imported
if "supabase" not in content or "from '@/lib/supabase" not in content:
    # Find the auth import line and add supabase after it
    content = re.sub(
        r"(import\s+\{[^}]*useAuthStore[^}]*\}\s+from\s+'@/lib/auth[^']*';)",
        r"
import { supabase } from '@/lib/supabase/client';",
        content
    )

# 3. Add profileData state + fetch effect inside the component
if "profileData" not in content:
    # Find "export default function" and inject state after the opening brace
    pattern = r'(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)'

    def inject_state(match):
        return match.group(1) + "\n  const [profileData, setProfileData] = useState<any>(null);\n\n  useEffect(() => {\n    if (!user?.id) return;\n    supabase.from('user_profiles').select('avatar_url,full_name,bio').eq('user_id', user.id).single()\n      .then(({ data, error }) => { if (data && !error) setProfileData(data); });\n  }, [user?.id]);\n"

    content = re.sub(pattern, inject_state, content, count=1)

# 4. Replace avatar source to use profileData
content = content.replace(
    "user?.user_metadata?.avatar_url",
    "profileData?.avatar_url || user?.user_metadata?.avatar_url"
)

if content != original:
    with open(profile_path, "w") as f:
        f.write(content)
    print("[✓] Fixed profile avatar — now fetches from user_profiles table")
else:
    print("[✓] Profile already has avatar fix or uses different structure")
