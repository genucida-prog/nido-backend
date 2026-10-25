import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/store/app';
import { supabase } from '@/lib/supabase';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function SOSConfirmScreen() {
  const router = useRouter();
  const { currentCircle, user } = useStore();
  const [countdown, setCountdown] = useState(5);
  const [isSending, setIsSending] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Get circle_member_id for current user
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!currentCircle || !user) return;
      const token = await getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/circles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const circles = await res.json();
        const circle = Array.isArray(circles) ? circles.find((c: any) => c.id === currentCircle.id) : null;
        const member = circle?.circle_members?.find((m: any) => m.user?.id === user.id);
        setMemberId(member?.id ?? null);
      } catch (e) {
        console.error('Failed to fetch member ID:', e);
      }
    };
    fetchMemberId();
  }, [currentCircle, user]);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const handleConfirm = async () => {
    if (!currentCircle || !user || !memberId) return;

    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    try {
      // Get current location
      const loc = await new Promise<any>((resolve, reject) => {
        import('expo-location').then(({ requestForegroundPermissionsAsync, getCurrentPositionAsync }) => {
          requestForegroundPermissionsAsync().then(async ({ status }) => {
            if (status === 'granted') {
              const position = await getCurrentPositionAsync({ accuracy: 3 });
              resolve(position.coords);
            } else {
              reject(new Error('Permiso de ubicación denegado'));
            }
          });
        });
      });

      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      const res = await fetch(`${API_BASE}/api/sos/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          circleId: currentCircle.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar SOS');

      Alert.alert(
        'Alerta enviada',
        'Tu círculo ha sido notificado con tu ubicación.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-sos-dark items-center justify-center px-6">
      {/* SOS Icon */}
      <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center mb-6">
        <Ionicons name="emergency" size={64} color="#fff" />
      </View>

      <Text className="text-white text-3xl font-bold mb-2">SOS</Text>
      <Text className="text-white/80 text-center text-base mb-8">
        ¿Estás seguro de que necesitas ayuda? Se notificará a todos los miembros de tu círculo.
      </Text>

      {countdown > 0 && !isSending && (
        <View className="mb-8 items-center">
          <Text className="text-white text-6xl font-bold">{countdown}</Text>
          <Text className="text-white/60 text-sm mt-2">Enviando en {countdown} segundos...</Text>
        </View>
      )}

      <View className="w-full space-y-3">
        <TouchableOpacity
          className="bg-white py-4 rounded-xl items-center"
          onPress={handleConfirm}
          disabled={countdown > 0 || isSending}
        >
          <Text className={`font-semibold text-base ${countdown > 0 || isSending ? 'text-gray-400' : 'text-sos'}`}>
            {isSending ? 'Enviando...' : countdown > 0 ? 'Esperando...' : 'Confirmar SOS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/20 py-4 rounded-xl items-center"
          onPress={handleCancel}
          disabled={countdown > 0}
        >
          <Text className="text-white font-semibold text-base">
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-white/40 text-xs mt-8 text-center">
        Esta acción enviará una notificación de emergencia con tu ubicación a todos los miembros de tu círculo.
      </Text>
    </View>
  );
}
