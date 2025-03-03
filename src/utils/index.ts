import { v4 as uuidv4 } from "uuid";
import { Currency, Settlement, Tour, Traveler } from "../types";

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Format currency amount
export const formatCurrency = (amount: number, currencyCode: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Convert amount from one currency to another
export const convertCurrency = (amount: number, fromCurrencyCode: string, toCurrencyCode: string, currencies: Currency[]): number => {
  if (fromCurrencyCode === toCurrencyCode) {
    return amount;
  }

  const fromCurrency = currencies.find((c) => c.code === fromCurrencyCode);
  const toCurrency = currencies.find((c) => c.code === toCurrencyCode);

  if (!fromCurrency || !toCurrency) {
    throw new Error(`Currency not found: ${!fromCurrency ? fromCurrencyCode : toCurrencyCode}`);
  }

  // Convert to base currency first, then to target currency
  const amountInBaseCurrency = amount / fromCurrency.exchangeRate;
  return amountInBaseCurrency * toCurrency.exchangeRate;
};

// Calculate settlements (who owes whom)
export const calculateSettlements = (tour: Tour): Settlement[] => {
  const { expenses, travelers, baseCurrencyCode, currencies } = tour;

  // Initialize balances for each traveler
  const balances: Record<string, number> = {};
  travelers.forEach((traveler) => {
    balances[traveler.id] = 0;
  });

  // Calculate net balance for each traveler
  expenses.forEach((expense) => {
    const { paidById, amount, currencyCode, splits } = expense;

    // Convert expense amount to base currency
    const amountInBaseCurrency = convertCurrency(amount, currencyCode, baseCurrencyCode, currencies);

    // Add the full amount to the payer's balance
    balances[paidById] += amountInBaseCurrency;

    // Subtract each split from the respective traveler's balance
    splits.forEach((split) => {
      // Convert split amount to base currency
      const splitAmountInBaseCurrency = convertCurrency(split.amount, currencyCode, baseCurrencyCode, currencies);
      balances[split.travelerId] -= splitAmountInBaseCurrency;
    });
  });

  // Create a list of creditors (positive balance) and debtors (negative balance)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([travelerId, balance]) => {
    if (balance > 0) {
      creditors.push({ id: travelerId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ id: travelerId, amount: -balance });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Calculate settlements
  const settlements: Settlement[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({
        fromTravelerId: debtor.id,
        toTravelerId: creditor.id,
        amount,
        currencyCode: baseCurrencyCode,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) {
      debtors.shift();
    }

    if (creditor.amount < 0.01) {
      creditors.shift();
    }
  }

  return settlements;
};

// Get traveler name by ID
export const getTravelerName = (travelerId: string, travelers: Traveler[]): string => {
  const traveler = travelers.find((t) => t.id === travelerId);
  return traveler ? traveler.name : "Unknown";
};

// Generate a shareable link containing tour data
export const generateShareableLink = (tour: Tour): string => {
  const tourData = JSON.stringify(tour);
  const encodedData = encodeURIComponent(tourData);
  return `${window.location.origin}?tour=${encodedData}`;
};

// Parse a shareable link to extract tour data
export const parseShareableLink = (url: string): Tour | null => {
  const urlObj = new URL(url);
  const tourParam = urlObj.searchParams.get("tour");

  if (!tourParam) {
    return null;
  }

  try {
    const decodedData = decodeURIComponent(tourParam);
    return JSON.parse(decodedData);
  } catch (error) {
    console.error("Failed to parse tour data from URL", error);
    return null;
  }
};

// Save app state to localStorage
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage", error);
  }
};

// Load app state from localStorage
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error("Failed to load from localStorage", error);
    return defaultValue;
  }
};
