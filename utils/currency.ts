import { Currency } from '../types';

export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  PKR: 'Rs',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SAR: '﷼',
};

export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  const symbol = currencySymbols[currency];
  return `${symbol}${amount.toFixed(2)}`;
};

