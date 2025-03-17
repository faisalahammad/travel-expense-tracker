import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, ChangePinData, ChangeSecurityQuestionData, DeleteAccountData, LoginResult, ResetPinData } from "../types";
import { login as authLogin, getSecurityQuestions, hashPin, isEmailRegistered, isValidEmail, isValidPin, resetPin, verifyPin } from "../utils/auth";
import { supabase } from "../utils/supabase";

// Session expiration time in milliseconds (30 days)
const SESSION_EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000;

interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; pin: string }) => Promise<LoginResult>;
  logout: () => void;
  resetPin: (resetData: ResetPinData) => Promise<LoginResult>;
  changePin: (changePinData: ChangePinData) => Promise<{ success: boolean; message: string }>;
  changeSecurityQuestion: (changeData: ChangeSecurityQuestionData) => Promise<{ success: boolean; message: string }>;
  deleteAccount: (deleteData: DeleteAccountData) => Promise<{ success: boolean; message: string }>;
  isEmailRegistered: (email: string) => Promise<boolean>;
  getSecurityQuestions: () => Promise<any[]>;
  isValidPin: (pin: string) => boolean;
  isValidEmail: (email: string) => boolean;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  currentTourId: null,
  email: null,
  userId: null,
  lastLoginTime: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if the session is expired
  const isSessionExpired = (lastLoginTime: string): boolean => {
    if (!lastLoginTime) return true;

    const loginTime = new Date(lastLoginTime).getTime();
    const currentTime = new Date().getTime();
    return currentTime - loginTime > SESSION_EXPIRATION_TIME;
  };

  useEffect(() => {
    // Load auth state from localStorage on mount
    const loadAuthState = () => {
      const savedAuthState = localStorage.getItem("authState");
      if (savedAuthState) {
        try {
          const parsedState = JSON.parse(savedAuthState) as AuthState;

          // Check if the session is expired
          if (parsedState.lastLoginTime && !isSessionExpired(parsedState.lastLoginTime)) {
            setAuthState(parsedState);
          } else {
            // Session expired, clear localStorage
            localStorage.removeItem("authState");
            setAuthState(initialAuthState);
          }
        } catch (error) {
          console.error("Error parsing saved auth state:", error);
          localStorage.removeItem("authState");
        }
      }
      setIsInitialized(true);
    };

    loadAuthState();
  }, []);

  useEffect(() => {
    // Save auth state to localStorage whenever it changes
    if (isInitialized) {
      if (authState.isAuthenticated) {
        localStorage.setItem("authState", JSON.stringify(authState));
      } else {
        localStorage.removeItem("authState");
      }
    }
  }, [authState, isInitialized]);

  const login = async (credentials: { email: string; pin: string }): Promise<LoginResult> => {
    try {
      const result = await authLogin(credentials);
      if (result.success) {
        // Get the user's current tour ID
        const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", credentials.email).single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        }

        const newAuthState: AuthState = {
          isAuthenticated: true,
          email: credentials.email,
          lastLoginTime: new Date().toISOString(),
          userId: result.userId,
          currentTourId: result.tourId || null,
        };

        setAuthState(newAuthState);
        localStorage.setItem("authState", JSON.stringify(newAuthState));
      }
      return result;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  };

  // Handle logout
  const handleLogout = () => {
    setAuthState(initialAuthState);
    localStorage.removeItem("authState");
  };

  // Handle PIN reset
  const handleResetPin = async (resetData: ResetPinData): Promise<LoginResult> => {
    try {
      return await resetPin(resetData);
    } catch (error) {
      console.error("Error resetting PIN:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  };

  // Handle PIN change
  const handleChangePin = async (changePinData: ChangePinData): Promise<{ success: boolean; message: string }> => {
    try {
      const { currentPin, newPin } = changePinData;

      if (!authState.currentTourId || !authState.isAuthenticated) {
        return { success: false, message: "You must be logged in to change your PIN." };
      }

      // Validate new PIN
      if (!isValidPin(newPin)) {
        return { success: false, message: "New PIN must be 4-6 alphanumeric characters." };
      }

      // Get the current tour
      const { data, error } = await supabase.from("tours").select("pin_hash").eq("id", authState.currentTourId).single();

      if (error || !data) {
        return { success: false, message: "Failed to verify current PIN." };
      }

      // Verify current PIN
      if (!verifyPin(currentPin, data.pin_hash)) {
        return { success: false, message: "Current PIN is incorrect." };
      }

      // Update PIN
      const newPinHash = hashPin(newPin);
      const { error: updateError } = await supabase.from("tours").update({ pin_hash: newPinHash }).eq("id", authState.currentTourId);

      if (updateError) {
        return { success: false, message: "Failed to update PIN." };
      }

      return { success: true, message: "PIN updated successfully." };
    } catch (error) {
      console.error("Error changing PIN:", error);
      return { success: false, message: "An error occurred while changing PIN." };
    }
  };

  // Handle security question change
  const handleChangeSecurityQuestion = async (changeData: ChangeSecurityQuestionData): Promise<{ success: boolean; message: string }> => {
    try {
      const { pin, securityQuestionId, securityAnswer } = changeData;

      if (!authState.currentTourId || !authState.isAuthenticated) {
        return { success: false, message: "You must be logged in to change your security question." };
      }

      // Get the current tour
      const { data, error } = await supabase.from("tours").select("pin_hash").eq("id", authState.currentTourId).single();

      if (error || !data) {
        return { success: false, message: "Failed to verify PIN." };
      }

      // Verify PIN
      if (!verifyPin(pin, data.pin_hash)) {
        return { success: false, message: "PIN is incorrect." };
      }

      // Update security question and answer
      const { error: updateError } = await supabase
        .from("tours")
        .update({
          security_question_id: securityQuestionId,
          security_answer: securityAnswer,
        })
        .eq("id", authState.currentTourId);

      if (updateError) {
        return { success: false, message: "Failed to update security question." };
      }

      return { success: true, message: "Security question updated successfully." };
    } catch (error) {
      console.error("Error changing security question:", error);
      return { success: false, message: "An error occurred while changing security question." };
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (deleteData: DeleteAccountData): Promise<{ success: boolean; message: string }> => {
    try {
      const { pin, securityAnswer } = deleteData;

      if (!authState.email || !authState.isAuthenticated) {
        return { success: false, message: "You must be logged in to delete your account." };
      }

      // Get the current user's data
      const { data: userData, error: userError } = await supabase.from("users").select("id, pin_hash, security_answer").eq("email", authState.email).single();

      if (userError || !userData) {
        return { success: false, message: "Failed to verify account information." };
      }

      // Verify PIN
      if (!verifyPin(pin, userData.pin_hash)) {
        return { success: false, message: "PIN is incorrect." };
      }

      // Verify security answer (case-insensitive comparison)
      if (userData.security_answer.toLowerCase() !== securityAnswer.toLowerCase()) {
        return { success: false, message: "Security answer is incorrect." };
      }

      // Delete the user (this will cascade delete all tours and related data)
      const { error: deleteError } = await supabase.from("users").delete().eq("id", userData.id);

      if (deleteError) {
        return { success: false, message: "Failed to delete account." };
      }

      // Log out the user
      handleLogout();

      return { success: true, message: "Your account has been successfully deleted." };
    } catch (error) {
      console.error("Error deleting account:", error);
      return { success: false, message: "An error occurred while deleting your account." };
    }
  };

  const contextValue: AuthContextType = {
    authState,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout: handleLogout,
    resetPin: handleResetPin,
    changePin: handleChangePin,
    changeSecurityQuestion: handleChangeSecurityQuestion,
    deleteAccount: handleDeleteAccount,
    isEmailRegistered,
    getSecurityQuestions,
    isValidPin,
    isValidEmail,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
