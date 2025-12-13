import { OnboardingProvider } from '@/src/context/OnboardingContext';
import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
    return (
        <OnboardingProvider>
            <Stack screenOptions={{
                headerShown: false,
                animation: 'slide_from_right'
            }}>
                <Stack.Screen name="step1" options={{ title: 'Básico' }} />
                <Stack.Screen name="step2" options={{ title: 'Fotos' }} />
                <Stack.Screen name="step3" options={{ title: 'Contas' }} />
                <Stack.Screen name="step4" options={{ title: 'Perfil Gamer' }} />
                <Stack.Screen name="step5" options={{ title: 'Filtros' }} />
            </Stack>
        </OnboardingProvider>
    );
}
