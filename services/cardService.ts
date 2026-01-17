import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CardBalance, CardTransaction, CardSettings } from '../types';

interface CardDB extends DBSchema {
  cardBalance: {
    key: string;
    value: {
      id: string;
      balance: number;
      lastUpdated: string;
      currency: string;
    };
  };
  cardTransactions: {
    key: string;
    value: {
      id: string;
      amount: number;
      type: 'deduct' | 'topup';
      description: string;
      timestamp: string;
      balanceAfter: number;
    };
    indexes: { 'by-timestamp': string };
  };
  cardSettings: {
    key: string;
    value: {
      id: string;
      reminderThreshold: number;
      averageDailySpending: number;
      autoCalculateAverage: boolean;
    };
  };
}

const DB_NAME = 'ybs-card-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CardDB>> | null = null;

const getDB = async (): Promise<IDBPDatabase<CardDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<CardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Card balance store
        if (!db.objectStoreNames.contains('cardBalance')) {
          db.createObjectStore('cardBalance', { keyPath: 'id' });
        }

        // Card transactions store
        if (!db.objectStoreNames.contains('cardTransactions')) {
          const txStore = db.createObjectStore('cardTransactions', { keyPath: 'id' });
          txStore.createIndex('by-timestamp', 'timestamp');
        }

        // Card settings store
        if (!db.objectStoreNames.contains('cardSettings')) {
          db.createObjectStore('cardSettings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Balance operations
export const getCardBalance = async (): Promise<CardBalance | null> => {
  try {
    const db = await getDB();
    const data = await db.get('cardBalance', 'current');
    if (!data) return null;
    return {
      ...data,
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error('Error getting card balance:', error);
    return null;
  }
};

export const setCardBalance = async (balance: number, currency: string = 'MMK'): Promise<void> => {
  try {
    const db = await getDB();
    await db.put('cardBalance', {
      id: 'current',
      balance,
      lastUpdated: new Date().toISOString(),
      currency,
    });
  } catch (error) {
    console.error('Error setting card balance:', error);
    throw error;
  }
};

export const updateCardBalance = async (amount: number, type: 'deduct' | 'topup', description: string): Promise<void> => {
  try {
    const currentBalance = await getCardBalance();
    const oldBalance = currentBalance?.balance || 0;
    const newBalance = type === 'topup' ? oldBalance + amount : oldBalance - amount;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    await setCardBalance(newBalance, currentBalance?.currency || 'MMK');
    await addTransaction(amount, type, description, newBalance);
  } catch (error) {
    console.error('Error updating card balance:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (
  amount: number,
  type: 'deduct' | 'topup',
  description: string,
  balanceAfter: number
): Promise<void> => {
  try {
    const db = await getDB();
    const transaction: CardTransaction & { timestamp: string } = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      type,
      description,
      timestamp: new Date().toISOString(),
      balanceAfter,
    };
    await db.add('cardTransactions', transaction as any);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async (limit?: number): Promise<CardTransaction[]> => {
  try {
    const db = await getDB();
    const tx = db.transaction('cardTransactions', 'readonly');
    const index = tx.store.index('by-timestamp');
    const transactions = await index.getAll();
    
    const sorted = transactions
      .map(t => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const clearTransactions = async (): Promise<void> => {
  try {
    const db = await getDB();
    await db.clear('cardTransactions');
  } catch (error) {
    console.error('Error clearing transactions:', error);
    throw error;
  }
};

// Settings operations
export const getCardSettings = async (): Promise<CardSettings> => {
  try {
    const db = await getDB();
    const settings = await db.get('cardSettings', 'default');
    return settings || {
      id: 'default',
      reminderThreshold: 1000, // 1000 MMK default
      averageDailySpending: 0,
      autoCalculateAverage: true,
    };
  } catch (error) {
    console.error('Error getting card settings:', error);
    return {
      id: 'default',
      reminderThreshold: 1000,
      averageDailySpending: 0,
      autoCalculateAverage: true,
    };
  }
};

export const updateCardSettings = async (settings: Partial<CardSettings>): Promise<void> => {
  try {
    const db = await getDB();
    const current = await getCardSettings();
    await db.put('cardSettings', {
      ...current,
      ...settings,
      id: 'default',
    });
  } catch (error) {
    console.error('Error updating card settings:', error);
    throw error;
  }
};

// Usage pattern calculation
export const calculateAverageDailySpending = async (): Promise<number> => {
  try {
    const transactions = await getTransactions();
    const deductions = transactions.filter(t => t.type === 'deduct');
    
    if (deductions.length === 0) return 0;

    const oldestTx = deductions[deductions.length - 1];
    const newestTx = deductions[0];
    
    const daysDiff = Math.max(
      1,
      Math.floor((newestTx.timestamp.getTime() - oldestTx.timestamp.getTime()) / (1000 * 60 * 60 * 24))
    );

    const totalSpent = deductions.reduce((sum, tx) => sum + tx.amount, 0);
    return totalSpent / daysDiff;
  } catch (error) {
    console.error('Error calculating average daily spending:', error);
    return 0;
  }
};

// Low balance detection
export const isBalanceLow = async (): Promise<{ isLow: boolean; message: string }> => {
  try {
    const balance = await getCardBalance();
    const settings = await getCardSettings();
    
    if (!balance) {
      return { isLow: false, message: '' };
    }

    let threshold = settings.reminderThreshold;
    
    // Auto-calculate threshold based on spending
    if (settings.autoCalculateAverage) {
      const avgSpending = await calculateAverageDailySpending();
      if (avgSpending > 0) {
        threshold = Math.max(avgSpending * 1.5, settings.reminderThreshold);
        // Update settings with calculated average
        await updateCardSettings({ averageDailySpending: avgSpending });
      }
    } else if (settings.averageDailySpending > 0) {
      threshold = Math.max(settings.averageDailySpending * 1.5, settings.reminderThreshold);
    }

    const isLow = balance.balance < threshold;
    
    let message = '';
    if (isLow) {
      if (settings.averageDailySpending > 0) {
        const daysLeft = Math.floor(balance.balance / settings.averageDailySpending);
        if (daysLeft === 0) {
          message = `Your balance may not be enough for today. Consider topping up soon.`;
        } else if (daysLeft === 1) {
          message = `Your balance may be low for tomorrow. You have approximately ${balance.balance} ${balance.currency} left.`;
        } else {
          message = `Your balance is running low. Based on your usage, you have about ${daysLeft} days left.`;
        }
      } else {
        message = `Your balance is low (${balance.balance} ${balance.currency}). Consider topping up soon.`;
      }
    }

    return { isLow, message };
  } catch (error) {
    console.error('Error checking balance:', error);
    return { isLow: false, message: '' };
  }
};

export const getBalanceInsights = async (): Promise<{
  totalSpent: number;
  totalTopups: number;
  transactionCount: number;
  avgDailySpending: number;
}> => {
  try {
    const transactions = await getTransactions();
    const totalSpent = transactions.filter(t => t.type === 'deduct').reduce((sum, t) => sum + t.amount, 0);
    const totalTopups = transactions.filter(t => t.type === 'topup').reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpending = await calculateAverageDailySpending();
    
    return {
      totalSpent,
      totalTopups,
      transactionCount: transactions.length,
      avgDailySpending,
    };
  } catch (error) {
    console.error('Error getting balance insights:', error);
    return {
      totalSpent: 0,
      totalTopups: 0,
      transactionCount: 0,
      avgDailySpending: 0,
    };
  }
};
