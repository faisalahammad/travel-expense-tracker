import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPin?: () => void;
  onRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPin, onRegister }) => {
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  // UI state
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({ email, pin });
      if (!result.success) {
        setError(result.message || "Invalid email or PIN");
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Login
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />

          <TextField
            margin="normal"
            required
            fullWidth
            name="pin"
            label="PIN"
            type={showPin ? "text" : "password"}
            id="pin"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="toggle pin visibility" onClick={handleToggleShowPin} edge="end">
                    {showPin ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button color="primary" onClick={onForgotPin} disabled={loading}>
              Forgot PIN?
            </Button>

            <Button color="primary" onClick={onRegister} disabled={loading}>
              Create an Account
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
