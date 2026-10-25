import React from 'react';
import { View, Text } from 'react-native';

export default function PlacesScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-6xl mb-4">📍</Text>
      <Text className="text-xl font-bold text-text mb-2">Lugares</Text>
      <Text className="text-text-muted text-center mb-6">
        Agrega lugares importantes de tu familia y recibe alertas cuando alguien llegue o salga.
      </Text>
      <View className="bg-surface-elevated rounded-lg p-4 w-full shadow-sm">
        <Text className="text-text font-medium mb-2">Tipos de lugares:</Text>
        <Text className="text-text-muted text-sm">• 🏠 Casa</Text>
        <Text className="text-text-muted text-sm">• 🏫 Escuela</Text>
        <Text className="text-text-muted text-sm">• 🏢 Trabajo</Text>
        <Text className="text-text-muted text-sm">• 🛒 Supermercado</Text>
        <Text className="text-text-muted text-sm">• ⚕️ Hospital</Text>
      </View>
      <Text className="text-text-muted text-xs text-center mt-4">
        Todos los lugares y alertas son gratis para siempre
      </Text>
    </View>
  );
}
