export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

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
  icon: string;
  color: string;
}

export interface ExpenseSplit {
  travelerId: string;
  amount: number;
  percentage: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currencyCode: string;
  description: string;
  paidById: string;
  splits: ExpenseSplit[];
  categoryId: string;
  createdById: string; // ID of the user who created the expense
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
  method: string;
  notes?: string;
  createdById: string; // ID of the user who created the payment
  createdAt: string;
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
  createdById: string; // ID of the user who created the tour
  members: string[]; // Array of user IDs who have access to this tour
}

export interface AppState {
  tours: Tour[];
  activeTourId: string | null;
  currentUser: User | null;
  expenseCategories: ExpenseCategory[];
}

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "transportation", name: "Transportation", icon: "🚌", color: "#FF8C00" },
  { id: "restaurants", name: "Restaurants", icon: "🍴", color: "#00CED1" },
  { id: "accommodation", name: "Accommodation", icon: "🛏️", color: "#FF6347" },
  { id: "groceries", name: "Groceries", icon: "🛒", color: "#1E90FF" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#32CD32" },
  { id: "activities", name: "Activities", icon: "🏃", color: "#FF1493" },
  { id: "drinks", name: "Drinks", icon: "🍸", color: "#9370DB" },
  { id: "coffee", name: "Coffee", icon: "☕", color: "#8B4513" },
  { id: "flights", name: "Flights", icon: "✈️", color: "#4169E1" },
  { id: "general", name: "General", icon: "💬", color: "#FFA500" },
  { id: "fees", name: "Fees & Charges", icon: "💲", color: "#9932CC" },
  { id: "sightseeing", name: "Sightseeing", icon: "🏛️", color: "#3CB371" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#FF4500" },
  { id: "laundry", name: "Laundry", icon: "🧺", color: "#20B2AA" },
  { id: "exchange", name: "Exchange Fees", icon: "💱", color: "#6A5ACD" },
];
