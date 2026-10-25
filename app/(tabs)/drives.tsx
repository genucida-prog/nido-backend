import React from 'react';
import { View, Text } from 'react-native';

export default function DrivesScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-6xl mb-4">🚗</Text>
      <Text className="text-xl font-bold text-text mb-2">Reportes de Manejo</Text>
      <Text className="text-text-muted text-center mb-6">
        Monitorea la seguridad vial de tu familia con reportes automáticos de cada viaje.
      </Text>
      <View className="bg-surface-elevated rounded-lg p-4 w-full shadow-sm">
        <Text className="text-text font-medium mb-2">¿Qué puedes ver?</Text>
        <Text className="text-text-muted text-sm">• Score de seguridad por conductor</Text>
        <Text className="text-text-muted text-sm">• Eventos: frenado brusco, aceleración, exceso de velocidad</Text>
        <Text className="text-text-muted text-sm">• Historial completo de viajes</Text>
        <Text className="text-text-muted text-sm">• Promedios y tendencias</Text>
      </View>
      <Text className="text-text-muted text-xs text-center mt-4">
        Todo el historial disponible sin límite de tiempo
      </Text>
    </View>
  );
}
