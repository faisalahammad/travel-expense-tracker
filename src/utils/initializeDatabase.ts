import { supabase } from "./supabase";

/**
 * Initialize the database tables needed for the app
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log("Initializing database...");

    // First, check if we can connect to Supabase at all
    const { data: healthCheck, error: healthError } = await supabase.from("expense_categories").select("id").limit(1);

    if (healthError) {
      console.error("Error connecting to Supabase:", healthError.message);

      // Check if this is a permissions error (likely RLS related)
      if (healthError.code === "42501" || healthError.message.includes("permission denied")) {
        console.error("This appears to be a permissions error. Please check that RLS policies are correctly set up.");
        return false;
      }

      // Check if this is a relation not found error
      if (healthError.code === "42P01" || (healthError.message.includes("relation") && healthError.message.includes("does not exist"))) {
        console.error("Database tables don't exist. Please run the SQL setup script in Supabase.");
        return false;
      }

      return false;
    }

    // If we got here, we can connect to at least one table
    console.log("Successfully connected to Supabase");

    // Now check if we have the expense categories (which should be pre-populated)
    const { data: categories, error: categoriesError } = await supabase.from("expense_categories").select("*");

    if (categoriesError) {
      console.error("Error fetching expense categories:", categoriesError.message);
      return false;
    }

    if (categories && categories.length > 0) {
      console.log(`Found ${categories.length} expense categories`);
      return true;
    } else {
      console.warn("No expense categories found. Database might not be properly set up.");
      return false;
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
};
