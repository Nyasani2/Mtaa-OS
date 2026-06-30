# Profile Route Fix

## Problem
The [id].tsx dynamic route was catching /privacy and /earnings before static routes could match.
This caused "invalid input syntax for type uuid" errors.

## Solution
Created explicit static route files:
- app/(os)/profile/privacy.tsx  → Privacy & Security screen
- app/(os)/profile/earnings.tsx → Creator Earnings screen  
- app/(os)/profile/messages.tsx → Messages screen

## Install
```bash
cd ~/MTAA_OS_V10
bash install.sh
npx expo start --clear
```

## Notes
- Messages routes to a new screen in the profile folder
- If you have an existing messages app at app/(os)/messages/, update the router.push in profile/index.tsx to point there instead
- Settings route in profile/index.tsx goes to /(os)/settings which is correct
