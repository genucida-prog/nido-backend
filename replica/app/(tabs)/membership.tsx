import React from 'react';
import { View, Text } from 'react-native';

export default function MembershipScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <View className="w-24 h-24 rounded-full bg-accent/10 items-center justify-center mb-4">
        <Text className="text-5xl">🛡️</Text>
      </View>
      <Text className="text-2xl font-bold text-text mb-2">Todo es Gratis</Text>
      <Text className="text-text-muted text-center mb-6">
        Nido Familiar es 100% gratuito. Sin cargos ocultos, sin suscripciones.
      </Text>
      <View className="bg-surface-elevated rounded-xl p-4 w-full shadow-sm mb-4">
        <Text className="text-text font-semibold mb-3">Incluye:</Text>
        <Text className="text-text-muted text-sm">✓ Ubicación en tiempo real</Text>
        <Text className="text-text-muted text-sm">✓ Lugares ilimitados</Text>
        <Text className="text-text-muted text-sm">✓ Alertas de geocercas</Text>
        <Text className="text-text-muted text-sm">✓ Reportes de manejo</Text>
        <Text className="text-text-muted text-sm">✓ SOS con ubicación</Text>
        <Text className="text-text-muted text-sm">✓ Notificaciones</Text>
      </View>
      <Text className="text-text-muted text-xs text-center">
        Tus datos nunca se venden. Solo compartimos ubicación con tu círculo familiar.
      </Text>
    </View>
  );
}
