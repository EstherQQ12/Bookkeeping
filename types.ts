
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  weeklySpending: { day: string; amount: number }[];
}

export interface ParsedTransaction {
  description: string;
  amount: number;
  type: TransactionType;
  date?: string;
}

export interface UserProfile {
  id?: string; // Firebase UID or internal ID
  displayId: string; // 8-digit User ID
  name: string;
  avatar?: string; // URL or Base64 string
  password: string; // Account password
  age: number; // Manually entered age
  guardianEmail?: string;
  guardianPhone?: string;
  reportFrequency?: 'weekly' | 'monthly';
  currency?: string; // Preferred currency (e.g., RM, USD)
}