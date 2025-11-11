import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useTransactions } from '../../context/TransactionContext';
import { Text, SegmentedButtons, useTheme, Card } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { formatCurrency } from '../../utils/currency';
import { Currency } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function ChartsScreen(): JSX.Element {
  const { transactions } = useTransactions();
  const theme = useTheme();
  const [viewMode, setViewMode] = useState('pie');

  // Get primary currency (most used currency or USD)
  const currencyCounts = transactions.reduce((acc, t) => {
    const currency = t.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + 1;
    return acc;
  }, {} as Record<Currency, number>);

  const primaryCurrency: Currency = Object.keys(currencyCounts).length > 0
    ? (Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0] as Currency)
    : 'USD';

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && (t.currency || 'USD') === primaryCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense' && (t.currency || 'USD') === primaryCurrency)
    .reduce((sum, t) => sum + t.amount, 0);

  // Expense categories breakdown (only for primary currency)
  const expenseCategories = transactions
    .filter((t) => t.type === 'expense' && (t.currency || 'USD') === primaryCurrency)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseCategories).map(([name, value], index) => ({
    name,
    amount: value,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  // Monthly data for bar and line charts (only for primary currency)
  const monthlyData = transactions
    .filter((t) => (t.currency || 'USD') === primaryCurrency)
    .reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += t.amount;
      } else {
        acc[month].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

  const months = Object.keys(monthlyData).slice(-6); // Last 6 months
  const barData = {
    labels: months,
    datasets: [
      {
        data: months.map((m) => monthlyData[m].income),
      },
      {
        data: months.map((m) => monthlyData[m].expense),
      },
    ],
  };

  const lineData = {
    labels: months,
    datasets: [
      {
        data: months.map((m) => monthlyData[m].expense),
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6200ee',
    },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Total Income
              </Text>
              <Text variant="headlineSmall" style={[styles.summaryValue, { color: '#4caf50' }]}>
                {formatCurrency(totalIncome, primaryCurrency)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Total Expenses
              </Text>
              <Text variant="headlineSmall" style={[styles.summaryValue, { color: '#f44336' }]}>
                {formatCurrency(totalExpenses, primaryCurrency)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              { value: 'pie', label: 'Pie' },
              { value: 'bar', label: 'Bar' },
              { value: 'line', label: 'Line' },
            ]}
            style={styles.segmentedButtons}
          />

          {viewMode === 'pie' && pieData.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                Expense Breakdown
              </Text>
              <PieChart
                data={pieData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </Animated.View>
          )}

          {viewMode === 'bar' && months.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                Income vs Expenses
              </Text>
              <BarChart
                data={{
                  labels: months,
                  datasets: [
                    {
                      data: months.map((m) => monthlyData[m].income),
                    },
                  ],
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.7,
                }}
                verticalLabelRotation={30}
                showValuesOnTopOfBars
                fromZero
              />
            </Animated.View>
          )}

          {viewMode === 'line' && months.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                Monthly Expenses Trend
              </Text>
              <LineChart
                data={lineData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Animated.View>
          )}

          {(pieData.length === 0 || months.length === 0) && (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No data available
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Add some transactions to see charts
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  chartCard: {
    elevation: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
  },
});

