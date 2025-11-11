import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase';
import type { Transaction, TransactionContextType } from '../types';
import { useAuth } from './AuthContext';

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      'useTransactions must be used within a TransactionProvider'
    );
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Get storage key based on user ID
  const getStorageKey = (): string => {
    if (!user) return 'transactions';
    return `transactions_${user.uid}`;
  };

  useEffect(() => {
    const initialize = async () => {
      await loadTransactions();
      setLoading(false);
    };

    initialize();

    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log(state.isConnected);
      // Firestore sync disabled - using local storage only
      // if (state.isConnected && !loading) {
      //   syncAllTransactions();
      // }
    });

    return () => {
      unsubscribe();
    };
  }, [loading, user]);

  /**
   * Load transactions from AsyncStorage or initialize with empty array
   */
  const loadTransactions = async (): Promise<void> => {
    try {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const storageKey = getStorageKey();
      const storedTransactions = await AsyncStorage.getItem(storageKey);

      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions);
        // Migrate old transactions without currency to have USD
        const migrated = parsed.map((tx: Transaction) => ({
          ...tx,
          currency: tx.currency || 'USD',
        }));
        setTransactions(() => migrated);
        // Save migrated transactions back
        await AsyncStorage.setItem(storageKey, JSON.stringify(migrated));
      } else {
        /**
         * Initialize with sample data for demo account, empty for other users
         */
        if (user?.uid === 'demo-user-001') {
          const demoTransactions: Transaction[] = [
            {
              id: uuidv4(),
              amount: 5000,
              currency: 'USD',
              category: 'Salary',
              type: 'income',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Monthly salary',
              synced: false,
            },
            {
              id: uuidv4(),
              amount: 1200,
              currency: 'USD',
              category: 'Rent',
              type: 'expense',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Apartment rent',
              synced: false,
            },
            {
              id: uuidv4(),
              amount: 350,
              currency: 'USD',
              category: 'Groceries',
              type: 'expense',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Weekly groceries',
              synced: false,
            },
            {
              id: uuidv4(),
              amount: 150,
              currency: 'USD',
              category: 'Transportation',
              type: 'expense',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Gas and parking',
              synced: false,
            },
            {
              id: uuidv4(),
              amount: 200,
              currency: 'USD',
              category: 'Freelance',
              type: 'income',
              date: new Date().toISOString(),
              notes: 'Side project payment',
              synced: false,
            },
          ];
          setTransactions(demoTransactions);
          await AsyncStorage.setItem(storageKey, JSON.stringify(demoTransactions));
        } else {
          setTransactions([]);
          await AsyncStorage.setItem(storageKey, JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load transactions.',
      });
    }
  };

  /**
   * Add a new transaction
   */
  const addTransaction = async (
    newTransaction: Omit<Transaction, 'id' | 'synced'>
  ): Promise<void> => {
    try {
      const transactionWithId: Transaction = {
        ...newTransaction,
        id: uuidv4(),
        synced: false,
      };

      const updatedTransactions = [...transactions, transactionWithId];
      const storageKey = getStorageKey();

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedTransactions)
      );

      setTransactions((prevTransactions) => [
        ...prevTransactions,
        transactionWithId,
      ]);

      /**
       * Attempt to sync after adding - DISABLED (using local storage only)
       */
      // await syncSingleTransaction(transactionWithId);
    } catch (error) {
      console.error('Error adding transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add transaction.',
      });
    }
  };

  /**
   * Get unsynced transactions
   */
  const getUnsyncedTransactions = (): Transaction[] => {
    return transactions.filter((tx) => !tx.synced);
  };

  /**
   * Fetch new transactions from the server
   */
  const fetchServerTransactions = async (
    lastSyncTime: string
  ): Promise<Transaction[]> => {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('timestamp', '>', Timestamp.fromDate(new Date(lastSyncTime)))
      );

      const querySnapshot = await getDocs(q);
      const serverTransactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Transaction;

        serverTransactions.push({
          id: doc.id,
          amount: data.amount,
          category: data.category,
          date: data.date,
          notes: data.notes,
          type: data.type,
          synced: true,
        });
      });

      return serverTransactions;
    } catch (error) {
      console.error('Error fetching server transactions:', error);
      throw error;
    }
  };

  /**
   * Get the last synchronization timestamp
   */
  const getLastSyncTime = async (): Promise<string> => {
    try {
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      return lastSync || new Date(0).toISOString();
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return new Date(0).toISOString();
    }
  };

  /**
   * Update the last synchronization timestamp
   */
  const updateLastSyncTime = async (timestamp: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('lastSyncTime', timestamp);
    } catch (error) {
      console.error('Error updating last sync time:', error);
    }
  };

  /**
   * Merge server transactions into local transactions
   */
  const mergeTransactions = async (serverTransactions: Transaction[]) => {
    try {
      const localTransactionsMap = new Map(
        transactions.map((tx) => [tx.id, tx])
      );

      serverTransactions.forEach((serverTx) => {
        if (!localTransactionsMap.has(serverTx.id)) {
          transactions.push({ ...serverTx, synced: true });
        }
      });

      return transactions;
    } catch (error) {
      console.error('Error merging transactions:', error);
      throw error;
    }
  };
  /**
   * Sync a single transaction with the server
   */
  const syncSingleTransaction = async (
    transaction: Transaction
  ): Promise<void> => {
    if (isSyncing) {
      console.log('Currently syncing. Queuing transaction for later sync.');
      return;
    }

    setIsSyncing(true);
    console.log('Starting sync for transaction:', transaction.id);

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        console.log(
          'No internet connection. Transaction will sync when online.'
        );
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Using local data. Will sync when online.',
        });
        return;
      }

      /**
       *  Attempt to sync the single transaction
       */
      await attemptSyncTransaction(transaction);
    } catch (error) {
      console.error('Sync failed for transaction:', transaction.id, error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Will retry when online.',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  /**
   * Attempt to sync a single transaction with retry logic
   */
  const attemptSyncTransaction = async (
    transaction: Transaction
  ): Promise<void> => {
    const MAX_RETRIES = 5;
    let attempt = 0;
    let success = false;
    let delay = 1000;

    while (attempt < MAX_RETRIES && !success) {
      try {
        await uploadTransaction(transaction);
        await markTransactionAsSynced(transaction.id);
        success = true;
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: `Transaction ${transaction.id} synced.`,
        });
      } catch (error) {
        attempt += 1;
        console.warn(
          `Retrying upload for transaction ${transaction.id} (Attempt ${attempt})`
        );
        if (attempt < MAX_RETRIES) {
          await sleep(delay);
          delay *= 2;
        } else {
          console.error(
            `Failed to upload transaction ${transaction.id} after ${MAX_RETRIES} attempts`
          );
          Toast.show({
            type: 'error',
            text1: 'Sync Error',
            text2: `Failed to sync transaction ${transaction.id}.`,
          });
        }
      }
    }
  };

  /**
   * Mark a single transaction as synced
   */
  const markTransactionAsSynced = async (id: string): Promise<void> => {
    try {
      setTransactions((prevTransactions) => {
        const updatedTransactions = prevTransactions.map((tx) =>
          tx.id === id ? { ...tx, synced: true } : tx
        );
        AsyncStorage.setItem(
          'transactions',
          JSON.stringify(updatedTransactions)
        ).catch((error) => {
          console.error('Error saving to AsyncStorage:', error);
        });
        return updatedTransactions;
      });
    } catch (error) {
      console.error('Error marking transaction as synced:', error);
    }
  };

  /**
   * Upload a single transaction to Firestore
   */
  const uploadTransaction = async (transaction: Transaction): Promise<void> => {
    try {
      const transactionRef = doc(db, 'transactions', transaction.id);
      await setDoc(transactionRef, {
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        notes: transaction.notes,
        type: transaction.type,
        timestamp: Timestamp.fromDate(new Date(transaction.date)),
      });
      console.log('Uploaded transaction to Firestore:', transaction.id);
    } catch (error) {
      console.error('Error uploading transaction:', error);
      throw error;
    }
  };

  /**
   * Synchronize transactions with the server
   */
  /**
   * Sync all unsynced transactions with the server
   */
  const syncAllTransactions = async (): Promise<void> => {
    if (isSyncing) {
      console.log('Currently syncing. Please wait.');
      return;
    }

    setIsSyncing(true);
    console.log('Starting bulk sync process...');

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        console.log('No internet connection. Using offline data.');
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Using local data. Will sync when online.',
        });
        return;
      }

      const unsyncedTransactions = getUnsyncedTransactions();
      console.log(`Found ${unsyncedTransactions.length} unsynced transactions`);

      if (unsyncedTransactions.length > 0) {
        Toast.show({
          type: 'info',
          text1: 'Syncing',
          text2: `Uploading ${unsyncedTransactions.length} transactions...`,
        });

        for (const transaction of unsyncedTransactions) {
          await attemptSyncTransaction(transaction);
        }
      }

      /**
       * After uploading, fetch and merge server transactions
       */
      await fetchAndMergeServerTransactions();
    } catch (error) {
      console.error('Bulk sync process failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Changes saved locally. Will retry when online.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Fetch and merge server transactions
   */
  const fetchAndMergeServerTransactions = async (): Promise<void> => {
    try {
      const lastSyncTime = await getLastSyncTime();
      const serverTransactions = await fetchServerTransactions(lastSyncTime);

      if (serverTransactions.length > 0) {
        /**
         * Merge with local transactions
         */
        await mergeTransactions(serverTransactions);

        /**
         *  Update last sync time
         */
        const newSyncTime = new Date().toISOString();
        await updateLastSyncTime(newSyncTime);

        Toast.show({
          type: 'success',
          text1: 'Sync Complete',
          text2: `Updated with ${serverTransactions.length} new transactions.`,
        });
      }
    } catch (error) {
      console.error('Error during server sync:', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
        text2: 'Failed to sync with server. Local data preserved.',
      });
    }
  };

  /**
   * Update an existing transaction
   */
  const updateTransaction = async (
    id: string,
    updatedData: Partial<Transaction>
  ): Promise<void> => {
    try {
      const updatedTransactions = transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updatedData } : tx
      );
      const storageKey = getStorageKey();

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedTransactions)
      );

      setTransactions(updatedTransactions);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction updated successfully.',
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update transaction.',
      });
      throw error;
    }
  };

  /**
   * Delete a transaction
   */
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      const updatedTransactions = transactions.filter((tx) => tx.id !== id);
      const storageKey = getStorageKey();

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedTransactions)
      );

      setTransactions(updatedTransactions);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Transaction deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete transaction.',
      });
      throw error;
    }
  };

  /**
   * Utility function to pause execution for a given time
   */
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
