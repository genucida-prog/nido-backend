# Architecture Plan — Family Safety App (Life360 Clone)

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Mobile | **Expo (React Native)** | Cross-platform, fast iteration, EAS Build for APK generation, free tier generous |
| Web admin | **Next.js 15 (App Router) + TypeScript** | Same codebase feel, SEO for landing page, standard stack |
| Styling | **Tailwind CSS** | Fast UI, tokens from design system, responsive |
| Database | **Supabase (Postgres)** | Free tier includes Postgres + realtime subscriptions + auth + storage |
| ORM | **Drizzle ORM** | Type-safe, works with Supabase, migrations built-in |
| Auth | **Supabase Auth** | Email/password + Google + Apple + phone OTP, row-level security built-in |
| Payments | **Stripe Checkout + Billing Portal** | Official API, test mode free, no PCI compliance needed |
| Push notifications | **Expo Push Notifications** | Free tier, works with both FCM and APNs |
| Realtime location | **Supabase realtime subscriptions** | Built-in Postgres CHANGE queries, no separate infra |
| File storage | **Supabase Storage** | Profile photos, free tier 1GB |
| Email | **Resend** | Free tier 3k emails/month, clean API |
| Jobs/reminders | **Vercel Cron** | Free, simple schedule-based jobs |
| Hosting | **Vercel** (web) + **EAS** (mobile) | Both free tiers sufficient for MVP |

**One database. No microservices.** The clone needs features, not architecture points.

---

## Database Schema

```sql
-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  name text not null default '',
  avatar_url text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Circles table
create table circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Circle members
create table circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','left')),
  constraint circle_members_circle_user_unique unique (circle_id, user_id)
);
create index on circle_members (circle_id);
create index on circle_members (user_id);

-- Places
create table places (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  latitude decimal not null,
  longitude decimal not null,
  radius_meters integer not null default 100,
  created_at timestamptz not null default now(),
  constraint places_circle_name_unique unique (circle_id, name)
);
create index on places (circle_id);

-- Place alerts
create table place_alerts (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  arrival_alert boolean not null default true,
  departure_alert boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on place_alerts (place_id);
create index on place_alerts (circle_id);

-- Member locations (real-time)
create table member_locations (
  id uuid primary key default gen_random_uuid(),
  circle_member_id uuid not null references circle_members(id) on delete cascade,
  latitude decimal not null,
  longitude decimal not null,
  battery_level integer,
  charging boolean,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on member_locations (circle_member_id);
create index on member_locations (last_seen_at);

-- Drives
create table drives (
  id uuid primary key default gen_random_uuid(),
  circle_member_id uuid not null references circle_members(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  distance_meters integer,
  avg_speed_kmh decimal,
  max_speed_kmh decimal,
  driving_score decimal,
  created_at timestamptz not null default now()
);
create index on drives (circle_member_id);
create index on drives (started_at);

-- Drive events
create table drive_events (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references drives(id) on delete cascade,
  event_type text not null check (event_type in ('hard_brake','rapid_accel','speeding','phone_use','fatigue')),
  detected_at timestamptz not null,
  severity integer not null default 1,
  description text
);
create index on drive_events (drive_id);

-- SOS / Crash alerts
create table sos_alerts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  initiator_id uuid not null references circle_members(id) on delete cascade,
  latitude decimal,
  longitude decimal,
  status text not null default 'triggered' check (status in ('triggered','acknowledged','resolved','cancelled')),
  acknowledged_by uuid references circle_members(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index on sos_alerts (circle_id);
create index on sos_alerts (created_at);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('place_alert','sos','drive_summary','crash_alert','membership','promo')),
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, read);
create index on notifications (circle_id, created_at);

-- Memberships
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  circle_id uuid not null references circles(id) on delete cascade,
  tier text not null check (tier in ('free','silver','gold','platinum')),
  status text not null default 'active' check (status in ('active','cancelled','expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on memberships (user_id);
create index on memberships (circle_id);
create unique index on memberships (user_id, circle_id, status) where status = 'active';
```

### Row Level Security (Supabase)

```sql
-- Every query must check circle membership
alter table circles enable row level security;
create policy "Circle members can view circle" on circles
  for all using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circles.id
      and circle_members.user_id = auth.uid()
      and circle_members.status = 'active'
    )
  );

-- Apply same pattern to all tables with circle_id
-- member_locations: only circle members can read
-- drives: only circle members can read their own drives + admin can read all
-- notifications: only the target user can read
-- memberships: only the member and admin can read
```

---

## API (Server Actions / REST)

### Auth
```
POST /api/auth/signup           | Create user + account        | public
POST /api/auth/login            | Email/password login         | public
POST /api/auth/google           | OAuth Google sign in         | public
POST /api/auth/apple            | OAuth Apple sign in          | public
POST /api/auth/phone-otp/send   | Send SMS OTP                 | public
POST /api/auth/phone-otp/verify | Verify phone OTP             | public
POST /api/auth/forgot-password  | Send reset email             | public
POST /api/auth/reset-password   | Reset password               | public
POST /api/auth/logout           | Invalidate session           | auth required
GET  /api/auth/me               | Current user profile         | auth required
PATCH /api/auth/me              | Update profile               | auth required
```

