import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function CreateCircleScreen() {
  const router = useRouter();
  const { setCurrentCircle } = useStore();
  const [circleName, setCircleName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useStore();

  const getToken = async (): Promise<string | null> => {
    try {
      const { getSession } = await import('@supabase/supabase-js');
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const handleCreate = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'El nombre del círculo es requerido');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      const res = await fetch(`${API_BASE}/api/circles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: circleName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear círculo');

      setCurrentCircle({ id: data.id, name: data.name, created_by: data.created_by });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface px-6 justify-center">
      <Text className="text-2xl font-bold text-text mb-2">Crear Círculo</Text>
      <Text className="text-text-muted mb-8">
        Un círculo es tu grupo familiar. Añade a tus seres queridos para compartir ubicación.
      </Text>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-text mb-1">Nombre del círculo</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text text-center text-lg"
            placeholder="Ej: Mi Familia"
            value={circleName}
            onChangeText={setCircleName}
            autoFocus
          />
        </View>

        <TouchableOpacity
          className="bg-accent py-4 rounded-md items-center mt-4"
          onPress={handleCreate}
          disabled={loading}
        >
          <Text className="text-on-accent font-semibold text-base">
            {loading ? 'Creando...' : 'Crear y continuar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-text-muted text-center text-sm">Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
