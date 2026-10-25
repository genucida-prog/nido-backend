-- Migration 004: one live row per circle member
-- Reversible: down drops the unique index and merges duplicates first.

-- 1. Merge duplicate rows (keep the most recently seen per member)
delete from member_locations a
using member_locations b
where a.circle_member_id = b.circle_member_id
  and (a.last_seen_at < b.last_seen_at
       or (a.last_seen_at = b.last_seen_at and a.ctid < b.ctid));

-- 2. Unique index so upsert(onConflict => 'circle_member_id') is valid
create unique index if not exists member_locations_circle_member_key
  on member_locations (circle_member_id);
