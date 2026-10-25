-- Migration 003: join codes for circles (Members API)
-- Reversible: down drops the column and index.

alter table circles add column if not exists join_code text;

-- Populate existing circles with a unique 6-digit code
update circles
set join_code = lpad(floor(random() * 900000 + 100000)::int::text, 6, '0')
where join_code is null;

-- Ensure uniqueness (retry collisions with a second pass)
with dups as (
  select id, row_number() over (partition by join_code order by created_at) as rn
  from circles
)
update circles c
set join_code = lpad(floor(random() * 900000 + 100000)::int::text, 6, '0')
from dups d
where c.id = d.id and d.rn > 1;

create unique index if not exists circles_join_code_key on circles (join_code);

comment on column circles.join_code is '6-digit code members use to join the circle (expires client-side after 24h)';
