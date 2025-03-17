import CryptoJS from "crypto-js";
import { LoginCredentials, LoginResult, ResetPinData } from "../types";
import { supabase } from "./supabase";

// Constants
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

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
export const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
  try {
    // Get user by email
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", credentials.email).single();

    if (userError || !user) {
      return { success: false, message: "Invalid email or PIN" };
    }

    // Verify PIN
    const pinHash = hashPin(credentials.pin);
    if (pinHash !== user.pin_hash) {
      return { success: false, message: "Invalid email or PIN" };
    }

    return {
      success: true,
      message: "Login successful",
      userId: user.id,
    };
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

/**
 * Reset a user's PIN using security question
 */
export const resetPin = async (resetData: ResetPinData): Promise<LoginResult> => {
  try {
    const { email, securityQuestionId, securityAnswer, newPin } = resetData;

    // Get user by email
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).single();

    if (userError || !user) {
      return { success: false, message: "Email not found" };
    }

    // Verify security question and answer
    if (user.security_question_id !== securityQuestionId) {
      return { success: false, message: "Security question is incorrect" };
    }

    // Verify security answer - handle both hashed and plain text versions
    const securityAnswerHash = hashPin(securityAnswer);
    let answerIsCorrect = false;

    // Check hashed version if it exists
    if (user.security_answer_hash) {
      answerIsCorrect = securityAnswerHash === user.security_answer_hash;
    }
    // Check plain text version if it exists
    else if (user.security_answer) {
      answerIsCorrect = securityAnswer === user.security_answer;
    }

    if (!answerIsCorrect) {
      return { success: false, message: "Security answer is incorrect" };
    }

    // Validate and hash new PIN
    if (!isValidPin(newPin)) {
      return { success: false, message: "Invalid PIN format" };
    }
    const newPinHash = hashPin(newPin);

    // Update user's PIN
    const { error: updateError } = await supabase.from("users").update({ pin_hash: newPinHash }).eq("id", user.id);

    if (updateError) {
      console.error("Error updating PIN:", updateError);
      return { success: false, message: "Failed to update PIN" };
    }

    return {
      success: true,
      message: "PIN reset successfully",
      userId: user.id,
    };
  } catch (error) {
    console.error("Error resetting PIN:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};

/**
 * Get all security questions
 */
export const getSecurityQuestions = async () => {
  try {
    const { data, error } = await supabase.from("security_questions").select("*").order("id");

    if (error) {
      console.error("Error fetching security questions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching security questions:", error);
    return [];
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
 * Create a new user account
 */
export const createUser = async (email: string, pin: string, securityQuestionId: number, securityAnswer: string): Promise<LoginResult> => {
  try {
    // Check if email is already registered
    const emailExists = await isEmailRegisteredInUsers(email);
    if (emailExists) {
      return { success: false, message: "This email is already registered" };
    }

    // Hash the PIN
    const pinHash = hashPin(pin);

    // Create user with just the essential fields
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        pin_hash: pinHash,
        security_question_id: securityQuestionId,
        security_answer: securityAnswer, // Use plain text answer
      })
      .select("id");

    if (userError) {
      console.error("Error creating user:", userError);
      return { success: false, message: "Failed to create user account" };
    }

    if (!userData || userData.length === 0) {
      console.error("No user data returned after creation");
      return { success: false, message: "Failed to create user account" };
    }

    return {
      success: true,
      message: "Account created successfully",
      userId: userData[0].id,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
};
