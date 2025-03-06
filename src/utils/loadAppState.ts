import { AppState, ExpenseCategory, Tour } from "../types";
import { supabase } from "./supabase";

// Default expense categories
const defaultExpenseCategories: ExpenseCategory[] = [
  { id: "food", name: "Food & Drinks", icon: "restaurant", color: "#FF5722" },
  { id: "accommodation", name: "Accommodation", icon: "hotel", color: "#2196F3" },
  { id: "transportation", name: "Transportation", icon: "directions_car", color: "#4CAF50" },
  { id: "activities", name: "Activities", icon: "local_activity", color: "#9C27B0" },
  { id: "shopping", name: "Shopping", icon: "shopping_bag", color: "#E91E63" },
  { id: "other", name: "Other", icon: "more_horiz", color: "#607D8B" },
];

export const loadAppState = async (initialState: AppState): Promise<AppState> => {
  try {
    // Load tours
    const { data: tours, error: toursError } = await supabase.from("tours").select("*");

    if (toursError) {
      console.error("Error loading tours:", toursError);
      return initialState;
    }

    // Transform tours data
    const transformedTours: Tour[] = [];

    for (const tour of tours) {
      try {
        // Load travelers for this tour
        const { data: travelers, error: travelersError } = await supabase.from("travelers").select("*").eq("tour_id", tour.id);

        if (travelersError) {
          console.error(`Error loading travelers for tour ${tour.id}:`, travelersError);
          continue;
        }

        // Load currencies for this tour
        const { data: currencies, error: currenciesError } = await supabase.from("currencies").select("*").eq("tour_id", tour.id);

        if (currenciesError) {
          console.error(`Error loading currencies for tour ${tour.id}:`, currenciesError);
          continue;
        }

        // Load expenses for this tour
        const { data: expenses, error: expensesError } = await supabase.from("expenses").select("*").eq("tour_id", tour.id);

        if (expensesError) {
          console.error(`Error loading expenses for tour ${tour.id}:`, expensesError);
          continue;
        }

        // Load expense splits for each expense
        const expensesWithSplits = await Promise.all(
          expenses.map(async (expense) => {
            const { data: splits, error: splitsError } = await supabase.from("expense_splits").select("*").eq("expense_id", expense.id);

            if (splitsError) {
              console.error(`Error loading splits for expense ${expense.id}:`, splitsError);
              return {
                ...expense,
                splits: [],
              };
            }

            return {
              id: expense.id,
              description: expense.description,
              amount: expense.amount,
              currencyCode: expense.currency_code,
              date: expense.date,
              paidById: expense.paid_by_id,
              categoryId: expense.category_id,
              splits: splits.map((split) => ({
                travelerId: split.traveler_id,
                amount: split.amount,
              })),
              createdAt: expense.created_at,
            };
          })
        );

        // Load payments for this tour
        const { data: payments, error: paymentsError } = await supabase.from("payments").select("*").eq("tour_id", tour.id);

        if (paymentsError) {
          console.error(`Error loading payments for tour ${tour.id}:`, paymentsError);
          continue;
        }

        // Transform the tour data
        transformedTours.push({
          id: tour.id,
          name: tour.name,
          baseCurrencyCode: tour.base_currency_code,
          travelers: travelers.map((traveler) => ({
            id: traveler.id,
            name: traveler.name,
          })),
          currencies: currencies.map((currency) => ({
            code: currency.code,
            name: currency.name,
            exchangeRate: currency.exchange_rate,
          })),
          expenses: expensesWithSplits,
          payments: payments.map((payment) => ({
            id: payment.id,
            fromTravelerId: payment.from_traveler_id,
            toTravelerId: payment.to_traveler_id,
            amount: payment.amount,
            currencyCode: payment.currency_code,
            date: payment.date,
            description: payment.description || "",
            createdAt: payment.created_at,
          })),
          createdAt: tour.created_at,
          updatedAt: tour.updated_at,
        });
      } catch (error) {
        console.error(`Error processing tour ${tour.id}:`, error);
      }
    }

    // Load expense categories
    let expenseCategories = defaultExpenseCategories;
    try {
      const { data: categories, error: categoriesError } = await supabase.from("expense_categories").select("*");

      if (!categoriesError && categories && categories.length > 0) {
        expenseCategories = categories.map((category) => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        }));
      } else {
        console.log("Using default expense categories");
      }
    } catch (error) {
      console.error("Error loading expense categories:", error);
    }

    return {
      tours: transformedTours,
      activeTourId: initialState.activeTourId,
      expenseCategories,
    };
  } catch (error) {
    console.error("Error loading app state:", error);
    return initialState;
  }
};
