import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/store/app';

const API_BASE = 'https://nido-backend-8ig7.onrender.com';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) { setLoading(false); return; }

    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'place_alert': return 'location';
      case 'sos': return 'emergency';
      case 'drive_summary': return 'car';
      case 'crash_alert': return 'warning';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'sos': return '#b91c1c';
      case 'crash_alert': return '#b91c1c';
      case 'place_alert': return '#0D9488';
      default: return '#5a6577';
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0D9488" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
            Notificaciones
          </Text>
        </View>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text className="text-accent text-sm font-medium">Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0F766E" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="notifications-off" size={64} color="#b0b8c4" />
            <Text className="text-text-muted text-center mt-4">
              No hay notificaciones aún
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-border">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                className={`px-4 py-4 flex-row items-start ${!notification.read ? 'bg-accent/5' : ''}`}
                onPress={() => markAsRead(notification.id)}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${!notification.read ? 'bg-accent/20' : 'bg-surface'}`}>
                  <Ionicons
                    name={getIcon(notification.type) as any}
                    size={20}
                    color={getIconColor(notification.type)}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className={`font-semibold text-sm ${!notification.read ? 'text-text' : 'text-text-muted'}`}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View className="w-2 h-2 rounded-full bg-accent ml-2" />
                    )}
                  </View>
                  <Text className="text-text-muted text-sm mt-0.5">{notification.body}</Text>
                  <Text className="text-text-subtle text-xs mt-1">
                    {new Date(notification.created_at).toLocaleString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
