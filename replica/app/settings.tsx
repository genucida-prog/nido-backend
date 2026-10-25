import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsGroups = [
    {
      title: 'Cuenta',
      items: [
        { icon: 'person', label: 'Editar perfil', screen: '/profile-edit' },
        { icon: 'shield-checkmark', label: 'Privacidad', screen: null },
        { icon: 'lock-closed', label: 'Cambiar contraseña', screen: null },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        { icon: 'notifications', label: 'Alertas de lugares', screen: null },
        { icon: 'warning', label: 'Alertas SOS', screen: null },
        { icon: 'car', label: 'Reportes de manejo', screen: null },
      ],
    },
    {
      title: 'Seguridad',
      items: [
        { icon: 'finger-print', label: 'Biometría', screen: null },
        { icon: 'lock-open', label: 'PIN de seguridad', screen: null },
      ],
    },
    {
      title: 'Ajustes del círculo',
      items: [
        { icon: 'people', label: 'Miembros', screen: null },
        { icon: 'trash', label: 'Salir del círculo', screen: null },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { icon: 'help-circle', label: 'Centro de ayuda', screen: null },
        { icon: 'mail', label: 'Contactar soporte', screen: null },
        { icon: 'information-circle', label: 'Acerca de', screen: null },
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm">
        <Text className="text-2xl font-bold text-text">Configuración</Text>
      </View>

      <View className="px-4 py-4 space-y-6">
        {settingsGroups.map((group) => (
          <View key={group.title} className="bg-surface-elevated rounded-xl shadow-sm overflow-hidden">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2">
              {group.title}
            </Text>
            {group.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                className="flex-row items-center px-4 py-3.5 border-b border-border last:border-b-0"
                onPress={() => item.screen && router.push(item.screen as any)}
              >
                <View className="w-8 h-8 rounded-full bg-surface items-center justify-center mr-3">
                  <Ionicons name={item.icon as any} size={18} color="#5a6577" />
                </View>
                <Text className="flex-1 text-text font-medium">{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#b0b8c4" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity className="bg-danger-light rounded-xl p-4 mt-4 items-center">
          <Ionicons name="log-out" size={20} color="#b91c1c" />
          <Text className="text-danger font-semibold mt-1">Cerrar sesión</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
