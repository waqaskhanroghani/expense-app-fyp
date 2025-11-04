import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, useTheme, Button } from 'react-native-paper';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { router } from 'expo-router';
import { TransactionItem } from '../components/TransactionItem';

export default function HomeScreen(): JSX.Element {
  const { transactions } = useTransactions();
  const { logout, user } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text
              style={[styles.balanceAmount, { color: theme.colors.primary }]}
            >
              ${balance.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      <View style={styles.summaryContainer}>
        <Animated.View
          style={styles.summaryCard}
          entering={FadeInUp.delay(400).duration(1000)}
        >
          <Card>
            <Card.Content>
              <View style={styles.summaryIconContainer}>
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text
                style={[styles.summaryAmount, { color: theme.colors.primary }]}
              >
                ${totalIncome.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
        <Animated.View
          style={styles.summaryCard}
          entering={FadeInUp.delay(600).duration(1000)}
        >
          <Card>
            <Card.Content>
              <View style={styles.summaryIconContainer}>
                <Ionicons
                  name="arrow-down-circle"
                  size={24}
                  color={theme.colors.error}
                />
              </View>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text
                style={[styles.summaryAmount, { color: theme.colors.error }]}
              >
                ${totalExpenses.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(800).duration(1000)}>
        <Card style={styles.recentTransactionsCard}>
          <Card.Title title="Recent Transactions" />
          <Card.Content>
            {recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/history')}>View All</Button>
          </Card.Actions>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    marginBottom: 16,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recentTransactionsCard: {
    marginBottom: 16,
    elevation: 4,
  },
});
