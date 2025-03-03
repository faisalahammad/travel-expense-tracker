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
  createdById: string;
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
  createdById: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  name: string;
  baseCurrencyCode: string;
  travelers: Traveler[];
  currencies: Currency[];
  expenses: Expense[];
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
  members: string[];
}

export interface AppState {
  tours: Tour[];
  activeTourId: string | null;
  currentUser: User | null;
  expenseCategories: ExpenseCategory[];
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
