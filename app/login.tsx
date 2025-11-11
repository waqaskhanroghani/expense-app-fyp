import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, HelperText } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      // Navigation will be handled automatically by auth state change in root layout
      // Small delay to ensure state updates
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).duration(1000)} style={styles.content}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                autoComplete="password"
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye' : 'eye-off'}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />

              {error ? (
                <HelperText type="error" visible={!!error} style={styles.error}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Sign In
              </Button>

              <View style={styles.registerContainer}>
                <Text variant="bodyMedium">Don't have an account? </Text>
                <Button mode="text" onPress={handleGoToRegister} disabled={loading}>
                  Sign Up
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.demoCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.demoTitle}>
                Demo Account
              </Text>
              <Text variant="bodySmall" style={styles.demoText}>
                Email: demo@expense.com
              </Text>
              <Text variant="bodySmall" style={styles.demoText}>
                Password: demo123
              </Text>
              <Button
                mode="outlined"
                onPress={async () => {
                  setEmail('demo@expense.com');
                  setPassword('demo123');
                  setError('');
                  setLoading(true);
                  
                  try {
                    await signIn('demo@expense.com', 'demo123');
                    // Navigation will be handled automatically by auth state change in root layout
                    // Small delay to ensure state updates
                    setTimeout(() => {
                      router.replace('/(tabs)');
                    }, 100);
                  } catch (err: any) {
                    setError(err.message || 'Failed to sign in with demo account.');
                    setLoading(false);
                  }
                }}
                style={styles.demoButton}
                disabled={loading}
                loading={loading}
              >
                Use Demo Account
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoCard: {
    marginTop: 16,
    backgroundColor: '#e8f5e9',
    elevation: 2,
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  demoText: {
    color: '#1b5e20',
    marginBottom: 4,
  },
  demoButton: {
    marginTop: 8,
    borderColor: '#2e7d32',
  },
});