### Circles
```
GET    /api/circles              | List circles user belongs to | auth
POST   /api/circles              | Create new circle            | auth
GET    /api/circles/:id          | Circle detail                | auth (member)
PATCH  /api/circles/:id          | Update circle name           | auth (admin)
DELETE /api/circles/:id          | Delete circle                | auth (admin)
```

### Members
```
GET    /api/circles/:id/members          | List members              | auth (member)
POST   /api/circles/:id/members/invite   | Invite by email/phone     | auth (admin)
POST   /api/members/join                 | Join circle via code      | auth
DELETE /api/circles/:id/members/:userId  | Remove member             | auth (admin)
PATCH  /api/circles/:id/members/:userId/role | Change role          | auth (admin)
POST   /api/circles/:id/members/me/leave | Leave circle              | auth (self)
```

### Places
```
GET    /api/circles/:id/places                  | List places       | auth (member)
POST   /api/circles/:id/places                  | Create place      | auth (member)
GET    /api/places/:id                          | Place detail      | auth (member)
PATCH  /api/places/:id                          | Update place      | auth (owner or admin)
DELETE /api/places/:id                          | Delete place      | auth (owner or admin)
POST   /api/places/:id/alerts                   | Configure alerts  | auth (owner or admin)
```

### Locations (realtime)
```
POST   /api/locations/update       | Update current position    | auth
GET    /api/circles/:id/locations  | Live locations for circle  | auth (member)
```

### Drives
```
POST   /api/drives/start           | Start recording drive      | auth
POST   /api/drives/end             | End drive + calculate score| auth
GET    /api/circles/:id/drives     | List drives for circle     | auth (member)
GET    /api/drives/:id             | Drive detail + events      | auth (member, own drive)
GET    /api/drives/:id/events      | Drive events list          | auth (member, own drive)
```

### SOS
```
POST   /api/sos/trigger            | Trigger SOS alert          | auth
POST   /api/sos/:id/acknowledge    | Acknowledge SOS            | auth (member)
POST   /api/sos/:id/resolve        | Resolve SOS                | auth (admin)
GET    /api/circles/:id/sos        | SOS history for circle     | auth (member)
```

### Notifications
```
GET    /api/notifications          | User notifications         | auth
PATCH  /api/notifications/:id/read | Mark as read               | auth (own)
PATCH  /api/notifications/read-all | Mark all read              | auth
DELETE /api/notifications/:id      | Delete notification        | auth (own)
```

### Memberships
```
GET    /api/memberships/circle/:circleId       | Current membership | auth
POST   /api/memberships/checkout               | Create Stripe checkout | auth
POST   /api/memberships/cancel                 | Cancel subscription | auth
GET    /api/memberships/manage                 | Stripe manage portal URL | auth
POST   /api/webhooks/stripe                    | Stripe webhook handler | public (signed)
```

---

## Hard Parts & Risks

| Risk | Mitigation |
|------|-----------|
| **Real-time location sync latency** | Supabase realtime via Postgres CHANGE; target < 3s update |
| **Driving event detection on-device** | Use device accelerometer + gyroscope via Expo; simulate events in test mode |
| **Push notification delivery** | Expo Push (free 500/day) → escalate to Firebase Cloud Messaging for scale |
| **Map rendering performance with many pins** | Cluster markers with react-native-maps; lazy load off-screen members |
| **Subscription race conditions** | Stripe webhook for payment events; idempotent handlers |
| **Offline mode** | Cache last known locations locally; sync on reconnect |
| **GDPR data deletion** | DELETE endpoint cascades through all child tables; automated within 30 days |
| **Time zone handling** | Store all timestamps as `timestamptz` UTC; convert on display |

---

## Build Order

### Milestone 1 — Vertical Slice (week 1)
- Auth (email + Google)
- Create Circle + invite by email
- Join Circle via code
- Main map with member pins (static positions for now)
- Member detail screen
- **Proves:** auth flow, circle creation, basic map rendering

### Milestone 2 — Core Features (weeks 2-3)
- Real-time location updates via Supabase
- Places creation + alerts
- SOS trigger + push notifications
- Driving simulation (on-device sensor events)
- Drive history + score
- **Proves:** realtime sync, sensor integration, push

### Milestone 3 — Monetization (week 4)
- Membership screen with tier comparison
- Stripe Checkout integration
- Feature gating (places limit, history length, drive reports)
- Stripe webhook for subscription events
- **Proves:** payments, feature flags, subscription lifecycle

### Milestone 4 — Polish (week 5)
- Notification center
- Settings + profile editing
- Help center
- Empty states, error states, loading skeletons
- Push notification preferences
- **Proves:** complete UX coverage

---

## Summary

- **Stack:** Expo (RN) + Supabase + Stripe + Vercel
- **Tables:** 11
- **Routes:** ~35 server actions
- **Riskiest parts:** Realtime location sync, on-device driving detection, subscription race conditions
- **Next step:** `/replica-design` — define design tokens, color system, and component specs