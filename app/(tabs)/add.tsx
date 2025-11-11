import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  useTheme,
  Text,
  Menu,
} from 'react-native-paper';
import { useTransactions } from '../../context/TransactionContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router, usePathname, useLocalSearchParams } from 'expo-router';
import { transactionCategories } from '../../data/sampleTransactions';
import { useForm, Controller } from 'react-hook-form';
import { Currency } from '../../types';
import { currencySymbols } from '../../utils/currency';

const currencies: Currency[] = ['USD', 'PKR', 'INR', 'EUR', 'GBP', 'AED', 'SAR'];

export default function AddTransactionScreen(): JSX.Element {
  const [menuVisible, setMenuVisible] = useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
  const pathname = usePathname();
  const params = useLocalSearchParams<{ id?: string }>();
  const { addTransaction, updateTransaction, transactions } = useTransactions();
  const theme = useTheme();
  const isEditMode = !!params.id;
  const transactionToEdit = isEditMode
    ? transactions.find((t) => t.id === params.id)
    : null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: transactionToEdit?.amount.toString() || '',
      category: transactionToEdit?.category || '',
      notes: transactionToEdit?.notes || '',
      type: transactionToEdit?.type || 'expense',
      currency: transactionToEdit?.currency || 'USD',
      date: transactionToEdit?.date
        ? new Date(transactionToEdit.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: any) => {
    if (data.amount && data.category) {
      const transactionData = {
        amount: parseFloat(data.amount),
        currency: data.currency as Currency,
        category: data.category,
        type: data.type,
        date: new Date(data.date).toISOString(),
        notes: data.notes || '',
      };

      if (isEditMode && params.id) {
        await updateTransaction(params.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      reset();
      router.back();
    }
  };

  useEffect(() => {
    if (transactionToEdit) {
      reset({
        amount: transactionToEdit.amount.toString(),
        category: transactionToEdit.category,
        notes: transactionToEdit.notes,
        type: transactionToEdit.type,
        currency: transactionToEdit.currency,
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
      });
    } else if (pathname === '/add' && !isEditMode) {
      reset({
        amount: '',
        category: '',
        notes: '',
        type: 'expense',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [pathname, reset, transactionToEdit, isEditMode]);

  return (
    <ScrollView style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Transaction' : 'Add New Transaction'}
        </Text>
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={(val) => onChange(val)}
              buttons={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
              style={styles.segmentedButtons}
            />
          )}
        />
        
        <View style={styles.amountRow}>
          <Controller
            control={control}
            name="currency"
            render={({ field: { onChange, value } }) => (
              <>
                <Menu
                  visible={currencyMenuVisible}
                  onDismiss={() => setCurrencyMenuVisible(false)}
                  anchor={
                    <TextInput
                      label="Currency"
                      value={value}
                      editable={false}
                      style={[styles.input, styles.currencyInput]}
                      mode="outlined"
                      right={
                        <TextInput.Icon
                          icon="menu-down"
                          onPress={() => setCurrencyMenuVisible(true)}
                        />
                      }
                    />
                  }
                >
                  {currencies.map((curr) => (
                    <Menu.Item
                      key={curr}
                      onPress={() => {
                        onChange(curr);
                        setCurrencyMenuVisible(false);
                      }}
                      title={`${curr} (${currencySymbols[curr]})`}
                    />
                  ))}
                </Menu>
              </>
            )}
          />
          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Amount"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                style={[styles.input, styles.amountInput]}
                mode="outlined"
                error={!!errors.amount}
              />
            )}
          />
        </View>
        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount.message}</Text>
        )}

        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Date"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          rules={{ required: 'Category is required' }}
          render={({ field: { onChange, value } }) => (
            <>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TextInput
                    label="Category"
                    value={value}
                    onFocus={() => setMenuVisible(true)}
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.category}
                    right={
                      <TextInput.Icon
                        icon="menu-down"
                        onPress={() => setMenuVisible(true)}
                      />
                    }
                  />
                }
              >
                {transactionCategories.map((cat) => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      onChange(cat);
                      setMenuVisible(false);
                    }}
                    title={cat}
                  />
                ))}
              </Menu>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category.message}</Text>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Notes"
              value={value}
              onChangeText={onChange}
              multiline
              style={styles.input}
              mode="outlined"
            />
          )}
        />
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          {isEditMode ? 'Update Transaction' : 'Add Transaction'}
        </Button>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  currencyInput: {
    flex: 0.4,
  },
  amountInput: {
    flex: 0.6,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
});
