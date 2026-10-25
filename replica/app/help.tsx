import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function HelpScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const FAQS = [
    {
      q: '¿Cómo creo un círculo?',
      a: 'Ve a la pantalla principal, toca "Crear Círculo" y sigue las instrucciones. Puedes invitar a tus familiares por email o código.',
    },
    {
      q: '¿Cómo funciona la ubicación en tiempo real?',
      a: 'La app usa el GPS de tu dispositivo para compartir tu ubicación con los miembros de tu círculo. Puedes activar/desactivar en Configuración.',
    },
    {
      q: '¿Qué es el score de manejo?',
      a: 'El score evalúa tu seguridad al conducir basado en frenadas bruscas, aceleraciones, exceso de velocidad y uso del teléfono.',
    },
    {
      q: '¿Cómo activo las alertas de lugares?',
      a: 'Ve a la sección "Lugares", añade uno nuevo y configura las alertas de llegada y salida.',
    },
    {
      q: '¿Puedo usar la app sin internet?',
      a: 'Sí, pero las actualizaciones de ubicación se sincronizarán cuando recuperes la conexión.',
    },
    {
      q: '¿Cómo cancelo mi membresía?',
      a: 'Nido es 100% gratuito para siempre. No hay membresías ni suscripciones que cancelar.',
    },
  ];

  const filteredFAQs = FAQS.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contactSupport = async () => {
    const subject = prompt('Asunto:', 'Consulta general');
    if (!subject) return;
    
    const body = prompt('Describe tu problema:');
    if (!body) return;

    // In real app: send email via Resend API
    Alert.alert('Enviado', 'Hemos recibido tu mensaje. Te responderemos en 24-48 horas.');
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 py-4 bg-surface-elevated shadow-sm flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0D9488" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-text mx-12">
          Centro de ayuda
        </Text>
      </View>

      <View className="px-4 py-3">
        <View className="bg-surface-elevated rounded-lg px-4 py-3 flex-row items-center shadow-sm">
          <Ionicons name="search" size={20} color="#b0b8c4" />
          <TextInput
            className="flex-1 ml-2 text-text"
            placeholder="Buscar ayuda..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#b0b8c4" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-text font-semibold text-base mt-4 mb-3">
          {searchQuery ? 'Resultados' : 'Preguntas frecuentes'}
        </Text>

        <View className="space-y-3 mb-6">
          {filteredFAQs.map((faq, i) => (
            <View key={i} className="bg-surface-elevated rounded-xl p-4 shadow-sm">
              <Text className="text-text font-medium text-base mb-2">{faq.q}</Text>
              <Text className="text-text-muted text-sm leading-relaxed">{faq.a}</Text>
            </View>
          ))}
        </View>

        {filteredFAQs.length === 0 && (
          <View className="items-center py-8">
            <Ionicons name="search-off" size={48} color="#b0b8c4" />
            <Text className="text-text-muted mt-2">No se encontraron resultados</Text>
          </View>
        )}

        {/* Contact support */}
        <View className="bg-accent/10 rounded-xl p-4 mb-6">
          <Text className="text-text font-semibold text-base mb-2">¿Necesitas más ayuda?</Text>
          <Text className="text-text-muted text-sm mb-3">
            Nuestro equipo de soporte está disponible 24/7 para ayudarte.
          </Text>
          <TouchableOpacity 
            className="bg-accent py-3 rounded-lg items-center"
            onPress={contactSupport}
          >
            <Text className="text-on-accent font-semibold">Contactar soporte</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
