import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/app';

export default function RootLayout() {
  const { setUser } = useStore();

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          name: session.user.user_metadata?.name ?? '',
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          created_at: session.user.created_at,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Auth screens */}
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="signup" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Bienvenida' }} />
        <Stack.Screen name="create-circle" options={{ title: 'Crear Círculo' }} />
        <Stack.Screen name="join-circle" options={{ title: 'Unirse al Círculo' }} />

        {/* Main tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Detail screens */}
        <Stack.Screen name="member-detail" options={{ title: 'Detalle del miembro' }} />
        <Stack.Screen name="place-edit" options={{ title: 'Editar lugar' }} />
        <Stack.Screen name="drive-detail" options={{ title: 'Detalle de manejo' }} />
        <Stack.Screen name="sos-confirm" options={{ title: 'Confirmar SOS' }} />
        <Stack.Screen name="membership" options={{ title: 'Membresía' }} />
        <Stack.Screen name="membership-checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Editar perfil' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="help" options={{ title: 'Centro de ayuda' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
