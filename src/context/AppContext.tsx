import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, Currency, DEFAULT_EXPENSE_CATEGORIES, Expense, ExpenseCategory, PaymentRecord, Tour, Traveler, User } from "../types";
import { parseShareableLink } from "../utils";
import { deleteTour as deleteSupabaseTour, loadAppState, saveAppState } from "../utils/supabase";

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
  addExpense: (tourId: string, expenseData: Omit<Expense, "id" | "createdById" | "createdAt">) => void;
  updateExpense: (tourId: string, expenseId: string, updates: Partial<Expense>) => void;
  removeExpense: (tourId: string, expenseId: string) => void;
  addPayment: (tourId: string, paymentData: Omit<PaymentRecord, "id" | "createdById" | "createdAt">) => void;
  removePayment: (tourId: string, paymentId: string) => void;
  importTourFromLink: (url: string) => boolean;
  setCurrentUser: (user: User | null) => void;
  addExpenseCategory: (category: Omit<ExpenseCategory, "id">) => void;
  updateExpenseCategory: (categoryId: string, updates: Partial<ExpenseCategory>) => void;
  removeExpenseCategory: (categoryId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  tours: [],
  activeTourId: null,
  currentUser: null,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from Supabase
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Check URL for tour data
        const urlParams = new URLSearchParams(window.location.search);
        const tourParam = urlParams.get("tour");

        if (tourParam) {
          try {
            const tourData = JSON.parse(decodeURIComponent(tourParam)) as Tour;
            const initialState: AppState = {
              tours: [tourData],
              activeTourId: tourData.id,
              currentUser: null,
              expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            };
            setState(initialState);
          } catch (error) {
            console.error("Failed to parse tour data from URL", error);
            // Fall back to loading from Supabase
            const appState = await loadAppState(initialState);
            setState(appState);
          }
        } else {
          // Load from Supabase if no tour data in URL
          const appState = await loadAppState(initialState);
          setState(appState);
        }
      } catch (error) {
        console.error("Failed to load initial state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialState();
  }, []);

  // Save state to Supabase whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const saveStateToSupabase = async () => {
        try {
          await saveAppState(state);
        } catch (error) {
          console.error("Failed to save state to Supabase:", error);
        }
      };

      saveStateToSupabase();
    }
  }, [state, isLoading]);

  const createTour = (name: string, baseCurrencyCode: string) => {
    if (!state.currentUser) {
      console.error("Cannot create tour: No user is logged in");
      return;
    }

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
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdById: state.currentUser.id,
      members: [state.currentUser.id],
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

  const deleteTour = async (tourId: string) => {
    try {
      // Delete from Supabase first
      await deleteSupabaseTour(tourId);

      // Then update local state
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
    } catch (error) {
      console.error(`Failed to delete tour ${tourId}:`, error);
    }
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
          // Check if it's the base currency
          if (currencyCode === tour.baseCurrencyCode) {
            // Can't remove base currency
            return tour;
          }

          // Check if there are expenses using this currency
          const currencyInUse = tour.expenses.some((expense) => expense.currencyCode === currencyCode);
          if (currencyInUse) {
            // Can't remove currency in use
            return tour;
          }

          return {
            ...tour,
            currencies: tour.currencies.filter((currency) => currency.code !== currencyCode),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const addExpense = (tourId: string, expenseData: Omit<Expense, "id" | "createdById" | "createdAt">) => {
    if (!state.currentUser) {
      console.error("Cannot add expense: No user is logged in");
      return;
    }

    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          const newExpense: Expense = {
            id: uuidv4(),
            ...expenseData,
            createdById: state.currentUser!.id,
            createdAt: new Date().toISOString(),
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

  const addPayment = (tourId: string, paymentData: Omit<PaymentRecord, "id" | "createdById" | "createdAt">) => {
    if (!state.currentUser) {
      console.error("Cannot add payment: No user is logged in");
      return;
    }

    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          const newPayment: PaymentRecord = {
            id: uuidv4(),
            ...paymentData,
            createdById: state.currentUser!.id,
            createdAt: new Date().toISOString(),
          };

          return {
            ...tour,
            payments: [...tour.payments, newPayment],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  const removePayment = (tourId: string, paymentId: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            payments: tour.payments.filter((payment) => payment.id !== paymentId),
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
        // Generate a new ID for the imported tour
        tourData.id = uuidv4();
      }

      setState((prevState) => ({
        ...prevState,
        tours: [...prevState.tours, tourData],
        activeTourId: tourData.id,
      }));

      return true;
    } catch (error) {
      console.error("Failed to import tour from link", error);
      return false;
    }
  };

  const setCurrentUser = (user: User | null) => {
    setState((prevState) => ({
      ...prevState,
      currentUser: user,
    }));
  };

  const addExpenseCategory = (category: Omit<ExpenseCategory, "id">) => {
    const newCategory: ExpenseCategory = {
      id: uuidv4(),
      ...category,
    };

    setState((prevState) => ({
      ...prevState,
      expenseCategories: [...prevState.expenseCategories, newCategory],
    }));
  };

  const updateExpenseCategory = (categoryId: string, updates: Partial<ExpenseCategory>) => {
    setState((prevState) => ({
      ...prevState,
      expenseCategories: prevState.expenseCategories.map((category) => (category.id === categoryId ? { ...category, ...updates } : category)),
    }));
  };

  const removeExpenseCategory = (categoryId: string) => {
    setState((prevState) => ({
      ...prevState,
      expenseCategories: prevState.expenseCategories.filter((category) => category.id !== categoryId),
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AppContext.Provider
      value={{
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
        addPayment,
        removePayment,
        importTourFromLink,
        setCurrentUser,
        addExpenseCategory,
        updateExpenseCategory,
        removeExpenseCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
