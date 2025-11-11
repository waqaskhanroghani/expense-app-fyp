import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, useTheme, IconButton, Menu } from 'react-native-paper';
import { useTransactions } from '../../context/TransactionContext';
import { Transaction } from '../../types';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HistoryItem } from '../../components/HistoryItem';
import { router } from 'expo-router';

export default function HistoryScreen(): JSX.Element {
  const { transactions, deleteTransaction } = useTransactions();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const handleEdit = (transactionId: string) => {
    setMenuVisible(null);
    router.push(`/(tabs)/add?id=${transactionId}`);
  };

  const handleDelete = (transactionId: string) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
            } catch (error) {
              console.error('Error deleting transaction:', error);
            }
          },
        },
      ]
    );
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterType === 'all' || transaction.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(500)}>
      <View style={styles.transactionRow}>
        <View style={styles.transactionContent}>
          <HistoryItem item={item} index={index} />
        </View>
        <Menu
          visible={menuVisible === item.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => setMenuVisible(item.id)}
            />
          }
        >
          <Menu.Item
            onPress={() => handleEdit(item.id)}
            title="Edit"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => handleDelete(item.id)}
            title="Delete"
            leadingIcon="delete"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.searchCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.filterContainer}>
            <Chip
              selected={filterType === 'all'}
              onPress={() => setFilterType('all')}
              style={styles.chip}
            >
              All
            </Chip>
            <Chip
              selected={filterType === 'income'}
              onPress={() => setFilterType('income')}
              style={styles.chip}
            >
              Income
            </Chip>
            <Chip
              selected={filterType === 'expense'}
              onPress={() => setFilterType('expense')}
              style={styles.chip}
            >
              Expenses
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {filteredTransactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleLarge" style={styles.emptyText}>
              No transactions found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first transaction to get started'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
  },
  transactionContent: {
    flex: 1,
  },
});

