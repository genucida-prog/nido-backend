import { create } from 'zustand';

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Circle = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  membership_tier?: 'free' | 'silver' | 'gold' | 'platinum';
};

export type CircleMember = {
  id: string;
  user_id: string;
  circle_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  status: 'active' | 'left';
  user?: User;
};

export type MemberLocation = {
  id: string;
  circle_member_id: string;
  latitude: number;
  longitude: number;
  battery_level: number | null;
  charging: boolean;
  is_online: boolean;
  last_seen_at: string;
  member?: CircleMember;
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

type AppState = {
  user: User | null;
  setUser: (user: User | null) => void;
  circles: Circle[];
  setCircles: (circles: Circle[]) => void;
  currentCircle: Circle | null;
  setCurrentCircle: (circle: Circle | null) => void;
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  circles: [],
  setCircles: (circles) => set({ circles }),
  currentCircle: null,
  setCurrentCircle: (circle) => set({ currentCircle: circle }),
}));