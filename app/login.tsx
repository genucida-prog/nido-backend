import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      // Login through backend
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al iniciar sesión');

      // Get user profile from backend
      const userRes = await fetch(`${API_BASE}/api/user/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const profile = await userRes.json();

      // Also set auth session for Supabase direct queries
      const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionData.user) {
        setUser({
          id: sessionData.user.id,
          email: sessionData.user.email,
          phone: null,
          name: profile.name ?? sessionData.user.user_metadata?.name ?? '',
          avatar_url: sessionData.user.user_metadata?.avatar_url ?? null,
          created_at: sessionData.user.created_at,
        });
        // Store token for API calls
        await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: '',
        });
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface px-6 justify-center">
      {/* Logo */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-accent rounded-2xl items-center justify-center mb-4">
          <Text className="text-4xl">🏠</Text>
        </View>
        <Text className="text-2xl font-bold text-text">Nido</Text>
        <Text className="text-text-muted mt-2 text-center">
          Seguridad familiar gratuita
        </Text>
      </View>

      {/* Form */}
      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-text mb-1">Email</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-text mb-1">Contraseña</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-accent py-4 rounded-md items-center mt-2"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-on-accent font-semibold text-base">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="items-center mt-8">
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text className="text-accent font-medium">
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
