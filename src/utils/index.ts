import { v4 as uuidv4 } from "uuid";
import { Currency, Tour, Traveler } from "../types";
import { calculateSettlements as calculateSettlementsFromCalculator } from "./settlementCalculator";

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Format currency amount
export const formatCurrency = (amount: number, currencyCode: string): string => {
  // Ensure the amount is rounded to exactly 2 decimal places
  const roundedAmount = Math.round(amount * 100) / 100;

  try {
    // Try to use Intl.NumberFormat for proper currency formatting
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(roundedAmount);
  } catch (error) {
    // Fallback in case the currency code is invalid
    return `${currencyCode} ${roundedAmount.toFixed(2)}`;
  }
};

// Convert amount from one currency to another
export const convertCurrency = (amount: number, fromCurrencyCode: string, toCurrencyCode: string, currencies: Currency[]): number => {
  if (fromCurrencyCode === toCurrencyCode) {
    return amount;
  }

  const fromCurrency = currencies.find((c) => c.code === fromCurrencyCode);
  const toCurrency = currencies.find((c) => c.code === toCurrencyCode);

  if (!fromCurrency || !toCurrency) {
    return amount;
  }

  // Convert from source currency to base currency first
  const amountInBaseCurrency = amount * fromCurrency.exchangeRate;

  // Then convert from base currency to target currency
  // If toCurrency is the base currency, we're already done
  // Otherwise, divide by the target currency's exchange rate
  const amountInTargetCurrency = toCurrency.exchangeRate === 1 ? amountInBaseCurrency : amountInBaseCurrency / toCurrency.exchangeRate;

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(amountInTargetCurrency * 100) / 100;
};

// Calculate settlements (who owes whom)
export const calculateSettlements = (tour: Tour): any[] => {
  return calculateSettlementsFromCalculator(tour);
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
