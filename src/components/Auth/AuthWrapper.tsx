import { Box, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { User } from "../../types";
import { getUserProfile, supabase, upsertUserProfile } from "../../utils/supabase";
import AuthForm from "./AuthForm";

interface AuthWrapperProps {
  children: React.ReactNode;
  onUserChange: (user: User | null) => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, onUserChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id, data.session.user.email || "");
        } else {
          setUser(null);
          onUserChange(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
        onUserChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
        onUserChange(null);
      }
    });

    checkSession();

    // Clean up subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [onUserChange]);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      // Get user profile from database
      const profile = await getUserProfile(userId);

      if (profile) {
        // User profile exists
        const userData: User = {
          id: userId,
          email: email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        };

        setUser(userData);
        onUserChange(userData);
      } else {
        // Create new profile with default values
        const defaultName = email.split("@")[0];

        await upsertUserProfile({
          userId: userId,
          name: defaultName,
        });

        const userData: User = {
          id: userId,
          email: email,
          name: defaultName,
        };

        setUser(userData);
        onUserChange(userData);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
      onUserChange(null);
    }
  };

  const handleAuthSuccess = async (userId: string) => {
    // Auth was successful, session will be picked up by the listener
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return <>{children}</>;
};

export default AuthWrapper;
