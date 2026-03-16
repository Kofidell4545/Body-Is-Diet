import { Tabs } from 'expo-router';
import { View } from 'react-native';
import LiquidTabBar from '../../components/LiquidTabBar';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Hide the native tab bar — our custom LiquidTabBar takes over
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="meals" />
        <Tabs.Screen name="log" />
        <Tabs.Screen name="shopping" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {/* Floating liquid glass tab bar rendered on top of all tab screens */}
      <LiquidTabBar />
    </View>
  );
}
