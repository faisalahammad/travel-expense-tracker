import { createClient } from "@supabase/supabase-js";
import { AppState, PlanningTask, Tour } from "../types/index";

// Extended interfaces for database operations
interface ExtendedExpense {
  id: string;
  date: string;
  amount: number;
  currencyCode: string;
  baseAmount?: number;
  baseCurrencyCode?: string;
  description: string;
  paidById: string;
  splits: ExtendedExpenseSplit[];
  categoryId: string;
  createdAt: string;
}

interface ExtendedExpenseSplit {
  travelerId: string;
  amount: number;
  baseAmount?: number;
  percentage?: number;
}

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
export const saveAppState = async (state: AppState): Promise<{ data: any; error: any }> => {
  try {
    console.log("Saving app state to Supabase...");

    // Filter out tours that don't have required fields for database
    const validTours = state.tours.filter((tour) => (tour.email && tour.pinHash) || tour.userId);

    if (validTours.length === 0) {
      console.log("No valid tours to save to database (missing email/pinHash or userId)");
      return { data: null, error: null };
    }

    // First, save the basic tour information
    const { data: toursData, error: toursError } = await supabase.from("tours").upsert(
      validTours.map((tour) => ({
        id: tour.id,
        name: tour.name,
        base_currency_code: tour.baseCurrencyCode,
        email: tour.email,
        security_question_id: tour.securityQuestionId || null,
        security_answer: tour.securityAnswer || null,
        pin_hash: tour.pinHash || null,
        user_id: tour.userId || null,
        created_at: tour.createdAt,
        updated_at: tour.updatedAt,
      }))
    );

    if (toursError) throw toursError;

    // Save each tour's details separately
    for (const tour of validTours) {
      await saveTour(tour);
    }

    // Save planning tasks
    if (state.planningTasks && state.planningTasks.length > 0) {
      const now = new Date().toISOString();

      for (const task of state.planningTasks) {
        // Prepare task data
        const taskData = {
          id: task.id,
          tour_id: task.tourId,
          title: task.title,
          date: task.date,
          priority: task.priority,
          location: task.location || null,
          cost: task.cost !== undefined ? task.cost : null,
          currency_code: task.currencyCode || null,
          travelers: task.travelers || [],
          assigned_to: task.assignedTo || [],
          completed: task.completed || false,
          created_at: now,
          updated_at: now,
        };

        console.log("Saving planning task:", taskData);

        // Upsert the task
        const { error: upsertError } = await supabase.from("planning_tasks").upsert(taskData);

        if (upsertError) {
          console.error("Error upserting planning task:", upsertError, taskData);
          throw upsertError;
        }
      }
    }

    return { data: toursData, error: null };
  } catch (error) {
    console.error("Error saving app state:", error);
    return { data: null, error };
  }
};

