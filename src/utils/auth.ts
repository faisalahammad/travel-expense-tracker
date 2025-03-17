import CryptoJS from "crypto-js";
import { LoginCredentials, ResetPinData, Tour } from "../types";
import { supabase } from "./supabase";

// Constants
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Hash a pin using SHA-256
 */
export const hashPin = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};

/**
 * Verify if a pin matches the stored hash
 */
export const verifyPin = (pin: string, storedHash: string): boolean => {
  const hashedPin = hashPin(pin);
  return hashedPin === storedHash;
};

/**
 * Record a login attempt
 */
export const recordLoginAttempt = async (email: string, successful: boolean): Promise<void> => {
  try {
    await supabase.from("auth_attempts").insert({
      email,
      successful,
      attempt_time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error recording login attempt:", error);
  }
};

/**
 * Check if a user is locked out due to too many failed login attempts
 */
export const isUserLockedOut = async (email: string): Promise<boolean> => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

    // Get recent failed attempts
    const { data, error } = await supabase.from("auth_attempts").select("*").eq("email", email).eq("successful", false).gte("attempt_time", windowStart.toISOString());

    if (error) {
      console.error("Error checking login attempts:", error);
      return false;
    }

    // If there are MAX_LOGIN_ATTEMPTS or more failed attempts, check if the user is still locked out
    if (data && data.length >= MAX_LOGIN_ATTEMPTS) {
      const mostRecentAttempt = new Date(Math.max(...data.map((attempt) => new Date(attempt.attempt_time).getTime())));
      const lockoutEnds = new Date(mostRecentAttempt.getTime() + LOCKOUT_DURATION_MS);

      if (now < lockoutEnds) {
        // User is still locked out
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking if user is locked out:", error);
    return false;
  }
};

/**
 * Get the remaining lockout time in milliseconds
 */
export const getRemainingLockoutTime = async (email: string): Promise<number> => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

    // Get recent failed attempts
    const { data, error } = await supabase.from("auth_attempts").select("*").eq("email", email).eq("successful", false).gte("attempt_time", windowStart.toISOString());

    if (error || !data || data.length < MAX_LOGIN_ATTEMPTS) {
      return 0;
    }

    const mostRecentAttempt = new Date(Math.max(...data.map((attempt) => new Date(attempt.attempt_time).getTime())));
    const lockoutEnds = new Date(mostRecentAttempt.getTime() + LOCKOUT_DURATION_MS);

    if (now < lockoutEnds) {
      return lockoutEnds.getTime() - now.getTime();
    }

    return 0;
  } catch (error) {
    console.error("Error getting remaining lockout time:", error);
    return 0;
  }
};

/**
 * Login a user with email and pin
 */
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; tour?: Tour; message?: string }> => {
  try {
    const { email, pin } = credentials;

    // Check if user is locked out
    const lockedOut = await isUserLockedOut(email);
    if (lockedOut) {
      const remainingTime = await getRemainingLockoutTime(email);
      const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
      return {
        success: false,
        message: `Too many failed login attempts. Please try again in ${remainingMinutes} minutes.`,
      };
    }

    // Get the user by email
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single();

    if (userError || !userData) {
      await recordLoginAttempt(email, false);
      return { success: false, message: "Invalid email or PIN." };
    }

    // Verify the pin
    const pinHash = userData.pin_hash;
    if (!verifyPin(pin, pinHash)) {
      await recordLoginAttempt(email, false);
      return { success: false, message: "Invalid email or PIN." };
    }

    // Record successful login
    await recordLoginAttempt(email, true);

    // Get the user's tours
    const { data: toursData, error: toursError } = await supabase.from("tours").select("*").eq("user_id", userData.id);

    if (toursError) {
      console.error("Error fetching user's tours:", toursError);
      // Continue with login even if we can't fetch tours
    }

    // Use the first tour or create a placeholder
    const tour =
      toursData && toursData.length > 0
        ? toursData[0]
        : {
            id: userData.id, // Use user ID as a placeholder
            name: "My Tour",
            base_currency_code: "USD",
            email: userData.email,
            security_question_id: userData.security_question_id,
            security_answer: userData.security_answer,
            pin_hash: userData.pin_hash,
            user_id: userData.id,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
          };

    // Return the tour
    return {
      success: true,
      tour: {
        id: tour.id,
        name: tour.name,
        baseCurrencyCode: tour.base_currency_code,
        email: tour.email,
        securityQuestionId: tour.security_question_id,
        securityAnswer: tour.security_answer,
        pinHash: tour.pin_hash,
        userId: tour.user_id,
        travelers: [],
        currencies: [],
        expenses: [],
        payments: [],
        planningTasks: [],
        createdAt: tour.created_at,
        updatedAt: tour.updated_at,
      },
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, message: "An error occurred during login." };
  }
};

