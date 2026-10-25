# Life360 - Recon Map

## App Info
- **Name:** Life360: Family Safety & GPS
- **Package:** com.life360.android.safetymapd
- **Platform:** iOS & Android
- **Core value:** Family location sharing + safety features (crash detection, SOS, driving reports)
- **Monetization:** Freemium — Silver ($9.99/mo), Gold ($16.99/mo), Platinum (price TBD)

## Sources Used
| Source | URL | What it provides |
|--------|-----|------------------|
| App Store listing | https://apps.apple.com/us/app/life360-family-safety-gps/id384830320 | Core features, screenshots, membership tiers |
| Google Play listing | https://play.google.com/store/apps/details?id=com.life360.android.safetymapd | Feature list, screenshots |
| Marketing site | https://www.life360.com/ | Positioning, features overview |
| Help center | https://support.life360.com/hc/en-us/articles | Membership details, troubleshooting |
| Driving safety page | https://www.life360.com/driving-safety | Crash detection details |
| Free vs paid comparison | https://lighthouse.mapquest.com/blog/life360-free-vs-paid/ | Feature breakdown by tier |

---

## Step 1: Screen Inventory

| ID | Screen | Route / How to get there | Purpose | Key components | States seen |
|----|--------|--------------------------|---------|----------------|-------------|
| S01 | Splash screen | App launch | Branding | Logo animation | Loading |
| S02 | Onboarding / Sign up | First install | Get user in account | Phone/email input, Google Sign In, Facebook Sign In | Empty, loading, error |
| S03 | Create Circle intro | After sign up | Explain Circle concept | Illustrations, CTA "Create Circle" | Empty |
| S04 | Circle creation form | From S03 | Name circle, invite members | Circle name input, member invite (phone/email) | Empty, error (name taken) |
| S05 | Join Circle flow | Via link or invite | Join existing circle | Input code or email | Empty, error (invalid code) |
| S06 | Main map view | Home screen by default | Show all Circle members | Google Maps/OpenStreetMap, member pins, names, ETA bubbles | Loading, empty, members online/offline, no-location |
| S07 | Member detail | Tap on member pin | Show specific member info | Photo, location, ETA, battery status, actions (call, message, sos) | Loading, error |
| S08 | Places screen | Bottom nav → Places | Manage geofenced places | List of places, add place, alerts status | Empty, loaded, editing |
| S09 | Place detail/edit | Tap place or + | Configure a place alert | Name input, map picker for location, radius slider, alerts toggle (arrival/departure) | Empty, error (duplicate name) |
| S10 | Drive reports | Bottom nav → Drives | See driving safety history | List of drives, summary stats (score, speeding, hard braking, phone use) | Loading, empty |
| S11 | Drive detail | Tap a drive | Detailed driving analysis | Trip timeline, events (hard brake, speeding, phone use), score | Loading, no events |
| S12 | SOS screen | Emergency button | Trigger emergency alert | Big SOS button, confirmation, success state | Ready, confirmed, sent |
| S13 | Crash alert | Auto-triggered | Notify after detected crash | Alert dialog, member notifications, emergency contacts | Triggered, cancelled, confirmed |
| S14 | Membership screen | Bottom nav → Membership | Show subscription status & upgrade options | Current plan badge, feature comparison table, upgrade buttons | Free, Silver, Gold, Platinum |
| S15 | Subscription checkout | From S14 upgrade | Enter payment info | Credit card form, Apple Pay/Google Pay, subscription terms | Loading, error, success |
| S16 | Settings | Bottom nav → Settings | Account & app settings | Profile edit, privacy, notifications, app version | Loading |
| S17 | Profile edit | From Settings → Profile | Edit personal info | Name, photo, email, phone | Loading, error |
| S18 | Location history | Detail screen | View past locations | Timeline map, list of past positions | Loading, empty |
| S19 | Notification center | Pull down or bell icon | View alerts & messages | Alert cards, read/unread, mark all read | Loading, empty |
| S20 | Help center | Settings → Help | FAQs and support | Article list, search, contact support | Loading, empty |

---

## Step 2: User Flows

### F01 New user joins a Circle
- S02 sign up → S03 intro → S05 join via code → S06 map
- Edge: already has circle, network error during join

### F02 Create a new Circle
- S02 sign up → S03 intro → S04 create circle → S07 invite members → S06 map
- Edge: no contacts available, invite sent but not accepted

### F03 View member location
- S06 map → tap member pin → S07 detail
- Edge: member offline, no location shared, battery low

### F04 Set up a Place Alert
- S06 map → Places (S08) → Add place (S09) → configure name/radius/alerts → save
- Edge: place already exists, GPS weak, permission denied

### F05 Review driving report
- S06 map → Drives (S10) → tap drive → S11 detail
- Edge: no drives recorded, drive still in progress

### F06 Trigger SOS
- S06 map → SOS button → S12 confirm → send alert to circle
- Edge: no internet, cancelled before confirm

### F07 Upgrade membership
- S06 map → Membership (S14) → select tier → S15 checkout → success
- Edge: payment declined, network timeout, already subscribed

