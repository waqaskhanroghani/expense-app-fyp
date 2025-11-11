import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  USER: '@auth_user',
  USERS_DB: '@users_database',
};

// Demo credentials for testing (hardcoded fallback)
const DEMO_CREDENTIALS = {
  email: 'demo@expense.com',
  password: 'demo123',
  displayName: 'Demo User',
  uid: 'demo-user-001',
};

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage on mount
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsersDB = async (): Promise<Record<string, any>> => {
    try {
      const db = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      return db ? JSON.parse(db) : {};
    } catch (error) {
      console.error('Error getting users DB:', error);
      return {};
    }
  };

  const saveUsersDB = async (db: Record<string, any>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
    } catch (error) {
      console.error('Error saving users DB:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const usersDB = await getUsersDB();
      
      // Check if user already exists
      if (usersDB[email]) {
        throw new Error('This email is already registered');
      }

      // Create new user
      const newUser: User = {
        uid: Date.now().toString(),
        email,
        displayName,
      };

      // Save to users database with password
      usersDB[email] = {
        ...newUser,
        password, // In production, you'd hash this
      };

      await saveUsersDB(usersDB);
      
      // Set current user (without password)
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Check if using demo credentials
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        const demoUser: User = {
          uid: DEMO_CREDENTIALS.uid,
          email: DEMO_CREDENTIALS.email,
          displayName: DEMO_CREDENTIALS.displayName,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }

      // Check regular user database
      const usersDB = await getUsersDB();
      const userData = usersDB[email];

      if (!userData) {
        throw new Error('No user found with this email');
      }

      if (userData.password !== password) {
        throw new Error('Incorrect password');
      }

      // Remove password before setting user
      const { password: _, ...userWithoutPassword } = userData;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword as User);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

