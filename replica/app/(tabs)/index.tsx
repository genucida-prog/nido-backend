import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useStore } from '@/store/app';

interface MemberInfo {
  id: string;
  circle_member_id: string;
  latitude: number;
  longitude: number;
  battery_level: number | null;
  charging: boolean;
  is_online: boolean;
  last_seen_at: string;
  member?: {
    id: string;
    user_id: string;
    circle_id: string;
    role: string;
    status: string;
    joined_at: string;
    user?: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };
}

export default function MapScreen() {
  const router = useRouter();
  const { user, currentCircle, setUser, setCircles, setCurrentCircle } = useStore();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCoords, setMyCoords] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  const API_BASE = 'https://nido-backend-8ig7.onrender.com';

  // Get auth token from user state
  const getToken = async (): Promise<string | null> => {
    try {
      const { getSession } = await import('@supabase/supabase-js');
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch circles
      try {
        const circlesRes = await fetch(`${API_BASE}/api/circles`, { headers });
        if (circlesRes.ok) {
          const circlesData = await circlesRes.json();
          if (Array.isArray(circlesData)) {
            setCircles(circlesData);
            if (!currentCircle && circlesData.length > 0) {
              setCurrentCircle(circlesData[0]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch circles:', e);
      }

      // Get user info
      try {
        const meRes = await fetch(`${API_BASE}/api/user/me`, { headers });
        if (meRes.ok) {
          const userData = await meRes.json();
          setUser(userData);
        }
      } catch (e) {
        console.error('Failed to fetch user:', e);
      }
    };

    loadData();
  }, []);

  // Fetch members and locations
  useEffect(() => {
    if (!currentCircle) return;

    const fetchMembers = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/locations/${currentCircle.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMembers(data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch locations:', e);
      }
    };

    fetchMembers();

    // Poll every 15 seconds
    const interval = setInterval(fetchMembers, 15000);
    return () => clearInterval(interval);
  }, [currentCircle]);

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setMyCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  // Send location update
  useEffect(() => {
    if (!myCoords || !currentCircle) return;

    const sendLocation = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        await fetch(`${API_BASE}/api/locations/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: myCoords.lat,
            longitude: myCoords.lon,
            batteryLevel: null,
            isCharging: false,
          }),
        });
      } catch (e) {
        console.error('Failed to update location:', e);
      }
    };

    sendLocation();
    const interval = setInterval(sendLocation, 60000); // Every minute
    return () => clearInterval(interval);
  }, [myCoords, currentCircle]);

  const handleSOS = () => {
    router.push('/sos-confirm');
  };

  const centerOnUser = () => {
    if (myCoords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: myCoords.lat,
        longitude: myCoords.lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F766E" />
          <Text className="text-text-muted mt-2">Cargando...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            className="flex-1"
            initialRegion={{
              latitude: myCoords?.lat ?? 19.4326,
              longitude: myCoords?.lon ?? -99.1332,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Current user location */}
            {myCoords && (
              <Marker
                coordinate={{ latitude: myCoords.lat, longitude: myCoords.lon }}
                pinColor="#0F766E"
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-accent items-center justify-center border-2 border-white shadow-lg">
                    <Text className="text-white text-lg font-bold">
                      {user?.name?.[0] ?? 'Yo'}
                    </Text>
                  </View>
                </View>
                <Callout>
                  <View className="w-32">
                    <Text className="font-bold text-text text-center">{user?.name ?? 'Tú'}</Text>
                    <Text className="text-text-muted text-center text-xs">Tu ubicación</Text>
                  </View>
                </Callout>
              </Marker>
            )}

            {/* Other members */}
            {members.map((member) => (
              <Marker
                key={member.circle_member_id}
                coordinate={{
                  latitude: parseFloat(member.latitude) || 0,
                  longitude: parseFloat(member.longitude) || 0,
                }}
              >
                <View className="items-center">
                  <View
                    className={`w-10 h-10 rounded-full ${member.is_online ? 'bg-success' : 'bg-gray-400'} items-center justify-center border-2 border-white`}
                  >
                    <Text className="text-white text-sm font-bold">
                      {member.member?.user?.name?.[0] ?? '?'}
                    </Text>
                  </View>
                  {member.charging && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full items-center justify-center">
                      <Text className="text-white text-xs">⚡</Text>
                    </View>
                  )}
                </View>
                <Callout>
                  <View className="w-32">
                    <Text className="font-bold text-text text-center">
                      {member.member?.user?.name ?? 'Miembro'}
                    </Text>
                    <Text className="text-text-muted text-center text-xs">
                      {member.is_online ? '🟢 En línea' : '⚪ Sin conexión'}
                    </Text>
                    {member.battery_level != null && (
                      <Text className="text-text-muted text-center text-xs">
                        🔋 {member.battery_level}%
                      </Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* SOS FAB */}
          <TouchableOpacity
            className="absolute bottom-24 right-4 w-16 h-16 bg-sos rounded-full items-center justify-center shadow-pop"
            onPress={handleSOS}
            accessibilityLabel="Botón de emergencia SOS"
          >
            <Text className="text-white text-xl font-bold">SOS</Text>
          </TouchableOpacity>

          {/* My location button */}
          <TouchableOpacity
            className="absolute bottom-4 right-4 w-12 h-12 bg-surface-elevated rounded-full items-center justify-center shadow-card"
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color="#0F766E" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
