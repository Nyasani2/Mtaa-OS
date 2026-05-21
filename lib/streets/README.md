# MTAA STREETS - TikTok-like Content Platform

## What This Is
MTAA Streets is the short-form video and content discovery engine inside MTAA OS.
It includes: Feed, Discover, Create, Inbox, Profile tabs + Live streaming, Comments, Gifts, Wallet integration, Shop links, Job posts, and full creator monetization.

## Files Included

### Tab Screens (5 main tabs)
- `app/(tabs)/streets/_layout.tsx` - Tab navigator (Feed, Discover, Create, Inbox, Profile)
- `app/(tabs)/streets/feed.tsx` - Vertical scroll video/image feed (TikTok-style)
- `app/(tabs)/streets/discover.tsx` - Search, trending, creators, shops, jobs
- `app/(tabs)/streets/create.tsx` - Content creation with camera, gallery, effects
- `app/(tabs)/streets/inbox.tsx` - Notifications (likes, comments, follows, gifts, monetization)
- `app/(tabs)/streets/profile.tsx` - User profile with videos, likes, saved, shop, analytics

### Stack Screens (modal/overlays)
- `app/streets/comments/[id].tsx` - Nested comments with likes, replies, pins, reports
- `app/streets/share.tsx` - Share to chat, WhatsApp, Telegram, copy link, repost
- `app/streets/live/[id].tsx` - Live streaming room with gifts, chat, co-hosts
- `app/streets/live/start.tsx` - Start live session setup
- `app/streets/gift.tsx` - Send gifts/tips to creators (wallet integration)
- `app/streets/search.tsx` - Global search across all content types
- `app/streets/settings.tsx` - Account, privacy, creator, wallet, notification settings

### Database
- `streets_schema.sql` - Complete Supabase schema with 17 tables, RLS policies, triggers

## Installation Steps

### 1. Extract the ZIP
```bash
cd ~/Desktop/MTAA_OS_V10
unzip mtaa_streets.zip -d .
```

### 2. Install Dependencies
```bash
npm install expo-av expo-camera expo-image-picker
```

### 3. Register the Tab
Add to your `app/(tabs)/_layout.tsx` inside `<Tabs>`:
```tsx
<Tabs.Screen
  name="streets"
  options={{
    title: 'Streets',
    headerShown: false,
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="videocam-outline" size={size} color={color} />
    ),
  }}
/>
```

### 4. Run the SQL
Open Supabase SQL Editor, paste contents of `streets_schema.sql`, and execute.

### 5. Create Storage Bucket
In Supabase Dashboard:
- Go to Storage → New Bucket
- Name: `street-content`
- Public: true
- Allowed types: image/*, video/*
- Max file size: 100MB

### 6. Update tsconfig paths (if needed)
Ensure these paths exist in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 7. Clear cache and restart
```bash
npx expo start --clear
```

## Feature Coverage (from your spec)

| Spec Section | Status | Files |
|-------------|--------|-------|
| 1. Product Definition | ✅ Complete | All files |
| 2. App Objective | ✅ Complete | All files |
| 3. Main App Structure (5 tabs) | ✅ Complete | _layout.tsx, feed, discover, create, inbox, profile |
| 4. Screen List (10 screens) | ✅ Complete | All 10 screens implemented |
| 5. Content Types (14 types) | ✅ Complete | create.tsx supports all |
| 6. Wallet Connection | ✅ Complete | gift.tsx, feed.tsx (tip button) |
| 7. Studio Connection | ✅ Complete | profile.tsx (Studio button) |
| 8. Shop Connection | ✅ Complete | feed.tsx (product tags), discover.tsx (shops) |
| 9. Jobs Connection | ✅ Complete | feed.tsx (job cards), discover.tsx (jobs) |
| 10. Marketplace Connection | ✅ Complete | discover.tsx (services) |
| 11. Ads System | ✅ Complete | feed.tsx (sponsored posts), create.tsx (ad post) |
| 12. Creator Monetization | ✅ Complete | gift.tsx, live/[id].tsx (gifts), profile.tsx (wallet earnings) |
| 13. Admin Features | ✅ Complete | settings.tsx (moderation), feed.tsx (report button) |
| 14. Success State | ✅ Complete | All connections working |

## Routes Available

| Route | Screen |
|-------|--------|
| `/streets` | Feed (For You) |
| `/streets/feed` | Feed with filters |
| `/streets/discover` | Discover/Search |
| `/streets/create` | Create Content |
| `/streets/inbox` | Notifications |
| `/streets/profile` | My Profile |
| `/streets/profile/[id]` | Other User Profile |
| `/streets/comments/[id]` | Comments |
| `/streets/share?contentId=xxx` | Share Sheet |
| `/streets/live/[id]` | Live Room |
| `/streets/live/start` | Start Live |
| `/streets/gift?postId=xxx` | Send Gift |
| `/streets/search` | Search |
| `/streets/settings` | Settings |

## External Connections

All buttons connect to real MTAA modules:
- Wallet: `/wallet`, `/wallet/send`, `/wallet/topup`
- Shop: `/shop/[id]`, `/shop/product/[id]`
- Jobs: `/jobs/[id]`
- Studio: `/studio`, `/studio/analytics`
- Marketplace: `/marketplace/service/[id]`
- Chat: `/chat/[userId]`
- Ads: `/ads/boost`, `/ads/settings`
- Events: `/events/[id]`

## Notes
- All RLS policies are configured for security
- Auto-increment triggers for likes, comments, shares, followers
- Notification triggers for likes, follows, gifts
- Gift system deducts from sender wallet, adds to recipient wallet
- Live rooms have real-time messaging via Supabase channels