// Load app state from Supabase
export const loadAppState = async (initialState: AppState): Promise<AppState> => {
  try {
    console.log("Loading app state from Supabase...");

    // Load tours
    const { data: toursData, error: toursError } = await supabase.from("tours").select("*");
    if (toursError) throw toursError;

    console.log("Loaded tours:", toursData);

    // Load planning tasks
    const { data: tasksData, error: tasksError } = await supabase.from("planning_tasks").select("*");
    if (tasksError) {
      console.error("Error loading planning tasks:", tasksError);
      throw tasksError;
    }

    console.log("Loaded planning tasks from database:", tasksData);

    // Process planning tasks
    const planningTasks = tasksData.map((task: any) => {
      // Handle travelers and assignedTo which could be arrays or strings
      let travelers: string[] = [];
      let assignedTo: string[] = [];

      // Handle travelers field
      if (task.travelers) {
        if (Array.isArray(task.travelers)) {
          travelers = task.travelers;
        } else if (typeof task.travelers === "string") {
          try {
            travelers = JSON.parse(task.travelers);
          } catch (e) {
            console.error("Error parsing travelers:", e);
          }
        }
      }

      // Handle assigned_to field
      if (task.assigned_to) {
        if (Array.isArray(task.assigned_to)) {
          assignedTo = task.assigned_to;
        } else if (typeof task.assigned_to === "string") {
          try {
            assignedTo = JSON.parse(task.assigned_to);
          } catch (e) {
            console.error("Error parsing assignedTo:", e);
          }
        }
      }

      const planningTask: PlanningTask = {
        id: task.id,
        tourId: task.tour_id,
        title: task.title,
        cost: typeof task.cost === "number" ? task.cost : 0,
        currencyCode: task.currency_code || "",
        location: task.location || "",
        date: task.date,
        priority: task.priority,
        travelers: travelers,
        assignedTo: assignedTo,
        completed: task.completed || false,
      };

      console.log("Processed planning task:", planningTask);
      return planningTask;
    });

    console.log("All processed planning tasks:", planningTasks);

    // Initialize tours with basic data
    const toursPromises = toursData.map(async (tourData: any) => {
      try {
        // Load travelers for this tour
        const { data: travelers, error: travelersError } = await supabase.from("travelers").select("*").eq("tour_id", tourData.id);
        if (travelersError) throw travelersError;

        // Load currencies for this tour
        const { data: currencies, error: currenciesError } = await supabase.from("currencies").select("*").eq("tour_id", tourData.id);
        if (currenciesError) throw currenciesError;

        // Load expenses for this tour
        const { data: expenses, error: expensesError } = await supabase.from("expenses").select("*").eq("tour_id", tourData.id);
        if (expensesError) throw expensesError;

        // Load expense splits for each expense
        const expensesWithSplits = await Promise.all(
          expenses.map(async (expense: any) => {
            const { data: splits, error: splitsError } = await supabase.from("expense_splits").select("*").eq("expense_id", expense.id);
            if (splitsError) throw splitsError;

            return {
              id: expense.id,
              date: expense.date,
              amount: expense.amount,
              currencyCode: expense.currency_code,
              baseAmount: expense.base_amount,
              baseCurrencyCode: expense.base_currency_code,
              description: expense.description,
              paidById: expense.paid_by_id,
              splits: splits.map((split: any) => ({
                travelerId: split.traveler_id,
                amount: split.amount,
                baseAmount: split.base_amount,
                percentage: 0, // Calculate this later
              })),
              categoryId: expense.category_id,
              createdAt: expense.created_at,
            };
          })
        );

        // Load payments for this tour
        const { data: payments, error: paymentsError } = await supabase.from("payments").select("*").eq("tour_id", tourData.id);
        if (paymentsError) throw paymentsError;

        // Create the tour object
        return {
          id: tourData.id,
          name: tourData.name,
          baseCurrencyCode: tourData.base_currency_code,
          email: tourData.email,
          securityQuestionId: tourData.security_question_id,
          securityAnswer: tourData.security_answer,
          pinHash: tourData.pin_hash,
          userId: tourData.user_id,
          travelers: travelers.map((traveler: any) => ({
            id: traveler.id,
            name: traveler.name,
          })),
          currencies: currencies.map((currency: any) => ({
            code: currency.code,
            name: currency.name,
            exchangeRate: currency.exchange_rate,
          })),
          expenses: expensesWithSplits,
          payments: payments.map((payment: any) => ({
            id: payment.id,
            fromTravelerId: payment.from_traveler_id,
            toTravelerId: payment.to_traveler_id,
            amount: payment.amount,
            currencyCode: payment.currency_code,
            date: payment.date,
            description: payment.description || "",
            createdAt: payment.created_at,
          })),
          planningTasks: [],
          createdAt: tourData.created_at,
          updatedAt: tourData.updated_at,
        };
      } catch (error) {
        console.error(`Error processing tour ${tourData.id}:`, error);
        return null;
      }
    });

    // Wait for all tour data to be loaded
    const toursResults = await Promise.all(toursPromises);

    // Filter out any null tours (from errors)
    const validTours = toursResults.filter(Boolean) as Tour[];

    // Create a new state object with the loaded data
    const result: AppState = {
      tours: validTours,
      activeTourId: initialState.activeTourId,
      expenseCategories: initialState.expenseCategories,
      planningTasks: planningTasks,
    };

    console.log("Loaded app state:", result);
    return result;
  } catch (error) {
    console.error("Error loading app state:", error);
    return initialState;
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
            // Cast to extended interface
            const extendedExpense = expense as unknown as ExtendedExpense;

            const expenseData = {
              id: expense.id,
              tour_id: tour.id,
              description: expense.description,
              amount: expense.amount,
              currency_code: expense.currencyCode,
              base_amount: extendedExpense.baseAmount || expense.amount,
              base_currency_code: extendedExpense.baseCurrencyCode || tour.baseCurrencyCode,
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
                try {
                  // First delete all splits for this expense
                  const { error: deleteSplitsError } = await supabase.from("expense_splits").delete().eq("expense_id", expense.id);

                  if (deleteSplitsError) {
                    console.error("Error deleting expense splits:", deleteSplitsError);
                  } else {
                    // Then insert all current splits
                    const splitsToInsert = expense.splits.map((split) => {
                      // Cast to extended interface
                      const extendedSplit = split as unknown as ExtendedExpenseSplit;

                      return {
                        expense_id: expense.id,
                        traveler_id: split.travelerId,
                        amount: split.amount,
                        base_amount: extendedSplit.baseAmount || split.amount,
                      };
                    });

                    // Insert splits one by one to avoid conflicts
                    for (const split of splitsToInsert) {
                      try {
                        const { error: insertSplitError } = await supabase.from("expense_splits").insert(split);
                        if (insertSplitError && insertSplitError.code !== "23505") {
                          // Ignore duplicate key errors
                          console.error("Error inserting expense split:", insertSplitError, split);
                        }
                      } catch (error) {
                        // Ignore errors and continue with the next split
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error handling expense splits:", error);
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
