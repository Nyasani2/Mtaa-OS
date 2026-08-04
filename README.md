# MTAA MTaxi Address Search Fix

## What changed
- Replaced manual lat/lng text inputs with Google-powered address search
- Both Pickup and Destination now open a search modal
- Typing 3+ characters triggers geocoding via Google Geocoding API
- Selecting an address auto-populates coordinates and triggers fare calculation

## Files included
1. app/(mtaxi)/request.tsx — Updated ride request screen
2. app/(mtaxi)/schedule.tsx — Updated scheduled ride screen
3. lib/transport/components/AddressSearchModal.tsx — Reusable address search UI
4. lib/transport/services/geocode.service.ts — Google Geocoding API wrapper

## Setup required
Add to your .env (or app.config.js):
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Your Google Cloud project must have the Geocoding API enabled.

## Install commands
```bash
cd ~/MTAA_OS_V10
# Move ZIP from Downloads
mv ~/Downloads/mtaa_mtaxi_address_fix.zip .
unzip -o mtaa_mtaxi_address_fix.zip
# Clean up
rm mtaa_mtaxi_address_fix.zip
```

## Verification checklist
- [ ] Open MTaxi Request screen
- [ ] Tap "Destination" card
- [ ] Type "Nairobi CBD" — results should appear
- [ ] Tap a result — card should show address + distance + fare
- [ ] Tap "Book" — ride should create successfully
