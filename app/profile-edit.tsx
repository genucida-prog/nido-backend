import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para subir tu foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    const ext = uri.split('.').pop();
    const filePath = `avatars/${user.id}.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, { uri, contentType: `image/${ext}` });

    if (error) {
      Alert.alert('Error', 'No se pudo subir la imagen');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Update via backend API
    try {
      const token = await getToken();
      if (token) {
        await fetch(`${API_BASE}/api/user/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar_url: publicUrl }),
        });
      }
    } catch (e) {
      console.error('Failed to update avatar via API:', e);
    }

    setUser({ ...user, avatar_url: publicUrl });
  };

  const saveProfile = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      const res = await fetch(`${API_BASE}/api/user/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error al guardar');
      }

      setUser({ ...user, name: name.trim() });
      Alert.alert('Éxito', 'Perfil actualizado');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0D9488" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
          Editar perfil
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Avatar */}
        <View className="items-center py-8">
          <TouchableOpacity onPress={pickImage} className="relative">
            <View className="w-24 h-24 rounded-full bg-accent items-center justify-center">
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} className="w-24 h-24 rounded-full" />
              ) : (
                <Text className="text-white text-3xl font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full items-center justify-center border-2 border-bg">
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="text-text-muted text-sm mt-2">Toca para cambiar foto</Text>
        </View>

        {/* Form */}
        <View className="px-4 space-y-4 pb-8">
          <View className="bg-surface-elevated rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-medium text-text-muted mb-1">Nombre</Text>
            <TextInput
              className="text-text text-base border-b border-border pb-2"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {user?.email && (
            <View className="bg-surface-elevated rounded-xl p-4 shadow-sm">
              <Text className="text-sm font-medium text-text-muted mb-1">Email</Text>
              <Text className="text-text text-base">{user.email}</Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-accent py-4 rounded-xl items-center mt-4"
            onPress={saveProfile}
            disabled={saving}
          >
            <Text className="text-on-accent font-semibold text-base">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
