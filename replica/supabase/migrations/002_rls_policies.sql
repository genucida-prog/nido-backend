-- RLS policies for core tables
-- Apply after 001_core.sql

-- Enable RLS on all tables
alter table users enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table places enable row level security;
alter table place_alerts enable row level security;
alter table member_locations enable row level security;
alter table drives enable row level security;
alter table drive_events enable row level security;
alter table sos_alerts enable row level security;
alter table notifications enable row level security;
alter table memberships enable row level security;

-- Users: everyone can read their own profile, update their own
create policy "Users can read own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Circles: members can view
create policy "Circle members can view circle" on circles
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = circles.id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Circle members: members can view their circle's members
create policy "Circle members can view members" on circle_members
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = circle_members.circle_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Places: members can view their circle's places
create policy "Circle members can view places" on places
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = places.circle_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Place alerts: same as places
create policy "Circle members can view place alerts" on place_alerts
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = place_alerts.circle_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Member locations: members can view their circle's locations
create policy "Circle members can view locations" on member_locations
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = (select circle_id from circle_members where id = member_locations.circle_member_id)
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Drives: members can view their own drives + circle members' summary drives
create policy "Members can view own drives" on drives for select
  using (
    exists (
      select 1 from circle_members cm
      where cm.id = drives.circle_member_id
      and cm.user_id = auth.uid()
    )
  );

-- Drive events: same as drives
create policy "Members can view drive events" on drive_events for select
  using (
    exists (
      select 1 from drives d
      join circle_members cm on cm.id = d.circle_member_id
      where d.id = drive_events.drive_id
      and cm.user_id = auth.uid()
    )
  );

-- SOS alerts: circle members can view
create policy "Circle members can view SOS alerts" on sos_alerts
  for all using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = sos_alerts.circle_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
    )
  );

-- Notifications: only the target user
create policy "Users can read own notifications" on notifications
  for select using (user_id = auth.uid());
create policy "Users can update own notifications" on notifications
  for update using (user_id = auth.uid());
create policy "Users can delete own notifications" on notifications
  for delete using (user_id = auth.uid());

-- Memberships: member can view their own, admin can view all for circle
create policy "Members can view own membership" on memberships
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from circle_members cm
      where cm.circle_id = memberships.circle_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );