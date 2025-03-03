import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { supabase, upsertUserProfile } from "../../utils/supabase";

interface AuthFormProps {
  onAuthSuccess: (userId: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (authMode === "signup") {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create user profile
          await upsertUserProfile({
            userId: data.user.id,
            name: name || email.split("@")[0],
          });

          setSuccess("Registration successful! Please check your email for verification.");
          onAuthSuccess(data.user.id);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setSuccess("Login successful!");
          onAuthSuccess(data.user.id);
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during authentication");
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Travel Expense Tracker
        </Typography>

        <Tabs value={authMode} onChange={(_, newValue) => setAuthMode(newValue)} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab label="Login" value="login" />
          <Tab label="Sign Up" value="signup" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleAuth} noValidate>
          {authMode === "signup" && <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} sx={{ mb: 2 }} />}

          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} sx={{ mb: 2 }} />

          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} sx={{ mb: 3 }} />

          <Button type="submit" fullWidth variant="contained" disabled={isLoading} sx={{ py: 1.5 }}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : authMode === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthForm;
