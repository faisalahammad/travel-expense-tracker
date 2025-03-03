import { createClient } from "@supabase/supabase-js";
import { AppState, Tour, User } from "../types";

// Define UserProfile interface locally
interface UserProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save app state to Supabase
export const saveAppState = async (state: AppState): Promise<void> => {
  if (!state.currentUser) {
    console.log("No user logged in, skipping state save");
    return;
  }

  try {
    // Save each tour individually
    for (const tour of state.tours) {
      await saveTour(tour);
    }
  } catch (error) {
    console.error("Error saving app state:", error);
  }
};

// Load app state from Supabase
export const loadAppState = async (initialState: AppState): Promise<AppState> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return initialState;
    }

    const userId = session.session.user.id;

    // Load user profile
    const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("userId", userId).single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error loading user profile:", profileError);
    }

    let currentUser: User | null = null;

    if (profileData) {
      currentUser = {
        id: userId,
        email: session.session.user.email || "",
        name: profileData.name,
        avatarUrl: profileData.avatarUrl,
      };
    } else if (session.session.user.email) {
      // Create a basic user if profile doesn't exist
      currentUser = {
        id: userId,
        email: session.session.user.email,
        name: session.session.user.email.split("@")[0], // Use part of email as name
        avatarUrl: undefined,
      };
    }

    // Load tours
    const { data: tours, error: toursError } = await supabase.from("tours").select("*").or(`createdById.eq.${userId},members.cs.{${userId}}`);

    if (toursError) {
      console.error("Error loading tours:", toursError);
      return {
        ...initialState,
        currentUser,
      };
    }

    return {
      ...initialState,
      tours: (tours as Tour[]) || [],
      activeTourId: tours && tours.length > 0 ? tours[0].id : null,
      currentUser,
    };
  } catch (error) {
    console.error("Error loading app state:", error);
    return initialState;
  }
};

// Save a tour to Supabase
export const saveTour = async (tour: Tour): Promise<void> => {
  try {
    // Check if tour exists
    const { data: existingTour, error: checkError } = await supabase.from("tours").select("id").eq("id", tour.id).single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking tour existence:", checkError);
      return;
    }

    if (existingTour) {
      // Update existing tour
      const { error: updateError } = await supabase.from("tours").update(tour).eq("id", tour.id);

      if (updateError) {
        console.error("Error updating tour:", updateError);
      }
    } else {
      // Insert new tour
      const { error: insertError } = await supabase.from("tours").insert(tour);

      if (insertError) {
        console.error("Error inserting tour:", insertError);
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

// Create or update user profile
export const upsertUserProfile = async (profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">): Promise<UserProfile | null> => {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase.from("profiles").select("*").eq("userId", profile.userId).single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking profile existence:", checkError);
      return null;
    }

    const now = new Date().toISOString();

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = {
        ...profile,
        updatedAt: now,
      };

      const { data, error: updateError } = await supabase.from("profiles").update(updatedProfile).eq("id", existingProfile.id).select().single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return null;
      }

      return data as UserProfile;
    } else {
      // Insert new profile
      const newProfile = {
        ...profile,
        createdAt: now,
        updatedAt: now,
      };

      const { data, error: insertError } = await supabase.from("profiles").insert(newProfile).select().single();

      if (insertError) {
        console.error("Error inserting profile:", insertError);
        return null;
      }

      return data as UserProfile;
    }
  } catch (error) {
    console.error("Error upserting profile:", error);
    return null;
  }
};

// Get user profile by user ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("userId", userId).single();

    if (error) {
      if (error.code !== "PGRST116") {
        // Not found error
        console.error("Error getting user profile:", error);
      }
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};
