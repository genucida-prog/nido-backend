-- Migration 005: unique constraint on places (circle_id, name)
-- This enforces duplicate-name rejection at the DB level (error 23505).
-- Safe to run even if the index already exists (if not exists guard).
-- Reversible: down drops the constraint and deletes duplicate rows keeping
-- the newest record per (circle_id, name).

-- 1. Keep one row per duplicate (newest by created_at), delete the rest
delete from places a
using places b
where a.circle_id = b.circle_id
  and a.name = b.name
  and a.id < b.id;

-- 2. Unique index
create unique index if not exists places_circle_name_key
  on places (circle_id, name);