---

## Step 3: Components

| Component | Variants | States | Screens used |
|-----------|----------|--------|--------------|
| Bottom Navigation | 4 tabs: Map, Drives, Places, Membership | active/inactive | All main screens |
| Member Pin | Default, online, offline, high battery, low battery, charging | 6 states | S06 map |
| Place Card | Default, alert enabled, alert disabled, editing | 4 states | S08 places |
| Drive Card | Default, scored, with events | 3 states | S10 drives |
| Membership Card | Silver, Gold, Platinum, Free | 4 variants | S14 membership |
| SOS Button | Normal, pressed, confirmed, sent | 4 states | S12 sos |
| Alert Badge | Unread, read | 2 states | S19 notifications |
| Progress Skeleton | List, grid, single | 3 variants | Loading states |
| Empty State | No members, no places, no drives, no history | 4 variants | S06, S08, S10 |
| Error Dialog | Network error, permission denied, generic | 3 variants | Various |

---

## Step 4: Inferred Data Model

### Users
- `id uuid`, `email text`, `phone text`, `name text`, `avatar_url text`, `password_hash text`, `created_at`, `updated_at`
- evidence: S02 sign up, S17 profile
- confidence: high

### Circles
- `id uuid`, `name text`, `created_by uuid (users.id)`, `created_at`, `updated_at`
- evidence: S04 create circle, S05 join
- confidence: high

### Circle Members
- `id uuid`, `circle_id uuid (circles.id)`, `user_id uuid (users.id)`, `role enum(admin/member)`, `joined_at`, `status enum(active/left)`
- evidence: S04/S05 member management
- confidence: high

### Places
- `id uuid`, `circle_id uuid (circles.id)`, `name text`, `latitude decimal`, `longitude decimal`, `radius_meters integer`, `created_at`, `owner_id uuid (users.id)`
- evidence: S08/S09 places
- confidence: high

### Place Alerts
- `id uuid`, `place_id uuid (places.id)`, `circle_id uuid (circles.id)`, `arrival_alert boolean`, `departure_alert boolean`, `enabled boolean`
- evidence: S09 place configuration
- confidence: high

### Member Locations (real-time)
- `id uuid`, `circle_member_id uuid (circle_members.id)`, `latitude decimal`, `longitude decimal`, `battery_level integer`, `charging boolean`, `last_seen_at timestamptz`, `is_online boolean`
- evidence: S06 map pins
- confidence: high

### Drives
- `id uuid`, `circle_member_id uuid (circle_members.id)`, `started_at timestamptz`, `ended_at timestamptz`, `duration_seconds integer`, `distance_meters integer`, `avg_speed_kmh decimal`, `max_speed_kmh decimal`, `driving_score decimal`, `created_at`
- evidence: S10/S11 drive reports
- confidence: high

### Drive Events
- `id uuid`, `drive_id uuid (drives.id)`, `event_type enum(hard_brake, rapid_accel, speeding, phone_use, fatigue)`, `detected_at timestamptz`, `severity integer`, `description text`
- evidence: S11 drive detail events
- confidence: high

### SOS Alerts
- `id uuid`, `circle_id uuid (circles.id)`, `initiator_id uuid (circle_members.id)`, `location_lat decimal`, `location_lon decimal`, `status enum(triggered, acknowledged, resolved, cancelled)`, `created_at`, `resolved_at`
- evidence: S12/S13 SOS/crash
- confidence: high

### Notifications
- `id uuid`, `circle_id uuid (circles.id)`, `user_id uuid (users.id)`, `type enum(place_alert, sos, drive_summary, crash_alert, membership)`, `title text`, `body text`, `read boolean`, `created_at`
- evidence: S19 notifications
- confidence: high

### Memberships
- `id uuid`, `user_id uuid (users.id)`, `circle_id uuid (circles.id)`, `tier enum(silver,gold,platinum)`, `status enum(active,cancelled,expired)`, `started_at`, `ends_at`, `stripe_subscription_id text`, `created_at`, `updated_at`
- evidence: S14/S15 membership
- confidence: high

---

## Step 5: Feature Matrix

See `features.csv` for detailed breakdown.

---

## Step 6: Features That Cannot Be Cloned

| Feature | Reason |
|---------|--------|
| Patented crash detection algorithm | Proprietary tech, requires Life360's backend inference |
| Tile hardware integration | Physical product owned by Life360 |
| Uber integration | Requires Uber API partnership |
| Plaid financial linking | Requires Plaid business agreement |
| ID theft protection | Partner service (Aura/Link) |
| Live agent emergency dispatch | Requires 24/7 call center partnership |
| Roadside assistance | Partner network (AAA etc.) |
| Pet GPS tracking | Physical Tile device required |

---

## Step 7: Size Estimate

- **Screens:** 20 identified
- **Flows:** 7 core flows
- **Entities:** 11 tables
- **Hard parts:** Real-time location sync, driving event detection (on-device), push notifications, map rendering, subscription management
- **Size:** M (a few weeks for MVP)

---

## Next Step
Run `/replica-architect` to define stack, database schema, and API.