import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Button } from 'react-native-paper';
import { useTransactions } from '../../context/TransactionContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import { TransactionItem } from '../../components/TransactionItem';
import { formatCurrency, currencySymbols } from '../../utils/currency';
import { Currency, Transaction } from '../../types';

export default function HomeScreen(): JSX.Element {
  const { transactions } = useTransactions();
  const theme = useTheme();

  // Group transactions by currency
  const transactionsByCurrency = transactions.reduce((acc, t) => {
    const currency = t.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = { income: [], expense: [] };
    }
    if (t.type === 'income') {
      acc[currency].income.push(t);
    } else {
      acc[currency].expense.push(t);
    }
    return acc;
  }, {} as Record<Currency, { income: Transaction[]; expense: Transaction[] }>);

  // Calculate totals for primary currency (USD) or first available currency
  const primaryCurrency: Currency = transactions.length > 0 && transactions[0].currency 
    ? transactions[0].currency 
    : 'USD';
  
  const totalIncome = transactions
    .filter((t) => t.type === 'income' && (t.currency || 'USD') === primaryCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense' && (t.currency || 'USD') === primaryCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text
              style={[styles.balanceAmount, { color: theme.colors.primary }]}
            >
              {formatCurrency(balance, primaryCurrency)}
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
                {formatCurrency(totalIncome, primaryCurrency)}
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
                {formatCurrency(totalExpenses, primaryCurrency)}
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
            <Button onPress={() => router.push('/(tabs)/history')}>View All</Button>
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
