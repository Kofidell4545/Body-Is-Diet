import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { MealPlanProvider } from '../context/MealPlanContext';

function RootLayoutNav() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <MealPlanProvider>
                <RootLayoutNav />
            </MealPlanProvider>
        </AuthProvider>
    );
}