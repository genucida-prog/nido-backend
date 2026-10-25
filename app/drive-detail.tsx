import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/app';

// Mock data for demo
const DRIVES = [
  {
    id: '1',
    date: 'Hoy, 8:30 AM',
    duration: '25 min',
    distance: '12.4 km',
    score: 85,
    events: [
      { type: 'hard_brake', time: '8:42 AM', severity: 2 },
      { type: 'speeding', time: '8:45 AM', severity: 1 },
    ],
  },
  {
    id: '2',
    date: 'Ayer, 6:15 PM',
    duration: '18 min',
    distance: '8.2 km',
    score: 92,
    events: [],
  },
  {
    id: '3',
    date: '22 Oct, 7:00 AM',
    duration: '32 min',
    distance: '15.1 km',
    score: 78,
    events: [
      { type: 'phone_use', time: '7:15 AM', severity: 3 },
      { type: 'hard_brake', time: '7:22 AM', severity: 1 },
    ],
  },
];

export default function DrivesDetailScreen() {
  const router = useRouter();
  const { route } = useRouter();
  const driveId = route.params?.driveId as string | undefined;
  const drive = DRIVES.find(d => d.id === driveId) ?? DRIVES[0];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-danger';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'hard_brake': return 'brake-disc';
      case 'rapid_accel': return 'fast-forward';
      case 'speeding': return 'speedometer';
      case 'phone_use': return 'phone';
      case 'fatigue': return 'sleep';
      default: return 'alert-circle';
    }
  };

  const getEventColor = (severity: number) => {
    if (severity >= 3) return 'text-danger';
    if (severity >= 2) return 'text-warning';
    return 'text-text-muted';
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0D9488" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
          Detalle de manejo
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Score */}
        <View className="px-4 py-6 bg-surface-elevated mx-4 mt-4 rounded-xl shadow-sm items-center">
          <View className="w-24 h-24 rounded-full border-8 border-accent items-center justify-center">
            <Text className={`text-3xl font-bold ${getScoreColor(drive.score)}`}>
              {drive.score}
            </Text>
          </View>
          <Text className="text-text-muted mt-2">Score de seguridad</Text>
        </View>

        {/* Stats */}
        <View className="px-4 py-4">
          <Text className="text-text font-semibold text-base mb-3">{drive.date}</Text>
          
          <View className="flex-row justify-around bg-surface-elevated rounded-xl p-4 shadow-sm">
            <View className="items-center">
              <Ionicons name="time" size={20} color="#0D9488" />
              <Text className="text-text font-medium mt-1">{drive.duration}</Text>
              <Text className="text-text-muted text-xs">Duración</Text>
            </View>
            <View className="items-center">
              <Ionicons name="navigate" size={20} color="#0D9488" />
              <Text className="text-text font-medium mt-1">{drive.distance}</Text>
              <Text className="text-text-muted text-xs">Distancia</Text>
            </View>
            <View className="items-center">
              <Ionicons name="speedometer" size={20} color="#0D9488" />
              <Text className="text-text font-medium mt-1">68</Text>
              <Text className="text-text-muted text-xs">km/h prom</Text>
            </View>
          </View>
        </View>

        {/* Events */}
        {drive.events.length > 0 && (
          <View className="px-4 py-4">
            <Text className="text-text font-semibold text-base mb-3">Eventos detectados</Text>
            <View className="space-y-2">
              {drive.events.map((event, i) => (
                <View key={i} className="bg-surface-elevated rounded-lg p-3 shadow-sm flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    event.severity >= 3 ? 'bg-danger-light' : 'bg-warning-light'
                  }`}>
                    <Ionicons 
                      name={getEventIcon(event.type) as any} 
                      size={20} 
                      color={event.severity >= 3 ? '#dc2626' : '#d97706'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text font-medium">
                      {event.type === 'hard_brake' && 'Frenado brusco'}
                      {event.type === 'speeding' && 'Exceso de velocidad'}
                      {event.type === 'phone_use' && 'Uso de teléfono'}
                      {event.type === 'rapid_accel' && 'Aceleración rápida'}
                      {event.type === 'fatigue' && 'Posible fatiga'}
                    </Text>
                    <Text className="text-text-muted text-sm">{event.time}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    event.severity >= 3 ? 'bg-danger-light' : 'bg-warning-light'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      event.severity >= 3 ? 'text-danger' : 'text-warning'
                    }`}>
                      Nivel {event.severity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {drive.events.length === 0 && (
          <View className="px-4 py-8 items-center">
            <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
            <Text className="text-text font-semibold text-lg mt-2">¡Excelente manejo!</Text>
            <Text className="text-text-muted text-center px-8">
              No se detectaron eventos peligrosos en este viaje.
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
