// Tipos para la base de datos usando Supabase directamente
export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type Circle = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CircleMember = {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  status: 'active' | 'left';
};

export type Place = {
  id: string;
  circle_id: string;
  owner_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
};

export type PlaceAlert = {
  id: string;
  place_id: string;
  circle_id: string;
  user_id: string | null;
  arrival_alert: boolean;
  departure_alert: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type MemberLocation = {
  id: string;
  circle_member_id: string;
  latitude: number;
  longitude: number;
  battery_level: number | null;
  charging: boolean | null;
  is_online: boolean;
  last_seen_at: string;
  updated_at: string;
};

export type Drive = {
  id: string;
  circle_member_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  driving_score: number | null;
  created_at: string;
};

export type DriveEvent = {
  id: string;
  drive_id: string;
  event_type: 'hard_brake' | 'rapid_accel' | 'speeding' | 'phone_use' | 'fatigue';
  detected_at: string;
  severity: number;
  description: string | null;
};

export type SosAlert = {
  id: string;
  circle_id: string;
  initiator_id: string;
  location_lat: number | null;
  location_lon: number | null;
  status: 'triggered' | 'acknowledged' | 'resolved' | 'cancelled';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  circle_id: string;
  user_id: string;
  type: 'place_alert' | 'sos' | 'drive_summary' | 'crash_alert' | 'membership' | 'promo';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  circle_id: string;
  tier: 'free' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};