# 01 — MTAA PRODUCTION BASELINE

Generated: 2026-08-31 11:45  
Baseline commit: `a75b927bf`  
Governing principle: **PRESERVE > AUDIT > CONNECT > REPAIR > TEST > DEPLOY**

## Scale

- Screens/Routes: **721**
- Database tables: **1189**
- Edge Functions: **106**
- Services: **69**
- Hooks: **32**
- Global stores: **2** (app-store, wallet-store)

### Frontend routes by module

| Module | Count |
|--------|-------|
| `(os)` | 414 |
| `(education)` | 121 |
| `(commerce)` | 37 |
| `(work)` | 21 |
| `(tribes)` | 11 |
| `(garage)` | 10 |
| `(admin)` | 9 |
| `(auth)` | 9 |
| `(mtaxi)` | 9 |
| `(mtruck)` | 8 |
| `(agent)` | 6 |
| `(media)` | 6 |
| `(utility)` | 6 |
| `(business)` | 4 |
| `(communication)` | 4 |
| `(driver)` | 4 |
| `(finance)` | 4 |
| `(jobs)` | 4 |
| `(productivity)` | 4 |
| `(restaurant)` | 4 |
| `(local)` | 3 |
| `(social)` | 3 |
| `(system)` | 3 |
| `(boda)` | 2 |
| `(device)` | 2 |
| `(regulatory)` | 2 |
| `(transport)` | 2 |
| `wallet` | 2 |
| `health` | 1 |
| `inspections` | 1 |
| `_layout` | 1 |
| `live-class` | 1 |
| `(mboda)` | 1 |
| `+not-found` | 1 |
| `studio` | 1 |

### Database tables by domain

| Module | Count |
|--------|-------|
| `CREATE TABLE IF NOT EXISTS "public"."education` | 65 |
| `CREATE TABLE IF NOT EXISTS "public"."health` | 65 |
| `CREATE TABLE IF NOT EXISTS "public"."wallet` | 54 |
| `CREATE TABLE IF NOT EXISTS "public"."studio` | 42 |
| `CREATE TABLE IF NOT EXISTS "public"."mtaxi` | 40 |
| `CREATE TABLE IF NOT EXISTS "public"."mtruck` | 39 |
| `CREATE TABLE IF NOT EXISTS "public"."treasury` | 35 |
| `CREATE TABLE IF NOT EXISTS "public"."civic` | 32 |
| `CREATE TABLE IF NOT EXISTS "public"."tribe` | 32 |
| `CREATE TABLE IF NOT EXISTS "public"."shop` | 29 |
| `CREATE TABLE IF NOT EXISTS "public"."user` | 24 |
| `CREATE TABLE IF NOT EXISTS "public"."streets` | 23 |
| `CREATE TABLE IF NOT EXISTS "public"."police` | 21 |
| `CREATE TABLE IF NOT EXISTS "public"."court` | 18 |
| `CREATE TABLE IF NOT EXISTS "public"."restaurant` | 18 |
| `CREATE TABLE IF NOT EXISTS "public"."mtaa` | 17 |
| `CREATE TABLE IF NOT EXISTS "public"."garage` | 16 |
| `CREATE TABLE IF NOT EXISTS "public"."revenue` | 16 |
| `CREATE TABLE IF NOT EXISTS "public"."app` | 15 |
| `CREATE TABLE IF NOT EXISTS "public"."county` | 15 |
| `CREATE TABLE IF NOT EXISTS "public"."prison` | 15 |
| `CREATE TABLE IF NOT EXISTS "public"."job` | 14 |
| `CREATE TABLE IF NOT EXISTS "public"."work` | 13 |
| `CREATE TABLE IF NOT EXISTS "public"."property` | 11 |
| `CREATE TABLE IF NOT EXISTS "public"."post` | 10 |
| `CREATE TABLE IF NOT EXISTS "public"."border` | 9 |
| `CREATE TABLE IF NOT EXISTS "public"."payment` | 9 |
| `CREATE TABLE IF NOT EXISTS "public"."truck` | 9 |
| `CREATE TABLE IF NOT EXISTS "public"."admin` | 8 |
| `CREATE TABLE IF NOT EXISTS "public"."ai` | 8 |
| `CREATE TABLE IF NOT EXISTS "public"."freight` | 8 |
| `CREATE TABLE IF NOT EXISTS "public"."hookup` | 8 |
| `CREATE TABLE IF NOT EXISTS "public"."live` | 8 |
| `CREATE TABLE IF NOT EXISTS "public"."asis` | 7 |
| `CREATE TABLE IF NOT EXISTS "public"."child` | 7 |
| `CREATE TABLE IF NOT EXISTS "public"."tax` | 7 |
| `CREATE TABLE IF NOT EXISTS "public"."ad` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."binance` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."business` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."crypto` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."device` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."election` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."kephis` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."ntsa` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."regulatory` | 6 |
| `CREATE TABLE IF NOT EXISTS "public"."carpool` | 5 |
| `CREATE TABLE IF NOT EXISTS "public"."content` | 5 |
| `CREATE TABLE IF NOT EXISTS "public"."driver` | 5 |
| `CREATE TABLE IF NOT EXISTS "public"."system` | 5 |
| `CREATE TABLE IF NOT EXISTS "public"."worker` | 5 |
| `CREATE TABLE IF NOT EXISTS "public"."agent` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."boda` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."case` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."cash` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."chat` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."compliance` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."credit` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."event` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."feed` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."marketplace` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."platform` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."referral` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."savings` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."street` | 4 |
| `CREATE TABLE IF NOT EXISTS "public"."account` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."cargo` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."customs` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."financial` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."forum` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."gofund` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."governance` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."insurance` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."investment` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."ledger` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."moderation` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."org` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."partner` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."product` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."sanctions` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."track` | 3 |
| `CREATE TABLE IF NOT EXISTS "public"."accounting` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."calendar` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."cashpoint` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."creator` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."daraja` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."drone` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."emergency` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."escrow` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."family` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."feature` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."fee` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."finance` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."fraud` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."hotel` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."immigration` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."kernel` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."logistics` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."maintenance` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."music` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."pin` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."poll` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."pool` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."public` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."rail` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."ride` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."risk` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."security` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."transit` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."ward` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."withdrawal` | 2 |
| `CREATE TABLE IF NOT EXISTS "public"."accountings"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."active` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."activity` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."ads"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."adverts"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."affiliates"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."agents"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."agri` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."analytics` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."api` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."apps"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."assets"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."async` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."audit` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."auth` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."auto` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."avatars"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."bodycam` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."bonded` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."boosted` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."bursary` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."businesses"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."call` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."campaigns"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."cart` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."carts"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."cbk` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."certificates"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."certifications"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."commands"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."company` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."connection` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."constituencies"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."contact` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."contacts"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."container` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."containers"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."content"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."contraband` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."conversation` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."conversations"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."counties"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."country` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."course` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."courses"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."creators"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."crop` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."delivery` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."devices"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."dispatch` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."dividend` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."documents"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."drivers"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."driving` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."elections"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."escrow"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."evidence"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."evidence` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."excise` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."external` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."facilities"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."farm` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."favorites"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."favorite` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."firmware` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."fleet` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."followers"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."follows"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."garages"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."gift` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."gifts"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."go` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."government` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."gps` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."groups"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."hashtags"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."herbalists"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."home` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."hookups"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."identity` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."incidents"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."installed` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."interactions"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."interests"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."inventory` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."investments"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."jobs"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."kyc` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."lab` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."landlords"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."languages"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."learning` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."leases"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."listings"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."loan` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."loans"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."lost` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."market` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."messages"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."missing` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."module` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."modules"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."monetization` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."mpesa` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."musicians"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."national` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."notification` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."notifications"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."obd` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."online` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."order` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."orders"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."organizations"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."osbp` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."os` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."overstays"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."parliament` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."passports"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."paybill` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."payout` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."pest` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."petitions"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."petition` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."pharmacies"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."phone` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."polls"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."pos` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."prescriptions"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."private` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."products"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."projects"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."properties"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."provider` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."push` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."query` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."rate` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."recordings"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."referrals"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."repair` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."reports"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."reputation` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."reward` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."road` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."saved` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."saves"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."seed` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."shareholders"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."shares"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."share` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."shift` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."shops"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."student` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."subscriptions"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."sub` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."support` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."tariff` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."tenants"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."till` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."tips"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."topup` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."traffic` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."transaction` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."transactions"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."translations"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."transport` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."tribes"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."trust` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."vaccinations"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."vehicle` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."verification` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."vessel` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."visa` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."visas"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."votes"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."voting` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."wallets"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."wards"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."wishlist"` | 1 |
| `CREATE TABLE IF NOT EXISTS "public"."withholding` | 1 |


## Preliminary module status (to be confirmed by journey testing)

| Module | Status | Notes |
|--------|--------|-------|
| Wallet (economic kernel) | 🟢 | Production-tested; M-Pesa STK live; wallet-bridge engines |
| Authentication / Identity | 🟢 | auth.store.ts canonical; PIN/biometric/recovery present |
| Commerce / Shop | 🟡 | CRUD+orders work; POS basic; affiliate placeholder |
| Transport (MTaxi/Boda/MTruck) | 🟡 | Ride flow works; delivery tracking incomplete; mtruck stubs |
| Education | 🟡 | Classes/assignments work; grading/attendance partial |
| Health | 🟡 | Appointments work; EHR/insurance partial |
| Government / Civic | 🟡 | Backend functions exist; admin UI partial; voting UI missing |
| Social (Streets/Tribes) | 🟡 | Posts/likes work; tribe governance incomplete |
| Creator Studio | 🟡 | Upload/publish work; analytics partial |
| Jobs / Workforce | 🟠 | Browse works; employer dashboard missing; onboarding stubs |
| Media (video/podcast) | 🟠 | "coming soon" placeholders |
| ASIS CSE | 🟡 | 15 engines built; only 3 screens integrated |
| Admin / Regulatory | 🟡 | Command centre exists; role enforcement to verify |
| Notifications | 🟡 | Tables+service exist; deep-link/read-state to verify |
