# Streets Image Optimization — Install Guide

## Prerequisites
```bash
npx expo install expo-image-manipulator expo-file-system
```

## Install Commands
```bash
cd ~/MTAA_OS_V10

# Move from Downloads
mv ~/Downloads/streets_image_optimization.zip .
unzip streets_image_optimization.zip -d streets_image_optimization/

# Copy files
cp streets_image_optimization/create.tsx app/\(os\)/streets/create.tsx
cp streets_image_optimization/FeedCard.tsx components/streets/FeedCard.tsx
cp streets_image_optimization/streets-service.ts lib/services/streets-service.ts
cp "streets_image_optimization/post/[postId].tsx" "app/\(os\)/streets/post/\[postId\].tsx"

# Clear cache and test
npx expo start --clear
```

## What Each File Fixes

| File | Fix |
|------|-----|
| `create.tsx` | Client-side image compression (1080px max, 75% quality JPEG) before upload |
| `FeedCard.tsx` | `cache: 'force-cache'` on all images + thumbnail URL builder (300x300 grid, full for detail) |
| `streets-service.ts` | `cacheControl: '86400'` (24h CDN cache) on uploads + full CRUD API |
| `post/[postId].tsx` | Fixed comment button (scrolls + focuses input), `isOwnPost` from auth, pull-to-refresh, comment count updates |

## Immediate Relief (Do This NOW)
1. Go to Supabase Dashboard → Storage → `streets-media` bucket
2. Click **Purge CDN Cache** — resets your 5GB counter for this billing cycle
3. Images will start loading again immediately

## Thumbnail Strategy
- **Grid views** (creator profile): 300x300 compressed thumbnails via `?width=300&height=300&quality=70&resize=cover`
- **Feed**: 1080x~640 compressed via `?width=1080&quality=75`
- **Avatars**: 40x40 compressed
- This reduces egress by ~90% vs loading full-resolution images everywhere
