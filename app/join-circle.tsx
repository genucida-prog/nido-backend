import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function JoinCircleScreen() {
  const router = useRouter();
  const { setCurrentCircle } = useStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useStore();

  const getToken = async (): Promise<string | null> => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('Error', 'Ingresa un código de 6 dígitos');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      const res = await fetch(`${API_BASE}/api/members/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al unirse');

      // Fetch circles to get the full circle data
      const circlesRes = await fetch(`${API_BASE}/api/circles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const circles = await circlesRes.json();
      const joinedCircle = Array.isArray(circles) ? circles.find((c: any) => c.circle_members?.some((m: any) => m.id === data.member?.id)) : null;

      setCurrentCircle(joinedCircle ?? { id: '', name: 'Círculo' });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface px-6 justify-center">
      <Text className="text-2xl font-bold text-text mb-2">Unirse a un Círculo</Text>
      <Text className="text-text-muted mb-8">
        Ingresa el código de 6 dígitos que te compartió alguien de tu círculo
      </Text>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-text mb-1">Código del círculo</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text text-center text-2xl font-mono tracking-widest"
            placeholder="••••••"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            maxLength={6}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          className="bg-accent py-4 rounded-md items-center mt-4"
          onPress={handleJoin}
          disabled={loading}
        >
          <Text className="text-on-accent font-semibold text-base">
            {loading ? 'Uniendo...' : 'Unirse'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-text-muted text-center text-sm mt-4">Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