/**
 * Reset a user's PIN using security question
 */
export const resetPin = async (resetData: ResetPinData): Promise<{ success: boolean; message: string }> => {
  try {
    const { email, securityQuestionId, securityAnswer, newPin } = resetData;

    // Get the user by email
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

    if (error || !data) {
      return { success: false, message: "Email not found." };
    }

    // Verify security question and answer
    if (data.security_question_id !== securityQuestionId || data.security_answer.toLowerCase() !== securityAnswer.toLowerCase()) {
      return { success: false, message: "Security answer is incorrect." };
    }

    // Update the pin
    const newPinHash = hashPin(newPin);
    const { error: updateError } = await supabase.from("users").update({ pin_hash: newPinHash }).eq("id", data.id);

    if (updateError) {
      return { success: false, message: "Failed to update PIN." };
    }

    // Also update any tours associated with this user
    const { error: updateToursError } = await supabase.from("tours").update({ pin_hash: newPinHash }).eq("user_id", data.id);

    if (updateToursError) {
      console.error("Error updating tours PIN:", updateToursError);
      // We don't return an error here as the user PIN was successfully updated
    }

    return { success: true, message: "PIN has been reset successfully." };
  } catch (error) {
    console.error("Error resetting PIN:", error);
    return { success: false, message: "An error occurred while resetting PIN." };
  }
};

/**
 * Get all security questions
 */
export const getSecurityQuestions = async (): Promise<{ id: number; question: string }[]> => {
  try {
    const { data, error } = await supabase.from("security_questions").select("*");

    if (error || !data || data.length === 0) {
      console.error("Error fetching security questions or no questions found:", error);
      // Fallback to predefined security questions
      return [
        { id: 1, question: "What was the name of your first pet?" },
        { id: 2, question: "In which city were you born?" },
        { id: 3, question: "What was your childhood nickname?" },
        { id: 4, question: "What is the name of your favorite childhood teacher?" },
        { id: 5, question: "What is your mother's maiden name?" },
      ];
    }

    return data.map((q) => ({ id: q.id, question: q.question }));
  } catch (error) {
    console.error("Error fetching security questions:", error);
    // Fallback to predefined security questions
    return [
      { id: 1, question: "What was the name of your first pet?" },
      { id: 2, question: "In which city were you born?" },
      { id: 3, question: "What was your childhood nickname?" },
      { id: 4, question: "What is the name of your favorite childhood teacher?" },
      { id: 5, question: "What is your mother's maiden name?" },
    ];
  }
};

/**
 * Check if an email is already registered
 */
export const isEmailRegistered = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("email", email);

    if (error) {
      console.error("Error checking email:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

/**
 * Validate PIN format (alphanumeric, 4-6 characters)
 */
export const isValidPin = (pin: string): boolean => {
  const pinRegex = /^[a-zA-Z0-9]{4,6}$/;
  return pinRegex.test(pin);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if an email is already registered in the users table
 */
export const isEmailRegisteredInUsers = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("email", email);

    if (error) {
      console.error("Error checking email in users table:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking email in users table:", error);
    return false;
  }
};

/**
 * Create a new user
 */
export const createUser = async (email: string, pin: string, securityQuestionId: number, securityAnswer: string): Promise<{ success: boolean; userId?: string; message?: string }> => {
  try {
    // Check if email is already registered
    const emailExists = await isEmailRegisteredInUsers(email);
    if (emailExists) {
      return { success: false, message: "This email is already registered." };
    }

    // Hash the PIN
    const pinHash = hashPin(pin);

    // Insert the new user
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        pin_hash: pinHash,
        security_question_id: securityQuestionId,
        security_answer: securityAnswer,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return { success: false, message: "Failed to create user." };
    }

    return { success: true, userId: data.id };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "An error occurred while creating user." };
  }
};
