import { createClient } from "@supabase/supabase-js";
import { AppState, Tour } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env file.");
}

// Create Supabase client with proper options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  },
});

// Save app state to Supabase
export const saveAppState = async (state: AppState): Promise<void> => {
  try {
    // Save each tour individually
    for (const tour of state.tours) {
      await saveTour(tour);
    }
  } catch (error) {
    console.error("Error saving app state:", error);
  }
};

// Save a tour to Supabase
export const saveTour = async (tour: Tour): Promise<void> => {
  try {
    // First, check if the tour exists
    const { data: existingTour, error: checkError } = await supabase.from("tours").select("id").eq("id", tour.id).maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking tour existence:", checkError);
      return;
    }

    // Prepare tour data for Supabase
    const tourData = {
      id: tour.id,
      name: tour.name,
      base_currency_code: tour.baseCurrencyCode,
      created_at: tour.createdAt,
      updated_at: new Date().toISOString(),
    };

    if (existingTour) {
      // Update existing tour
      const { error: updateError } = await supabase.from("tours").update(tourData).eq("id", tour.id);

      if (updateError) {
        console.error("Error updating tour:", updateError);
        return;
      }
    } else {
      // Insert new tour
      const { error: insertError } = await supabase.from("tours").insert(tourData);

      if (insertError) {
        console.error("Error inserting tour:", insertError);
        return;
      }
    }

    // Handle travelers
    if (tour.travelers && tour.travelers.length > 0) {
      try {
        // Get existing travelers
        const { data: existingTravelers, error: travelersError } = await supabase.from("travelers").select("id").eq("tour_id", tour.id);

        if (travelersError) {
          console.error("Error fetching existing travelers:", travelersError);
        } else {
          // Create a set of existing traveler IDs
          const existingIds = new Set(existingTravelers?.map((t) => t.id) || []);

          // Create a set of current traveler IDs
          const currentIds = new Set(tour.travelers.map((t) => t.id));

          // Find travelers to delete (in existing but not in current)
          const idsToDelete = [...existingIds].filter((id) => !currentIds.has(id));

          // Delete removed travelers
          if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from("travelers").delete().in("id", idsToDelete);
            if (deleteError) {
              console.error("Error deleting travelers:", deleteError);
            }
          }

          // Upsert current travelers
          const travelersToUpsert = tour.travelers.map((traveler) => ({
            id: traveler.id,
            tour_id: tour.id,
            name: traveler.name,
          }));

          if (travelersToUpsert.length > 0) {
            const { error: upsertError } = await supabase.from("travelers").upsert(travelersToUpsert);
            if (upsertError) {
              console.error("Error upserting travelers:", upsertError);
            }
          }
        }
      } catch (error) {
        console.error("Error handling travelers:", error);
      }
    }

    // Handle currencies
    if (tour.currencies && tour.currencies.length > 0) {
      try {
        // First delete all currencies for this tour
        const { error: deleteError } = await supabase.from("currencies").delete().eq("tour_id", tour.id);

        if (deleteError) {
          console.error("Error deleting currencies:", deleteError);
        } else {
          // Then insert all current currencies
          const currenciesToInsert = tour.currencies.map((currency) => ({
            tour_id: tour.id,
            code: currency.code,
            name: currency.name,
            exchange_rate: currency.exchangeRate,
          }));

          const { error: insertError } = await supabase.from("currencies").insert(currenciesToInsert);

          if (insertError) {
            console.error("Error inserting currencies:", insertError);
          }
        }
      } catch (error) {
        console.error("Error handling currencies:", error);
      }
    }

    // Handle expenses
    if (tour.expenses && tour.expenses.length > 0) {
      try {
        // Get existing expenses
        const { data: existingExpenses, error: expensesError } = await supabase.from("expenses").select("id").eq("tour_id", tour.id);

        if (expensesError) {
          console.error("Error fetching existing expenses:", expensesError);
        } else {
          // Create a set of existing expense IDs
          const existingIds = new Set(existingExpenses?.map((e) => e.id) || []);

          // Create a set of current expense IDs
          const currentIds = new Set(tour.expenses.map((e) => e.id));

          // Find expenses to delete (in existing but not in current)
          const idsToDelete = [...existingIds].filter((id) => !currentIds.has(id));

          // Delete removed expenses
          if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from("expenses").delete().in("id", idsToDelete);
            if (deleteError) {
              console.error("Error deleting expenses:", deleteError);
            }
          }

          // Upsert current expenses
          for (const expense of tour.expenses) {
            const expenseData = {
              id: expense.id,
              tour_id: tour.id,
              description: expense.description,
              amount: expense.amount,
              currency_code: expense.currencyCode,
              date: expense.date,
              paid_by_id: expense.paidById,
              category_id: expense.categoryId,
              created_at: expense.createdAt,
            };

            const { error: upsertError } = await supabase.from("expenses").upsert(expenseData);

            if (upsertError) {
              console.error("Error upserting expense:", upsertError);
            } else {
              // Handle expense splits
              if (expense.splits && expense.splits.length > 0) {
                // First delete all splits for this expense
                const { error: deleteSplitsError } = await supabase.from("expense_splits").delete().eq("expense_id", expense.id);

                if (deleteSplitsError) {
                  console.error("Error deleting expense splits:", deleteSplitsError);
                } else {
                  // Then insert all current splits
                  const splitsToInsert = expense.splits.map((split) => ({
                    expense_id: expense.id,
                    traveler_id: split.travelerId,
                    amount: split.amount,
                  }));

                  const { error: insertSplitsError } = await supabase.from("expense_splits").insert(splitsToInsert);

                  if (insertSplitsError) {
                    console.error("Error inserting expense splits:", insertSplitsError);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error handling expenses:", error);
      }
    }

    // Handle payments
    if (tour.payments && tour.payments.length > 0) {
      try {
        // Get existing payments
        const { data: existingPayments, error: paymentsError } = await supabase.from("payments").select("id").eq("tour_id", tour.id);

        if (paymentsError) {
          console.error("Error fetching existing payments:", paymentsError);
        } else {
          // Create a set of existing payment IDs
          const existingIds = new Set(existingPayments?.map((p) => p.id) || []);

          // Create a set of current payment IDs
          const currentIds = new Set(tour.payments.map((p) => p.id));

          // Find payments to delete (in existing but not in current)
          const idsToDelete = [...existingIds].filter((id) => !currentIds.has(id));

          // Delete removed payments
          if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase.from("payments").delete().in("id", idsToDelete);
            if (deleteError) {
              console.error("Error deleting payments:", deleteError);
            }
          }

          // Upsert current payments
          for (const payment of tour.payments) {
            const paymentData = {
              id: payment.id,
              tour_id: tour.id,
              from_traveler_id: payment.fromTravelerId,
              to_traveler_id: payment.toTravelerId,
              amount: payment.amount,
              currency_code: payment.currencyCode,
              date: payment.date,
              description: payment.description,
              created_at: payment.createdAt,
            };

            const { error: upsertError } = await supabase.from("payments").upsert(paymentData);

            if (upsertError) {
              console.error("Error upserting payment:", upsertError);
            }
          }
        }
      } catch (error) {
        console.error("Error handling payments:", error);
      }
    }
  } catch (error) {
    console.error("Error saving tour:", error);
  }
};

// Delete a tour from Supabase
export const deleteTour = async (tourId: string): Promise<void> => {
  try {
    const { error } = await supabase.from("tours").delete().eq("id", tourId);

    if (error) {
      console.error("Error deleting tour:", error);
    }
  } catch (error) {
    console.error("Error deleting tour:", error);
  }
};
