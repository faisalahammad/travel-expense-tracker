export interface Traveler {
  id: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
  exchangeRate: number;
}

export interface ExpenseSplit {
  travelerId: string;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currencyCode: string;
  date: string;
  paidById: string;
  categoryId: string;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  fromTravelerId: string;
  toTravelerId: string;
  amount: number;
  currencyCode: string;
  date: string;
  description: string;
  createdAt: string;
}

export enum MemberStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  DECLINED = "DECLINED",
}

export interface SecurityQuestion {
  id: number;
  question: string;
}

export interface Tour {
  id: string;
  name: string;
  baseCurrencyCode: string;
  email?: string;
  securityQuestionId?: number;
  securityAnswer?: string;
  pinHash?: string;
  userId?: string;
  travelers: Traveler[];
  currencies: Currency[];
  expenses: Expense[];
  payments: PaymentRecord[];
  planningTasks: PlanningTask[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentTourId: string | null;
  email: string | null;
  userId?: string | null;
  lastLoginTime: string | null;
}

export interface AppState {
  tours: Tour[];
  activeTourId: string | null;
  expenseCategories: ExpenseCategory[];
  planningTasks: PlanningTask[];
  auth: AuthState;
}

export interface PlanningTask {
  id: string;
  tourId: string;
  title: string;
  date: string;
  priority: "low" | "medium" | "high";
  location?: string;
  cost?: number;
  currencyCode?: string;
  travelers?: string[];
  assignedTo?: string[];
  completed?: boolean;
}

export interface LoginCredentials {
  email: string;
  pin: string;
}

export interface ResetPinData {
  email: string;
  securityQuestionId: number;
  securityAnswer: string;
  newPin: string;
}

export interface ChangePinData {
  currentPin: string;
  newPin: string;
}

export interface ChangeSecurityQuestionData {
  pin: string;
  securityQuestionId: number;
  securityAnswer: string;
}

export interface DeleteAccountData {
  pin: string;
  securityAnswer: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "food",
    name: "Food & Drinks",
    icon: "restaurant",
    color: "#FF5722",
  },
  {
    id: "accommodation",
    name: "Accommodation",
    icon: "hotel",
    color: "#2196F3",
  },
  {
    id: "transportation",
    name: "Transportation",
    icon: "directions_car",
    color: "#4CAF50",
  },
  {
    id: "activities",
    name: "Activities",
    icon: "local_activity",
    color: "#9C27B0",
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "shopping_bag",
    color: "#F44336",
  },
  {
    id: "other",
    name: "Other",
    icon: "more_horiz",
    color: "#607D8B",
  },
];

export interface LoginResult {
  success: boolean;
  message?: string;
  userId?: string;
}
