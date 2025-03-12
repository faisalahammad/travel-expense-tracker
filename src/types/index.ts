export interface Traveler {
  id: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
  exchangeRate: number; // Relative to base currency
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  color: string;
}

export interface ExpenseSplit {
  travelerId: string;
  amount: number;
  baseAmount: number;
  percentage: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currencyCode: string;
  baseAmount: number;
  baseCurrencyCode: string;
  description: string;
  paidById: string;
  splits: ExpenseSplit[];
  categoryId: string;
  createdAt: string;
}

export interface Settlement {
  fromTravelerId: string;
  toTravelerId: string;
  amount: number;
  currencyCode: string;
}

export interface PaymentRecord {
  id: string;
  fromTravelerId: string;
  toTravelerId: string;
  amount: number;
  currencyCode: string;
  date: string;
  method?: string;
  notes?: string;
  description?: string;
  createdAt: string;
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface PlanningTask {
  id: string;
  tourId: string;
  title: string;
  cost?: number;
  currencyCode?: string;
  location?: string;
  date: string;
  priority: TaskPriority;
  travelers: string[];
  assignedTo: string[];
  completed: boolean;
}

export interface Tour {
  id: string;
  name: string;
  baseCurrencyCode: string;
  travelers: Traveler[];
  currencies: Currency[];
  expenses: Expense[];
  payments: PaymentRecord[];
  planningTasks: PlanningTask[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  tours: Tour[];
  activeTourId: string | null;
  expenseCategories: ExpenseCategory[];
  planningTasks: PlanningTask[];
}

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "food", name: "Food & Drinks", icon: "restaurant", color: "#FF5722" },
  { id: "accommodation", name: "Accommodation", icon: "hotel", color: "#2196F3" },
  { id: "transportation", name: "Transportation", icon: "directions_car", color: "#4CAF50" },
  { id: "activities", name: "Activities", icon: "local_activity", color: "#9C27B0" },
  { id: "shopping", name: "Shopping", icon: "shopping_bag", color: "#F44336" },
  { id: "repayment", name: "Repayment", icon: "repayment", color: "#2ecc71" },
  { id: "other", name: "Other", icon: "more_horiz", color: "#607D8B" },
];
