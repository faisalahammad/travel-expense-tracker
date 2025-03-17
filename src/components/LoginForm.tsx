import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LoginCredentials } from "../types";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPin?: () => void;
  onCreateTour?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPin, onCreateTour }) => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(credentials);

      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.message || "Login failed. Please check your email and PIN.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Login to Your Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={credentials.email} onChange={handleChange} disabled={loading} />

          <TextField
            margin="normal"
            required
            fullWidth
            name="pin"
            label="PIN"
            type={showPin ? "text" : "password"}
            id="pin"
            autoComplete="current-password"
            value={credentials.pin}
            onChange={handleChange}
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

          <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button color="primary" onClick={onForgotPin} disabled={loading}>
              Forgot PIN?
            </Button>

            <Button color="secondary" onClick={onCreateTour} disabled={loading}>
              Create New Tour
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
