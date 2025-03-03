import { createClient } from "@supabase/supabase-js";
import { AppState, Tour } from "../types";

const supabaseUrl = "https://mihuohbzzkyhpfmtwqvz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paHVvaGJ6emt5aHBmbXR3cXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5OTc2MjcsImV4cCI6MjA1NjU3MzYyN30.rQnP8tPVTukAUL715x8dzjiXwGsQm2x40XuasPVW56A";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save app state to Supabase
export const saveAppState = async (state: AppState): Promise<void> => {
  try {
    // Save the app state (active tour ID)
    const { error } = await supabase.from("app_state").upsert({ id: 1, active_tour_id: state.activeTourId }).select();

    if (error) throw error;

    // Save each tour
    for (const tour of state.tours) {
      await saveTour(tour);
    }
  } catch (error) {
    console.error("Error saving app state to Supabase:", error);
    throw error;
  }
};

// Load app state from Supabase
export const loadAppState = async (defaultState: AppState): Promise<AppState> => {
  try {
    // Load app state
    const { data: appStateData, error: appStateError } = await supabase.from("app_state").select("active_tour_id").eq("id", 1).single();

    if (appStateError && appStateError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error, which is fine for a new app
      throw appStateError;
    }

    // Load all tours
    const { data: toursData, error: toursError } = await supabase.from("tours").select("*");

    if (toursError) throw toursError;

    // For each tour, load its related data
    const tours: Tour[] = [];

    if (toursData) {
      for (const tourData of toursData) {
        const tour = await loadTourDetails(tourData.id);
        if (tour) tours.push(tour);
      }
    }

    return {
      tours,
      activeTourId: appStateData?.active_tour_id || null,
    };
  } catch (error) {
    console.error("Error loading app state from Supabase:", error);
    return defaultState;
  }
};

