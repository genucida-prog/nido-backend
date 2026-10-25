import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MembershipCheckoutScreen() {
  const router = useRouter();

  // Redirect to membership info since there's nothing to pay for
  React.useEffect(() => {
    router.replace('/membership');
  }, []);

  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Ionicons name="checkmark-circle" size={64} color="#0F766E" />
      <Text className="text-xl font-bold text-text mt-4">Todo es gratis</Text>
      <Text className="text-text-muted text-center mt-2">
        Redirigiendo a la pantalla de membresía...
      </Text>
    </View>
  );
}
