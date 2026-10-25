import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/app';
import { supabase } from '@/lib/supabase';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

interface MemberData {
  id: string;
  user_id: string;
  circle_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  location: {
    latitude: number;
    longitude: number;
    battery_level: number | null;
    charging: boolean;
    is_online: boolean;
    last_seen_at: string;
  } | null;
}

export default function MemberDetailScreen() {
  const router = useRouter();
  const { currentCircle } = useStore();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!currentCircle) { setLoading(false); return; }
      const token = await getToken();
      if (!token) { setLoading(false); return; }

      try {
        const res = await fetch(`${API_BASE}/api/locations/${currentCircle.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMember(data[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load member:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentCircle]);

  const handleCall = () => {
    if (!member) return;
    Alert.alert('Llamar', `¿Llamar a ${member.user?.name}?`);
  };

  const handleSendMessage = () => {
    router.back();
  };

  const handleShareLocation = () => {
    Alert.alert('Compartir ubicación', 'Funcionalidad de compartir ubicación');
  };

  const handleSOS = () => {
    if (!member) return;
    Alert.alert('SOS', `¿Enviar alerta SOS a ${member.user?.name}?`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (!member) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-text-muted">No hay miembros en este círculo</Text>
      </View>
    );
  }

  const loc = member.location;

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0D9488" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
          {member.user?.name}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-6 bg-surface-elevated mx-4 mt-4 rounded-xl shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className={`w-16 h-16 rounded-full ${member.user?.name ? 'bg-accent' : 'bg-gray-400'} items-center justify-center mr-4`}>
              <Text className="text-white text-2xl font-bold">
                {member.user?.name?.[0] ?? '?'}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <View className={`w-3 h-3 rounded-full ${loc?.is_online ? 'bg-success' : 'bg-gray-400'} mr-2`} />
                <Text className="text-text font-semibold text-lg">
                  {loc?.is_online ? 'En línea' : 'Sin conexión'}
                </Text>
              </View>
              <Text className="text-text-muted text-sm">
                Última vez: hace 2 min
              </Text>
            </View>
            {loc?.charging && (
              <View className="bg-warning-light px-3 py-1 rounded-full">
                <Text className="text-warning text-sm font-medium">⚡ Cargando</Text>
              </View>
            )}
          </View>

          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-text-muted text-sm">Batería</Text>
              <Text className={`text-sm font-medium ${loc?.battery_level && loc.battery_level < 20 ? 'text-danger' : 'text-text'}`}>
                {loc?.battery_level ?? '--'}%
              </Text>
            </View>
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${loc?.battery_level && loc.battery_level < 20 ? 'bg-danger' : loc?.battery_level && loc.battery_level < 50 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${loc?.battery_level ?? 0}%` }}
              />
            </View>
          </View>
        </View>

        <View className="px-4 py-4 bg-surface-elevated mx-4 my-4 rounded-xl shadow-sm">
          <Text className="text-text font-semibold text-base mb-2">Ubicación</Text>
          <View className="bg-surface rounded-lg h-32 items-center justify-center mb-2">
            <Ionicons name="map" size={32} color="#b0b8c4" />
            <Text className="text-text-muted text-sm mt-2">Mapa interactivo</Text>
          </View>
          <Text className="text-text-muted text-sm">
            📍 {loc?.latitude?.toFixed(4)}, {loc?.longitude?.toFixed(4)}
          </Text>
        </View>

        <View className="px-4 py-4">
          <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Acciones
          </Text>

          <View className="flex-row justify-around">
            <TouchableOpacity
              className="items-center p-4 bg-surface-elevated rounded-xl shadow-sm flex-1 mr-2"
              onPress={handleCall}
            >
              <Ionicons name="call" size={24} color="#0D9488" />
              <Text className="text-text text-sm mt-2 font-medium">Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center p-4 bg-surface-elevated rounded-xl shadow-sm flex-1 mx-2"
              onPress={handleSendMessage}
            >
              <Ionicons name="chatbubble" size={24} color="#0D9488" />
              <Text className="text-text text-sm mt-2 font-medium"> Mensaje </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center p-4 bg-surface-elevated rounded-xl shadow-sm flex-1 ml-2"
              onPress={handleShareLocation}
            >
              <Ionicons name="share" size={24} color="#0D9488" />
              <Text className="text-text text-sm mt-2 font-medium">Compartir</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-sos py-4 rounded-xl items-center mt-4"
            onPress={handleSOS}
          >
            <Ionicons name="emergency" size={20} color="#fff" />
            <Text className="text-white font-semibold text-base mt-1">
              Enviar SOS a {member.user?.name}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
