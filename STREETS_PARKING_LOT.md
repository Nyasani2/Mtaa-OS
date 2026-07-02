# MTAA STREETS — PARKING LOT (Return Here Later)

## Status: Partially Working (Phase 1 of 3 Complete)

### ✅ WORKING (Keep)
| Feature | Status | Notes |
|---------|--------|-------|
| Feed loads | ✅ | Shows posts, creator names |
| Creator profile | ✅ | Real name, avatar, bio, stats |
| Post detail | ✅ | Loads, shows comments, like button |
| Like button UI | ✅ | Renders, toggles visual state |
| Comment display | ✅ | Shows user name + avatar + content |
| RLS policies | ✅ | Public posts readable, own posts editable |
| Service exports | ✅ | Named exports + streetsService object |
| Hook architecture | ✅ | useStreets, usePostDetail hooks working |

### ❌ PENDING (Fix When We Return)
| Feature | Issue | Priority |
|---------|-------|----------|
| **Avatar 403** | `avatars` bucket still forbidden | 🔴 HIGH |
| **Media thumbnails** | Video grid shows play button but no thumbnail | 🔴 HIGH |
| **Grid hardcoded text** | Old code shows MTaxi/MTruck placeholders | 🔴 HIGH |
| **Like persistence** | Like state not saved to DB | 🟡 MEDIUM |
| **Views counter** | `increment_streets_view` RPC may not exist | 🟡 MEDIUM |
| **Media compression** | Images/videos upload raw, no resize | 🟡 MEDIUM |
| **Storage cleanup** | Old media not deleted on post delete | 🟢 LOW |
| **Video playback** | No video player component | 🟢 LOW |
| **Search** | Search screen exists but not wired | 🟢 LOW |
| **Follow system** | Followers/Following counts are 0 | 🟢 LOW |

### 🔧 FILES MODIFIED (In This Session)
- `lib/services/streets-service.ts` — Rewritten with compression, mergeProfiles
- `lib/hooks/useStreets.ts` — Added usePostDetail, fixed imports
- `lib/types/streets.ts` — Unified StreetPost/StreetsPost types
- `app/(os)/streets/index.tsx` — Uses useStreets hook, wired like button
- `app/(os)/streets/post/[postId].tsx` — Fixed imports, no direct supabase
- `app/(os)/streets/creator/[userId].tsx` — Real profile fetch, not placeholder
- `lib/utils/media-compressor.ts` — NEW: Image/video compression utility
- `app/(os)/streets/create.tsx` — NEW: With compression UI

### 📋 SQL APPLIED
- RLS policies on `streets_posts`, `streets_comments`, `streets_likes`
- `user_profiles` SELECT policy for all authenticated users
- `streets-media` bucket policies (public read, auth upload, owner delete)
- `increment_streets_view` and `increment_streets_share` RPC functions
- Indexes on `streets_posts`, `streets_comments`, `streets_likes`

### 🎯 RETURN CHECKLIST (When We Come Back)
1. [ ] Fix avatar 403 — verify `avatars` bucket public policy
2. [ ] Fix grid hardcoded text — apply `streets_fix_creator_grid_only.zip`
3. [ ] Test like/unlike persistence across refresh
4. [ ] Test views increment on post open
5. [ ] Add video thumbnail generation to upload flow
6. [ ] Add media compression to create post flow
7. [ ] Wire search screen
8. [ ] Add follow/unfollow functionality
9. [ ] Add video player component
10. [ ] Full button audit (every button must do something real)

### 📦 FIX ZIPS GENERATED (Saved in ~/Downloads)
| ZIP | Contents | Applied? |
|-----|----------|----------|
| `streets_fix_1_backend.zip` | Service, hook, types | ✅ Yes |
| `streets_fix_2_feed.zip` | Feed screen | ✅ Yes |
| `streets_fix_3_post_detail.zip` | Post detail screen | ✅ Yes |
| `streets_fix_4_creator.zip` | Creator profile screen | ✅ Yes |
| `streets_fix_5_sql.zip` | RLS policies, RPCs | ✅ Yes |
| `streets_compress_a_core.zip` | Compression utility + service | ❌ No |
| `streets_compress_b_create.zip` | Create screen with compression | ❌ No |
| `streets_compress_c_sql.zip` | thumbnail_url column SQL | ❌ No |
| `streets_diagnostic_and_fix.zip` | Diagnostic + storage fix SQL | ✅ Yes |
| `streets_fix_creator_grid_only.zip` | Fixed grid (no placeholders) | ❌ No |

### 🚀 NEXT APPS TO BUILD (In Order)
1. **Clock / Alarm** — Simple, no backend
2. **Calculator** — Pure UI, no backend
3. **Calendar / Scheduler** — Light backend
4. **Notes / Documents** — Medium complexity
5. **Gallery** — Image picker, storage
6. **Messages** — Chat, realtime
7. **SIM / Contacts** — Phone integration
8. **Settings** — Already exists, polish
9. **Wallet** — Already exists, polish
10. **Health** — Already exists, polish

Then return to Streets for final polish.
