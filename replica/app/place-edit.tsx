import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function PlaceEditScreen() {
  const router = useRouter();
  const { currentCircle } = useStore();
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(19.4326);
  const [longitude, setLongitude] = useState(-99.1332);
  const [radius, setRadius] = useState(100);
  const [arrivalAlert, setArrivalAlert] = useState(true);
  const [departureAlert, setDepartureAlert] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !currentCircle) {
      Alert.alert('Error', 'El nombre del lugar es requerido');
      return;
    }
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      // Create place via backend
      const res = await fetch(`${API_BASE}/api/places/circle/${currentCircle.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          latitude,
          longitude,
          radiusMeters: radius,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear lugar');

      // Configure alerts
      await fetch(`${API_BASE}/api/places/${data.id}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          arrivalAlert,
          departureAlert,
          enabled: true,
        }),
      });

      Alert.alert('Éxito', 'Lugar creado correctamente');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar lugar',
      '¿Estás seguro de eliminar este lugar? Se eliminarán todas las alertas asociadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;
              await fetch(`${API_BASE}/api/places/placeholder`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              router.back();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0D9488" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
          Nuevo lugar
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text className="text-accent font-semibold">{saving ? '...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4 space-y-4">
          {/* Name */}
          <View className="bg-surface-elevated rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-medium text-text-muted mb-2">Nombre del lugar</Text>
            <TextInput
              className="text-text text-base border-b border-border pb-2"
              value={name}
              onChangeText={setName}
              placeholder="Ej: Casa, Escuela, Trabajo"
              autoCapitalize="words"
            />
          </View>

          {/* Radius */}
          <View className="bg-surface-elevated rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-medium text-text-muted mb-2">
              Radio de alerta: {radius}m
            </Text>
            <View className="py-2">
              <View className="h-2 bg-surface rounded-full overflow-hidden">
                <View
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${((radius - 50) / (500 - 50)) * 100}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-text-muted text-xs">50m</Text>
                <Text className="text-text-muted text-xs">500m</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                  className="bg-surface rounded-lg px-3 py-1"
                  onPress={() => setRadius(Math.max(50, radius - 50))}
                >
                  <Text className="text-text text-xs">-50m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-surface rounded-lg px-3 py-1"
                  onPress={() => setRadius(Math.min(500, radius + 50))}
                >
                  <Text className="text-text text-xs">+50m</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Alerts */}
          <View className="bg-surface-elevated rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-medium text-text-muted mb-3">Alertas</Text>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <Ionicons name="navigate" size={20} color="#0D9488" />
                <Text className="text-text ml-2">Al llegar</Text>
              </View>
              <ToggleSwitch
                value={arrivalAlert}
                onToggle={setArrivalAlert}
              />
            </View>

            <View className="flex-row items-center justify-between py-2 border-t border-border">
              <View className="flex-row items-center">
                <Ionicons name="exit" size={20} color="#dc2626" />
                <Text className="text-text ml-2">Al salir</Text>
              </View>
              <ToggleSwitch
                value={departureAlert}
                onToggle={setDepartureAlert}
              />
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

function ToggleSwitch({ value, onToggle }: { value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      className={`w-12 h-7 rounded-full items-center py-0.5 ${value ? 'bg-success' : 'bg-gray-300'}`}
      onPress={() => onToggle(!value)}
    >
      <View className={`w-6 h-6 bg-white rounded-full shadow-sm ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </TouchableOpacity>
  );
}
