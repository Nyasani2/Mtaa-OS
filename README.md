# Teacher Feed + 4-Camera Content Creation

## Files Included

| File | Route | Description |
|------|-------|-------------|
| app/(education)/feed/index.tsx | /(education)/feed | Teacher social feed with stories, subject filters, posts, likes, comments |
| app/(education)/feed/create.tsx | /(education)/feed/create | 4-mode content creation: Camera, Gallery, Document Scan, Text |

## Prerequisites

Before extracting, rename your old feed file if it exists:

```bash
cd ~/MTAA_OS_V10/app/\(education\)
mv feed.tsx feed-old.tsx 2>/dev/null || true
mkdir -p feed
```

## Install Dependencies

```bash
cd ~/MTAA_OS_V10
npx expo install expo-camera expo-image-picker
```

## Extract ZIP

```bash
cd ~/Downloads
unzip -o teacher_feed_camera_v1.zip -d ~/MTAA_OS_V10/
```

## Features

### Teacher Feed (index.tsx)
- Gradient header with auth-aware welcome
- Horizontal stories bar
- Subject filter chips (All, Mathematics, Science, etc.)
- Post cards with author info, content, media grids (1-4 images)
- Like, comment, share actions
- Pull-to-refresh
- Floating action button to create post
- Auth gate: redirects to login if not authenticated

### Create Content (create.tsx)
- 4-mode selector: Camera / Gallery / Document / Text
- **Camera Mode**: Live preview with flip, flash, shutter capture
- **Gallery Mode**: Multi-select from device photos via expo-image-picker
- **Document Mode**: Camera with corner frame overlay for document scanning
- **Text Mode**: Clean text-only composer
- Photo preview strip with remove capability
- Caption input
- Subject tag multi-select chips
- Auth-aware posting with user_id attachment
- Loading state on publish

## MTAA Auth Integration
- Pre-fills author info from useAuthStore
- Checks isAuthenticated before create/post actions
- Shows Alert with Sign In button if not authenticated
- Attaches user.id to all payloads

## Service Integration Points

Search for these TODO comments in the code:

```
// TODO: Wire to education_service.getFeed({ subject: activeSubject })
// TODO: Wire to education_service.toggleLike(postId)
// TODO: Wire to education_service.createPost(payload)
// TODO: Upload photos to Supabase storage first, then store URLs
```

## Notes
- Zero emojis, clean encoding
- Ionicons + Expo LinearGradient
- Document scan uses camera with visual frame overlay (no OCR)
- Camera permissions handled gracefully with fallback UI
