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
  method: string;
  notes?: string;
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
}

export interface AppState {
  tours: Tour[];
  activeTourId: string | null;
  expenseCategories: ExpenseCategory[];
}

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "transportation", name: "Transportation", color: "#FF8C00" },
  { id: "restaurants", name: "Restaurants", color: "#00CED1" },
  { id: "accommodation", name: "Accommodation", color: "#FF6347" },
  { id: "groceries", name: "Groceries", color: "#1E90FF" },
  { id: "shopping", name: "Shopping", color: "#32CD32" },
  { id: "activities", name: "Activities", color: "#FF1493" },
  { id: "drinks", name: "Drinks", color: "#9370DB" },
  { id: "coffee", name: "Coffee", color: "#8B4513" },
  { id: "flights", name: "Flights", color: "#4169E1" },
  { id: "general", name: "General", color: "#FFA500" },
  { id: "fees", name: "Fees & Charges", color: "#9932CC" },
  { id: "sightseeing", name: "Sightseeing", color: "#3CB371" },
  { id: "entertainment", name: "Entertainment", color: "#FF4500" },
  { id: "laundry", name: "Laundry", color: "#20B2AA" },
  { id: "exchange", name: "Exchange Fees", color: "#6A5ACD" },
  { id: "other", name: "Other", color: "#708090" },
];
