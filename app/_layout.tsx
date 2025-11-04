import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { TransactionProvider } from '../context/TransactionContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { View, ActivityIndicator } from 'react-native';

type RouteName = 'index' | 'add' | 'history' | 'charts';

interface IconMapping {
  focused: keyof typeof Ionicons.glyphMap;
  unfocused: keyof typeof Ionicons.glyphMap;
}

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f5f5f5',
  },
};

const ICONS: Record<RouteName, IconMapping> = {
  index: {
    focused: 'home',
    unfocused: 'home-outline',
  },
  add: {
    focused: 'add-circle',
    unfocused: 'add-circle-outline',
  },
  history: {
    focused: 'list',
    unfocused: 'list-outline',
  },
  charts: {
    focused: 'pie-chart',
    unfocused: 'pie-chart-outline',
  },
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <TransactionProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const routeName = route.name as RouteName;
            const icons = ICONS[routeName];
            const iconName = icons
              ? focused
                ? icons.focused
                : icons.unfocused
              : 'help-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: 'white' },
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: 'white',
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add Transaction',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Transaction History',
          }}
        />
        <Tabs.Screen
          name="charts"
          options={{
            title: 'Analytics',
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <Toast />
    </TransactionProvider>
  );
};

export default function AppLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <ProtectedLayout />
      </AuthProvider>
    </PaperProvider>
  );
}
