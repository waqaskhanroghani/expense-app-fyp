export type Currency = 'USD' | 'PKR' | 'INR' | 'EUR' | 'GBP' | 'AED' | 'SAR';

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  category: string;
  type: 'income' | 'expense';
  date: string;
  notes: string;
  synced: boolean;
}

export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'synced'>
  ) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}
