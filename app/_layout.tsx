import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { TransactionProvider } from '../context/TransactionContext';
import Toast from 'react-native-toast-message';

const PRIMARY_COLOR = '#6200ee';

export default function RootLayout() {
  return (
    <PaperProvider>
      <TransactionProvider>
        <Tabs
          screenOptions={{
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: 'white' },
        headerStyle: { backgroundColor: PRIMARY_COLOR },
        headerTintColor: 'white',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Transaction',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'add-circle' : 'add-circle-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Transaction History',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'list' : 'list-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'pie-chart' : 'pie-chart-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
    <Toast />
      </TransactionProvider>
    </PaperProvider>
  );
}

