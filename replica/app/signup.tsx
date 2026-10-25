import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function SignupScreen() {
  const router = useRouter();
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      // Signup through backend
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear cuenta');

      // Auto-login after signup
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      // Set Supabase session
      const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
      if (sessionData.user) {
        setUser({
          id: sessionData.user.id,
          email: sessionData.user.email,
          phone: null,
          name,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });
      }

      router.replace('/onboarding');
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
        <Text className="text-2xl font-bold text-text">Crear cuenta</Text>
        <Text className="text-text-muted mt-2 text-center">
          Únete a Nido, seguridad familiar gratuita
        </Text>
      </View>

      {/* Form */}
      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-text mb-1">Nombre</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text"
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-text mb-1">Email</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-text mb-1">Contraseña</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-md px-4 py-3 text-text"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-accent py-4 rounded-md items-center mt-2"
          onPress={handleSignup}
          disabled={loading}
        >
          <Text className="text-on-accent font-semibold text-base">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="items-center mt-8">
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text className="text-accent font-medium">
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
