import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AppState, Currency, DEFAULT_EXPENSE_CATEGORIES, Expense, ExpenseCategory, PaymentRecord, PlanningTask, Tour } from "../types/index";
import { parseShareableLink } from "../utils";
import { deleteTour as deleteSupabaseTour, loadAppState, saveAppState } from "../utils/supabase";

// Extend ExpenseSplit interface to include percentage property
interface ExtendedExpenseSplit {
  travelerId: string;
  amount: number;
  percentage: number;
}

interface AppContextType {
  state: AppState;
  createTour: (name: string, baseCurrencyCode: string) => Promise<Tour | null>;
  updateTour: (tourId: string, updates: Partial<Tour>) => void;
  deleteTour: (tourId: string) => void;
  setActiveTour: (tourId: string | null) => void;
  addTraveler: (tourId: string, name: string) => void;
  updateTraveler: (tourId: string, travelerId: string, name: string) => void;
  removeTraveler: (tourId: string, travelerId: string) => void;
  addCurrency: (tourId: string, code: string, name: string, exchangeRate: number) => void;
  updateCurrency: (tourId: string, currencyCode: string, updates: Partial<Currency>) => void;
  removeCurrency: (tourId: string, currencyCode: string) => void;
  addExpense: (tourId: string, expenseData: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (tourId: string, expenseId: string, updates: Partial<Expense>) => void;
  removeExpense: (tourId: string, expenseId: string) => void;
  addPayment: (tourId: string, paymentData: Omit<PaymentRecord, "id" | "createdAt">) => void;
  removePayment: (tourId: string, paymentId: string) => void;
  addPlanningTask: (task: PlanningTask) => void;
  updatePlanningTask: (taskId: string, task: Partial<PlanningTask>) => void;
  deletePlanningTask: (taskId: string) => void;
  toggleTaskCompletion: (tourId: string, taskId: string) => void;
  importTourFromLink: (url: string) => boolean;
  addExpenseCategory: (category: Omit<ExpenseCategory, "id">) => void;
  updateExpenseCategory: (categoryId: string, updates: Partial<ExpenseCategory>) => void;
  removeExpenseCategory: (categoryId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  tours: [],
  activeTourId: null,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  planningTasks: [],
};

// Helper function to get currency name from code
const getCurrencyName = (code: string): string => {
  const currencyNames: Record<string, string> = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    INR: "Indian Rupee",
    MXN: "Mexican Peso",
    BRL: "Brazilian Real",
    ZAR: "South African Rand",
    SGD: "Singapore Dollar",
    NZD: "New Zealand Dollar",
    THB: "Thai Baht",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
    HKD: "Hong Kong Dollar",
    KRW: "South Korean Won",
  };

  return currencyNames[code] || code;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial state from Supabase or URL parameters
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check URL for tour data
        const urlParams = new URLSearchParams(window.location.search);
        const tourData = urlParams.get("tour");

        if (tourData) {
          // If tour data is in URL, try to parse it
          const parsedTour = parseShareableLink(tourData);
          if (parsedTour) {
            setState((prevState) => ({
              ...prevState,
              tours: [...prevState.tours, parsedTour],
              activeTourId: parsedTour.id,
            }));
          }
        } else {
          // Otherwise, load data from Supabase
          console.log("Loading app state from Supabase...");
          const loadedState = await loadAppState(initialState);
          console.log("Loaded state from Supabase:", loadedState);
          setState(loadedState);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Save state to Supabase whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveAppState(state);
    }
  }, [state, isInitialized]);

  // Create a new tour
  const createTour = async (name: string, baseCurrencyCode: string): Promise<Tour | null> => {
    try {
      const tourId = uuidv4();
      const now = new Date().toISOString();

      const newTour: Tour = {
        id: tourId,
        name,
        baseCurrencyCode: baseCurrencyCode.toUpperCase(),
        travelers: [],
        currencies: [
          {
            code: baseCurrencyCode.toUpperCase(),
            name: getCurrencyName(baseCurrencyCode.toUpperCase()),
            exchangeRate: 1,
          },
        ],
        expenses: [],
        payments: [],
        planningTasks: [],
        createdAt: now,
        updatedAt: now,
      };

      setState((prevState) => ({
        ...prevState,
        tours: [...prevState.tours, newTour],
        activeTourId: tourId,
      }));

      return newTour;
    } catch (error) {
      console.error("Error creating tour:", error);
      return null;
    }
  };

  // Update an existing tour
  const updateTour = (tourId: string, updates: Partial<Tour>) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => (tour.id === tourId ? { ...tour, ...updates, updatedAt: new Date().toISOString() } : tour)),
    }));
  };

  // Delete a tour
  const deleteTour = (tourId: string) => {
    setState((prevState) => {
      const newTours = prevState.tours.filter((tour) => tour.id !== tourId);
      const newActiveTourId = prevState.activeTourId === tourId ? (newTours.length > 0 ? newTours[0].id : null) : prevState.activeTourId;

      // Delete from Supabase
      deleteSupabaseTour(tourId);

      return {
        ...prevState,
        tours: newTours,
        activeTourId: newActiveTourId,
      };
    });
  };

  // Set the active tour
  const setActiveTour = (tourId: string | null) => {
    setState((prevState) => ({
      ...prevState,
      activeTourId: tourId,
    }));
  };

  // Add a traveler to a tour
  const addTraveler = (tourId: string, name: string) => {
    const travelerId = uuidv4();

    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            travelers: [...tour.travelers, { id: travelerId, name }],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  // Update a traveler
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

  // Remove a traveler
  const removeTraveler = (tourId: string, travelerId: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            travelers: tour.travelers.filter((traveler) => traveler.id !== travelerId),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  // Add a currency to a tour
  const addCurrency = (tourId: string, code: string, name: string, exchangeRate: number) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            currencies: [...tour.currencies, { code, name, exchangeRate }],
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
  };

  // Update a currency
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

  // Remove a currency
  const removeCurrency = (tourId: string, currencyCode: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
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

  // Add an expense to a tour
  const addExpense = (tourId: string, expenseData: Omit<Expense, "id" | "createdAt">) => {
    const expenseId = uuidv4();
    const now = new Date().toISOString();

    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            expenses: [
              ...tour.expenses,
              {
                ...expenseData,
                id: expenseId,
                createdAt: now,
              },
            ],
            updatedAt: now,
          };
        }
        return tour;
      }),
    }));
  };

  // Update an expense
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

  // Remove an expense
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

  // Add a payment to a tour
  const addPayment = (tourId: string, paymentData: Omit<PaymentRecord, "id" | "createdAt">) => {
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            payments: [
              ...tour.payments,
              {
                ...paymentData,
                id: paymentId,
                createdAt: now,
              },
            ],
            updatedAt: now,
          };
        }
        return tour;
      }),
    }));
  };

  // Remove a payment
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

  // Import a tour from a shareable link
  const importTourFromLink = (url: string): boolean => {
    try {
      const parsedTour = parseShareableLink(url);
      if (!parsedTour) return false;

      setState((prevState) => ({
        ...prevState,
        tours: [...prevState.tours, parsedTour],
        activeTourId: parsedTour.id,
      }));

      return true;
    } catch (error) {
      console.error("Error importing tour from link:", error);
      return false;
    }
  };

  // Add an expense category
  const addExpenseCategory = (category: Omit<ExpenseCategory, "id">) => {
    const categoryId = uuidv4();

    setState((prevState) => ({
      ...prevState,
      expenseCategories: [...prevState.expenseCategories, { ...category, id: categoryId }],
    }));
  };

  // Update an expense category
  const updateExpenseCategory = (categoryId: string, updates: Partial<ExpenseCategory>) => {
    setState((prevState) => ({
      ...prevState,
      expenseCategories: prevState.expenseCategories.map((category) => (category.id === categoryId ? { ...category, ...updates } : category)),
    }));
  };

  // Remove an expense category
  const removeExpenseCategory = (categoryId: string) => {
    setState((prevState) => ({
      ...prevState,
      expenseCategories: prevState.expenseCategories.filter((category) => category.id !== categoryId),
    }));
  };

  const addPlanningTask = (task: PlanningTask) => {
    setState((prevState) => {
      // Ensure planningTasks is initialized
      const planningTasks = Array.isArray(prevState.planningTasks) ? [...prevState.planningTasks, task] : [task];

      return {
        ...prevState,
        planningTasks,
      };
    });
  };

  const updatePlanningTask = (taskId: string, task: Partial<PlanningTask>) => {
    setState((prevState) => {
      // Ensure planningTasks is an array
      const planningTasks = Array.isArray(prevState.planningTasks) ? prevState.planningTasks : [];

      return {
        ...prevState,
        planningTasks: planningTasks.map((t) => (t.id === taskId ? { ...t, ...task } : t)),
      };
    });
  };

  const deletePlanningTask = (taskId: string) => {
    setState((prevState) => {
      // Ensure planningTasks is an array
      const planningTasks = Array.isArray(prevState.planningTasks) ? prevState.planningTasks : [];

      return {
        ...prevState,
        planningTasks: planningTasks.filter((t) => t.id !== taskId),
      };
    });
  };

  const toggleTaskCompletion = (tourId: string, taskId: string) => {
    setState((prevState) => ({
      ...prevState,
      tours: prevState.tours.map((tour) => {
        if (tour.id === tourId) {
          return {
            ...tour,
            planningTasks: tour.planningTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
            updatedAt: new Date().toISOString(),
          };
        }
        return tour;
      }),
    }));
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
    addPayment,
    removePayment,
    importTourFromLink,
    addExpenseCategory,
    updateExpenseCategory,
    removeExpenseCategory,
    addPlanningTask,
    updatePlanningTask,
    deletePlanningTask,
    toggleTaskCompletion,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
