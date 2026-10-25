-- Supabase Migration 001: Core tables
create extension if not exists "uuid-ossp";

-- Users
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

-- Circles
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

-- SOS alerts
create table sos_alerts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references circles(id) on delete cascade,
  initiator_id uuid not null references circle_members(id) on delete cascade,
  location_lat decimal,
  location_lon decimal,
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