// Save a tour to Supabase
export const saveTour = async (tour: Tour): Promise<void> => {
  try {
    // Save the tour basic info
    const { error: tourError } = await supabase
      .from("tours")
      .upsert({
        id: tour.id,
        name: tour.name,
        base_currency_code: tour.baseCurrencyCode,
        created_at: tour.createdAt,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (tourError) throw tourError;

    // Handle travelers - first get existing travelers
    const { data: existingTravelers, error: fetchTravelersError } = await supabase.from("travelers").select("id").eq("tour_id", tour.id);

    if (fetchTravelersError) throw fetchTravelersError;

    // Create a set of current traveler IDs
    const currentTravelerIds = new Set(tour.travelers.map((traveler) => traveler.id));

    // Delete travelers that no longer exist in the state
    for (const existingTraveler of existingTravelers || []) {
      if (!currentTravelerIds.has(existingTraveler.id)) {
        const { error: deleteTravelerError } = await supabase.from("travelers").delete().eq("id", existingTraveler.id);

        if (deleteTravelerError) throw deleteTravelerError;
      }
    }

    // Save current travelers
    for (const traveler of tour.travelers) {
      const { error: travelerError } = await supabase
        .from("travelers")
        .upsert({
          id: traveler.id,
          tour_id: tour.id,
          name: traveler.name,
        })
        .select();

      if (travelerError) throw travelerError;
    }

    // Handle currencies - first get existing currencies
    const { data: existingCurrencies, error: fetchCurrenciesError } = await supabase.from("currencies").select("code").eq("tour_id", tour.id);

    if (fetchCurrenciesError) throw fetchCurrenciesError;

    // Create a set of current currency codes
    const currentCurrencyCodes = new Set(tour.currencies.map((currency) => currency.code));

    // Delete currencies that no longer exist in the state
    for (const existingCurrency of existingCurrencies || []) {
      if (!currentCurrencyCodes.has(existingCurrency.code)) {
        const { error: deleteCurrencyError } = await supabase.from("currencies").delete().eq("code", existingCurrency.code).eq("tour_id", tour.id);

        if (deleteCurrencyError) throw deleteCurrencyError;
      }
    }

    // Save current currencies
    for (const currency of tour.currencies) {
      const { error: currencyError } = await supabase
        .from("currencies")
        .upsert({
          code: currency.code,
          tour_id: tour.id,
          name: currency.name,
          exchange_rate: currency.exchangeRate,
        })
        .select();

      if (currencyError) throw currencyError;
    }

    // Handle expenses - first get existing expenses
    const { data: existingExpenses, error: fetchExpensesError } = await supabase.from("expenses").select("id").eq("tour_id", tour.id);

    if (fetchExpensesError) throw fetchExpensesError;

    // Create a set of current expense IDs
    const currentExpenseIds = new Set(tour.expenses.map((expense) => expense.id));

    // Delete expenses that no longer exist in the state
    for (const existingExpense of existingExpenses || []) {
      if (!currentExpenseIds.has(existingExpense.id)) {
        // Note: expense_splits will be deleted automatically due to ON DELETE CASCADE
        const { error: deleteExpenseError } = await supabase.from("expenses").delete().eq("id", existingExpense.id);

        if (deleteExpenseError) throw deleteExpenseError;
      }
    }

    // Save current expenses and their splits
    for (const expense of tour.expenses) {
      const { error: expenseError } = await supabase
        .from("expenses")
        .upsert({
          id: expense.id,
          tour_id: tour.id,
          date: expense.date,
          amount: expense.amount,
          currency_code: expense.currencyCode,
          description: expense.description,
          paid_by_id: expense.paidById,
        })
        .select();

      if (expenseError) throw expenseError;

      // Handle expense splits - first get existing splits
      const { data: existingSplits, error: fetchSplitsError } = await supabase.from("expense_splits").select("traveler_id").eq("expense_id", expense.id);

      if (fetchSplitsError) throw fetchSplitsError;

      // Create a set of current traveler IDs in splits
      const currentSplitTravelerIds = new Set(expense.splits.map((split) => split.travelerId));

      // Delete splits that no longer exist in the state
      for (const existingSplit of existingSplits || []) {
        if (!currentSplitTravelerIds.has(existingSplit.traveler_id)) {
          const { error: deleteSplitError } = await supabase.from("expense_splits").delete().eq("expense_id", expense.id).eq("traveler_id", existingSplit.traveler_id);

          if (deleteSplitError) throw deleteSplitError;
        }
      }

      // Save current splits
      for (const split of expense.splits) {
        const { error: splitError } = await supabase
          .from("expense_splits")
          .upsert({
            expense_id: expense.id,
            traveler_id: split.travelerId,
            amount: split.amount,
            percentage: split.percentage,
          })
          .select();

        if (splitError) throw splitError;
      }
    }

    // Handle payments - first get existing payments
    const { data: existingPayments, error: fetchPaymentsError } = await supabase.from("payments").select("id").eq("tour_id", tour.id);

    if (fetchPaymentsError) throw fetchPaymentsError;

    // Create a set of current payment IDs
    const currentPaymentIds = new Set(tour.payments.map((payment) => payment.id));

    // Delete payments that no longer exist in the state
    for (const existingPayment of existingPayments || []) {
      if (!currentPaymentIds.has(existingPayment.id)) {
        const { error: deletePaymentError } = await supabase.from("payments").delete().eq("id", existingPayment.id);

        if (deletePaymentError) throw deletePaymentError;
      }
    }

    // Save current payments
    for (const payment of tour.payments) {
      const { error: paymentError } = await supabase
        .from("payments")
        .upsert({
          id: payment.id,
          tour_id: tour.id,
          date: payment.date,
          from_traveler_id: payment.fromTravelerId,
          to_traveler_id: payment.toTravelerId,
          amount: payment.amount,
          currency_code: payment.currencyCode,
          method: payment.method,
          notes: payment.notes,
        })
        .select();

      if (paymentError) throw paymentError;
    }
  } catch (error) {
    console.error(`Error saving tour ${tour.id} to Supabase:`, error);
    throw error;
  }
};

// Load a tour with all its details from Supabase
export const loadTourDetails = async (tourId: string): Promise<Tour | null> => {
  try {
    // Load tour basic info
    const { data: tourData, error: tourError } = await supabase.from("tours").select("*").eq("id", tourId).single();

    if (tourError) throw tourError;

    // Load travelers
    const { data: travelersData, error: travelersError } = await supabase.from("travelers").select("*").eq("tour_id", tourId);

    if (travelersError) throw travelersError;

    // Load currencies
    const { data: currenciesData, error: currenciesError } = await supabase.from("currencies").select("*").eq("tour_id", tourId);

    if (currenciesError) throw currenciesError;

    // Load expenses
    const { data: expensesData, error: expensesError } = await supabase.from("expenses").select("*").eq("tour_id", tourId);

    if (expensesError) throw expensesError;

    // Load expense splits for all expenses
    const expenseIds = expensesData.map((expense) => expense.id);
    let splitsData: any[] = [];

    if (expenseIds.length > 0) {
      const { data: fetchedSplitsData, error: splitsError } = await supabase.from("expense_splits").select("*").in("expense_id", expenseIds);

      if (splitsError) throw splitsError;
      splitsData = fetchedSplitsData || [];
    }

    // Load payments
    const { data: paymentsData, error: paymentsError } = await supabase.from("payments").select("*").eq("tour_id", tourId);

    if (paymentsError) throw paymentsError;

    // Construct the tour object
    const tour: Tour = {
      id: tourData.id,
      name: tourData.name,
      baseCurrencyCode: tourData.base_currency_code,
      createdAt: tourData.created_at,
      updatedAt: tourData.updated_at,
      travelers: travelersData.map((traveler) => ({
        id: traveler.id,
        name: traveler.name,
      })),
      currencies: currenciesData.map((currency) => ({
        code: currency.code,
        name: currency.name,
        exchangeRate: currency.exchange_rate,
      })),
      expenses: expensesData.map((expense) => ({
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        currencyCode: expense.currency_code,
        description: expense.description,
        paidById: expense.paid_by_id,
        splits: splitsData
          .filter((split) => split.expense_id === expense.id)
          .map((split) => ({
            travelerId: split.traveler_id,
            amount: split.amount,
            percentage: split.percentage,
          })),
      })),
      payments: paymentsData.map((payment) => ({
        id: payment.id,
        date: payment.date,
        fromTravelerId: payment.from_traveler_id,
        toTravelerId: payment.to_traveler_id,
        amount: payment.amount,
        currencyCode: payment.currency_code,
        method: payment.method,
        notes: payment.notes,
      })),
    };

    return tour;
  } catch (error) {
    console.error(`Error loading tour ${tourId} from Supabase:`, error);
    return null;
  }
};

// Delete a tour from Supabase
export const deleteTour = async (tourId: string): Promise<boolean> => {
  try {
    // Delete the tour (cascade will handle related data)
    const { error } = await supabase.from("tours").delete().eq("id", tourId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting tour ${tourId} from Supabase:`, error);
    return false;
  }
};
