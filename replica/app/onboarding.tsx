import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const FEATURES = [
  { icon: '📍', title: 'Ubicación en tiempo real', desc: 'Ve dónde está tu familia en todo momento' },
  { icon: '🛡️', title: 'Alertas de seguridad', desc: 'SOS manual y detección de choques' },
  { icon: '🚗', title: 'Reportes de manejo', desc: 'Score de seguridad vial para cada conductor' },
  { icon: '📍', title: 'Alertas de lugares', desc: 'Notificaciones al llegar o salir de sitios' },
];

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      {/* Illustration area */}
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-8xl mb-6">👨‍👩‍👧‍👦</Text>
        <Text className="text-2xl font-bold text-text text-center mb-2">
          La tranquilidad de saber dónde están
        </Text>
        <Text className="text-text-muted text-center text-base mb-8">
          Comparte ubicación, recibe alertas y mantente conectado con tu familia
        </Text>

        {/* Features */}
        <View className="w-full space-y-3 mb-8">
          {FEATURES.map((f, i) => (
            <View key={i} className="flex-row items-center bg-surface-elevated rounded-lg px-4 py-3 shadow-sm">
              <Text className="text-2xl mr-3">{f.icon}</Text>
              <View className="flex-1">
                <Text className="text-text font-medium text-base">{f.title}</Text>
                <Text className="text-text-muted text-sm">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View className="px-6 pb-8 space-y-3">
        <TouchableOpacity
          className="bg-accent py-4 rounded-md items-center"
          onPress={() => router.push('/create-circle')}
        >
          <Text className="text-on-accent font-semibold text-base">Crear mi Círculo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-surface-elevated border border-border py-4 rounded-md items-center"
          onPress={() => router.push('/join-circle')}
        >
          <Text className="text-text font-semibold text-base">Unirme a un Círculo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text className="text-text-muted text-center text-sm mt-4">Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
