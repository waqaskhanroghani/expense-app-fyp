import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { TransactionProvider } from '../context/TransactionContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const PRIMARY_COLOR = '#6200ee';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];
    const inAuthScreen = currentRoute === 'login' || currentRoute === 'register';
    const inTabsScreen = currentRoute === '(tabs)';

    if (!user) {
      // Redirect to login if not authenticated (unless already on auth screen)
      if (!inAuthScreen) {
        router.replace('/login');
      }
    } else {
      // Redirect to main app if authenticated (unless already on tabs screen)
      if (!inTabsScreen && !inAuthScreen) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }}
        />
      </Stack>
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <TransactionProvider>
          <RootLayoutNav />
        </TransactionProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

