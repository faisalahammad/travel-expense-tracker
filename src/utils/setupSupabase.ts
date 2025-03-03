import { supabase } from "./supabase";

// Function to create all necessary tables in Supabase
export const setupSupabaseTables = async (): Promise<void> => {
  try {
    console.log("Setting up Supabase tables...");

    // Create tables using REST API
    // This approach doesn't require SQL privileges

    // Check if app_state table exists
    const { count: appStateCount, error: appStateCheckError } = await supabase.from("app_state").select("*", { count: "exact", head: true });

    if (appStateCheckError) {
      console.log("Creating app_state table via Supabase dashboard...");
      console.error("Please create the app_state table in the Supabase dashboard with the following structure:");
      console.error("- id: integer (primary key)");
      console.error("- active_tour_id: text");
    } else {
      console.log("app_state table exists with", appStateCount, "rows");
    }

    // Check if tours table exists
    const { count: toursCount, error: toursCheckError } = await supabase.from("tours").select("*", { count: "exact", head: true });

    if (toursCheckError) {
      console.log("Creating tours table via Supabase dashboard...");
      console.error("Please create the tours table in the Supabase dashboard with the following structure:");
      console.error("- id: text (primary key)");
      console.error("- name: text (not null)");
      console.error("- base_currency_code: text (not null)");
      console.error("- created_at: timestamp with time zone (default: now())");
      console.error("- updated_at: timestamp with time zone (default: now())");
    } else {
      console.log("tours table exists with", toursCount, "rows");
    }

    // Check if travelers table exists
    const { count: travelersCount, error: travelersCheckError } = await supabase.from("travelers").select("*", { count: "exact", head: true });

    if (travelersCheckError) {
      console.log("Creating travelers table via Supabase dashboard...");
      console.error("Please create the travelers table in the Supabase dashboard with the following structure:");
      console.error("- id: text (primary key)");
      console.error("- tour_id: text (not null, references tours.id on delete cascade)");
      console.error("- name: text (not null)");
    } else {
      console.log("travelers table exists with", travelersCount, "rows");
    }

    // Check if currencies table exists
    const { count: currenciesCount, error: currenciesCheckError } = await supabase.from("currencies").select("*", { count: "exact", head: true });

    if (currenciesCheckError) {
      console.log("Creating currencies table via Supabase dashboard...");
      console.error("Please create the currencies table in the Supabase dashboard with the following structure:");
      console.error("- code: text (part of primary key)");
      console.error("- tour_id: text (part of primary key, references tours.id on delete cascade)");
      console.error("- name: text (not null)");
      console.error("- exchange_rate: numeric (not null)");
      console.error("- Primary key: (code, tour_id)");
    } else {
      console.log("currencies table exists with", currenciesCount, "rows");
    }

    // Check if expenses table exists
    const { count: expensesCount, error: expensesCheckError } = await supabase.from("expenses").select("*", { count: "exact", head: true });

    if (expensesCheckError) {
      console.log("Creating expenses table via Supabase dashboard...");
      console.error("Please create the expenses table in the Supabase dashboard with the following structure:");
      console.error("- id: text (primary key)");
      console.error("- tour_id: text (not null, references tours.id on delete cascade)");
      console.error("- date: text (not null)");
      console.error("- amount: numeric (not null)");
      console.error("- currency_code: text (not null)");
      console.error("- description: text (not null)");
      console.error("- paid_by_id: text (not null)");
    } else {
      console.log("expenses table exists with", expensesCount, "rows");
    }

    // Check if expense_splits table exists
    const { count: splitsCount, error: splitsCheckError } = await supabase.from("expense_splits").select("*", { count: "exact", head: true });

    if (splitsCheckError) {
      console.log("Creating expense_splits table via Supabase dashboard...");
      console.error("Please create the expense_splits table in the Supabase dashboard with the following structure:");
      console.error("- expense_id: text (part of primary key, references expenses.id on delete cascade)");
      console.error("- traveler_id: text (part of primary key)");
      console.error("- amount: numeric (not null)");
      console.error("- percentage: numeric (not null)");
      console.error("- Primary key: (expense_id, traveler_id)");
    } else {
      console.log("expense_splits table exists with", splitsCount, "rows");
    }

    // Check if payments table exists
    const { count: paymentsCount, error: paymentsCheckError } = await supabase.from("payments").select("*", { count: "exact", head: true });

    if (paymentsCheckError) {
      console.log("Creating payments table via Supabase dashboard...");
      console.error("Please create the payments table in the Supabase dashboard with the following structure:");
      console.error("- id: text (primary key)");
      console.error("- tour_id: text (not null, references tours.id on delete cascade)");
      console.error("- date: text (not null)");
      console.error("- from_traveler_id: text (not null)");
      console.error("- to_traveler_id: text (not null)");
      console.error("- amount: numeric (not null)");
      console.error("- currency_code: text (not null)");
      console.error("- method: text");
      console.error("- notes: text");
    } else {
      console.log("payments table exists with", paymentsCount, "rows");
    }

    console.log("Supabase tables setup check complete!");
  } catch (error) {
    console.error("Error setting up Supabase tables:", error);
  }
};
