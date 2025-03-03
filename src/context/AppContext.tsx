import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, Currency, Expense, ExpenseSplit, Tour, Traveler } from "../types";
import { loadFromLocalStorage, parseShareableLink, saveToLocalStorage } from "../utils";

interface AppContextType {
  state: AppState;
  createTour: (name: string, baseCurrencyCode: string) => void;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  deleteTour: (tourId: string) => void;
  setActiveTour: (tourId: string | null) => void;
  addTraveler: (tourId: string, name: string) => void;
  updateTraveler: (tourId: string, travelerId: string, name: string) => void;
  removeTraveler: (tourId: string, travelerId: string) => void;
  addCurrency: (tourId: string, code: string, name: string, exchangeRate: number) => void;
  updateCurrency: (tourId: string, currencyCode: string, updates: Partial<Currency>) => void;
  removeCurrency: (tourId: string, currencyCode: string) => void;
  addExpense: (tourId: string, date: string, amount: number, currencyCode: string, description: string, paidById: string, splits: ExpenseSplit[]) => void;
  updateExpense: (tourId: string, expenseId: string, updates: Partial<Expense>) => void;
  removeExpense: (tourId: string, expenseId: string) => void;
  importTourFromLink: (url: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "travel-expense-tracker";

const initialState: AppState = {
  tours: [],
  activeTourId: null,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    // Check URL for tour data
    const urlParams = new URLSearchParams(window.location.search);
    const tourParam = urlParams.get("tour");

    if (tourParam) {
      try {
        const tourData = JSON.parse(decodeURIComponent(tourParam)) as Tour;
        const initialState: AppState = {
          tours: [tourData],
          activeTourId: tourData.id,
        };
        return initialState;
      } catch (error) {
        console.error("Failed to parse tour data from URL", error);
      }
    }

    // Load from localStorage if no tour data in URL
    return loadFromLocalStorage<AppState>(LOCAL_STORAGE_KEY, initialState);
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEY, state);
  }, [state]);

  const createTour = (name: string, baseCurrencyCode: string) => {
    const newTour: Tour = {
      id: uuidv4(),
      name,
      baseCurrencyCode,
      travelers: [],
      currencies: [
        {
          code: baseCurrencyCode,
          name: baseCurrencyCode,
          exchangeRate: 1, // Base currency always has exchange rate of 1
        },
      ],
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((prevState) => ({
      ...prevState,
      tours: [...prevState.tours, newTour],
      activeTourId: newTour.id,
    }));
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) =>
        tour.id === tourId
          ? {
              ...tour,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : tour
      ),
    }));
  };

  const deleteTour = (tourId: string) => {
    setState((prevState) => {
      const newTours = prevState.tours.filter((tour) => tour.id !== tourId);
      let newActiveTourId = prevState.activeTourId;

      if (prevState.activeTourId === tourId) {
        newActiveTourId = newTours.length > 0 ? newTours[0].id : null;
      }

      return {
        ...prevState,
        tours: newTours,
        activeTourId: newActiveTourId,
      };
    });
  };

  const setActiveTour = (tourId: string | null) => {
    setState((prevState) => ({
      ...prevState,
      activeTourId: tourId,
    }));
  };

  const addTraveler = (tourId: string, name: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          const newTraveler: Traveler = {
            id: uuidv4(),
            name,
          };

          return {
            ...tour,
            travelers: [...tour.travelers, newTraveler],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const updateTraveler = (tourId: string, travelerId: string, name: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            travelers: tour.travelers.map((traveler) => (traveler.id === travelerId ? { ...traveler, name } : traveler)),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const removeTraveler = (tourId: string, travelerId: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          // Remove traveler
          const updatedTravelers = tour.travelers.filter((traveler) => traveler.id !== travelerId);

          // Remove expenses paid by this traveler or split with this traveler
          const updatedExpenses = tour.expenses
            .filter((expense) => {
              // Keep expenses not paid by this traveler
              if (expense.paidById === travelerId) {
                return false;
              }

              // Remove this traveler from splits and keep expenses that still have splits
              const updatedSplits = expense.splits.filter((split) => split.travelerId !== travelerId);

              // If all splits were for this traveler, remove the expense
              return updatedSplits.length > 0;
            })
            .map((expense) => {
              // Update splits to remove this traveler
              const updatedSplits = expense.splits.filter((split) => split.travelerId !== travelerId);

              // Recalculate percentages to total 100%
              const totalPercentage = updatedSplits.reduce((sum, split) => sum + split.percentage, 0);

              if (totalPercentage > 0 && totalPercentage !== 100) {
                const scaleFactor = 100 / totalPercentage;
                updatedSplits.forEach((split) => {
                  split.percentage *= scaleFactor;
                });
              }

              return {
                ...expense,
                splits: updatedSplits,
              };
            });

          return {
            ...tour,
            travelers: updatedTravelers,
            expenses: updatedExpenses,
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const addCurrency = (tourId: string, code: string, name: string, exchangeRate: number) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          // Check if currency already exists
          const currencyExists = tour.currencies.some((c) => c.code === code);
          if (currencyExists) {
            return tour;
          }

          const newCurrency: Currency = {
            code,
            name,
            exchangeRate,
          };

          return {
            ...tour,
            currencies: [...tour.currencies, newCurrency],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const updateCurrency = (tourId: string, currencyCode: string, updates: Partial<Currency>) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            currencies: tour.currencies.map((currency) => (currency.code === currencyCode ? { ...currency, ...updates } : currency)),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const removeCurrency = (tourId: string, currencyCode: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          // Don't remove base currency
          if (currencyCode === tour.baseCurrencyCode) {
            return tour;
          }

          // Remove currency
          const updatedCurrencies = tour.currencies.filter((currency) => currency.code !== currencyCode);

          // Remove expenses in this currency
          const updatedExpenses = tour.expenses.filter((expense) => expense.currencyCode !== currencyCode);

          return {
            ...tour,
            currencies: updatedCurrencies,
            expenses: updatedExpenses,
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const addExpense = (tourId: string, date: string, amount: number, currencyCode: string, description: string, paidById: string, splits: ExpenseSplit[]) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          const newExpense: Expense = {
            id: uuidv4(),
            date,
            amount,
            currencyCode,
            description,
            paidById,
            splits,
          };

          return {
            ...tour,
            expenses: [...tour.expenses, newExpense],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const updateExpense = (tourId: string, expenseId: string, updates: Partial<Expense>) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            expenses: tour.expenses.map((expense) => (expense.id === expenseId ? { ...expense, ...updates } : expense)),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const removeExpense = (tourId: string, expenseId: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            expenses: tour.expenses.filter((expense) => expense.id !== expenseId),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const importTourFromLink = (url: string): boolean => {
    try {
      const tourData = parseShareableLink(url);

      if (!tourData) {
        return false;
      }

      // Check if tour with same ID already exists
      const tourExists = state.tours.some((tour) => tour.id === tourData.id);

      if (tourExists) {
        // Update existing tour
        setState((prevState) => ({
          ...prevState,
          tours: prevState.tours.map((tour) => (tour.id === tourData.id ? { ...tourData } : tour)),
          activeTourId: tourData.id,
        }));
      } else {
        // Add new tour
        setState((prevState) => ({
          ...prevState,
          tours: [...prevState.tours, tourData],
          activeTourId: tourData.id,
        }));
      }

      return true;
    } catch (error) {
      console.error("Failed to import tour from link", error);
      return false;
    }
  };

  const contextValue: AppContextType = {
    state,
    createTour,
    updateTour,
    deleteTour,
    setActiveTour,
    addTraveler,
    updateTraveler,
    removeTraveler,
    addCurrency,
    updateCurrency,
    removeCurrency,
    addExpense,
    updateExpense,
    removeExpense,
    importTourFromLink,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
