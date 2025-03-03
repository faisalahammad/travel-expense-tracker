export interface Traveler {
  id: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
  exchangeRate: number; // Relative to base currency
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
}
