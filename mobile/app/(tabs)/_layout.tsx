import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home-outline';

          if (route.name === 'index') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'explore') iconName = focused ? 'search' : 'search-outline';
          if (route.name === 'upload') iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload' }} />
    </Tabs>
  );
}
