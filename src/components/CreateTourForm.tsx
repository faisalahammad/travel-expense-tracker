import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { SecurityQuestion } from "../types";
import { createUser } from "../utils/auth";
import { supabase } from "../utils/supabase";

interface CreateTourFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateTourForm: React.FC<CreateTourFormProps> = ({ onSuccess, onCancel }) => {
  const { createTour } = useAppContext();
  const { authState, isEmailRegistered, getSecurityQuestions, isValidPin, isValidEmail } = useAuth();
  const isAuthenticated = authState.isAuthenticated;

  // Form state
  const [tourName, setTourName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [email, setEmail] = useState(authState.email || "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [securityQuestionId, setSecurityQuestionId] = useState<number>(0);
  const [securityAnswer, setSecurityAnswer] = useState("");

  // UI state
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load security questions (only if not authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      const loadQuestions = async () => {
        setLoadingQuestions(true);
        try {
          const questions = await getSecurityQuestions();
          setSecurityQuestions(questions);
          if (questions.length > 0) {
            setSecurityQuestionId(questions[0].id);
          }
        } catch (error) {
          console.error("Error loading security questions:", error);
          setError("Failed to load security questions. Please try again.");

          // Set fallback questions directly in component as a last resort
          const fallbackQuestions = [
            { id: 1, question: "What was the name of your first pet?" },
            { id: 2, question: "In which city were you born?" },
            { id: 3, question: "What was your childhood nickname?" },
            { id: 4, question: "What is the name of your favorite childhood teacher?" },
            { id: 5, question: "What is your mother's maiden name?" },
          ];
          setSecurityQuestions(fallbackQuestions);
          setSecurityQuestionId(fallbackQuestions[0].id);
        } finally {
          setLoadingQuestions(false);
        }
      };

      loadQuestions();
    }
  }, [getSecurityQuestions, isAuthenticated]);

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  const handleSecurityQuestionChange = (e: SelectChangeEvent<number>) => {
    setSecurityQuestionId(e.target.value as number);
  };

  const validateForm = async (): Promise<boolean> => {
    // Validate tour name
    if (!tourName.trim()) {
      setError("Tour name is required");
      return false;
    }

    // Validate base currency
    if (!baseCurrency.trim()) {
      setError("Base currency is required");
      return false;
    }

    // For non-authenticated users, validate email and security questions
    if (!isAuthenticated) {
      // Validate email
      if (!email.trim()) {
        setError("Email is required");
        return false;
      }

      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return false;
      }

      // Check if email is already registered
      const emailExists = await isEmailRegistered(email);
      if (emailExists) {
        setError("This email is already registered. Please use a different email or reset your PIN.");
        return false;
      }

      // Validate PIN
      if (!pin.trim()) {
        setError("PIN is required");
        return false;
      }

      if (!isValidPin(pin)) {
        setError("PIN must be 4-6 alphanumeric characters");
        return false;
      }

      if (pin !== confirmPin) {
        setError("PINs do not match");
        return false;
      }

      // Validate security question
      if (securityQuestionId === 0) {
        setError("Please select a security question");
        return false;
      }

      // Validate security answer
      if (!securityAnswer.trim()) {
        setError("Security answer is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setLoading(false);
        return;
      }

      let userId: string | undefined;

      // For authenticated users, get their user ID
      if (isAuthenticated && authState.email) {
        // Get the user ID from the database
        const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", authState.email).single();

        if (userError || !userData) {
          setError("Failed to retrieve user information. Please try again.");
          setLoading(false);
          return;
        }

        userId = userData.id;
      } else {
        // For new users, create a user record first
        const userResult = await createUser(email, pin, securityQuestionId, securityAnswer);

        if (!userResult.success) {
          setError(userResult.message || "Failed to create user account.");
          setLoading(false);
          return;
        }

        userId = userResult.userId;
      }

      // Create the tour with user ID
      const newTour = await createTour(tourName, baseCurrency.toUpperCase(), {
        userId,
        email: isAuthenticated && authState.email ? authState.email : email,
        securityQuestionId: isAuthenticated ? undefined : securityQuestionId,
        securityAnswer: isAuthenticated ? undefined : securityAnswer,
        pinHash: isAuthenticated ? undefined : pin, // Note: This will be hashed in the createTour function
      });

      if (newTour) {
        setSuccess("Tour created successfully!");

        // Reset form
        setTourName("");
        setBaseCurrency("USD");
        if (!isAuthenticated) {
          setEmail("");
          setPin("");
          setConfirmPin("");
          setSecurityAnswer("");
        }

        // Redirect after a short delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError("Failed to create tour. Please try again.");
      }
    } catch (error) {
      console.error("Error creating tour:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Create New Tour
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h6" gutterBottom>
            Tour Information
          </Typography>

          <TextField margin="normal" required fullWidth id="tourName" label="Tour Name" name="tourName" placeholder="e.g., Philippines Trip 2023" value={tourName} onChange={(e) => setTourName(e.target.value)} disabled={loading} />

          <TextField
            margin="normal"
            required
            fullWidth
            id="baseCurrency"
            label="Base Currency"
            name="baseCurrency"
            placeholder="e.g., USD"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            disabled={loading}
            helperText="Enter the 3-letter currency code (e.g., USD, EUR, JPY)"
            inputProps={{
              maxLength: 3,
              style: { textTransform: "uppercase" },
            }}
          />

          {/* Only show Account and Security sections for non-authenticated users */}
          {!isAuthenticated && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Account Information
              </Typography>

              <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} helperText="You'll use this email to log in to your tour" />

              <TextField
                margin="normal"
                required
                fullWidth
                name="pin"
                label="PIN"
                type={showPin ? "text" : "password"}
                id="pin"
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
                helperText="PIN must be 4-6 alphanumeric characters"
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPin"
                label="Confirm PIN"
                type={showPin ? "text" : "password"}
                id="confirmPin"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={loading}
                error={confirmPin !== pin && confirmPin !== ""}
                helperText={confirmPin !== pin && confirmPin !== "" ? "PINs do not match" : ""}
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Security Information
              </Typography>

              <FormControl fullWidth margin="normal" disabled={loading || loadingQuestions}>
                <InputLabel id="security-question-label">Security Question</InputLabel>
                <Select labelId="security-question-label" id="securityQuestionId" value={securityQuestionId} label="Security Question" onChange={handleSecurityQuestionChange} displayEmpty={securityQuestions.length === 0}>
                  {securityQuestions.length === 0 && (
                    <MenuItem value={0} disabled>
                      <em>Loading security questions...</em>
                    </MenuItem>
                  )}
                  {securityQuestions.map((question) => (
                    <MenuItem key={question.id} value={question.id}>
                      {question.question}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>This will be used to reset your PIN if you forget it</FormHelperText>
              </FormControl>

              <TextField margin="normal" required fullWidth id="securityAnswer" label="Security Answer" name="securityAnswer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} disabled={loading} helperText="Remember this answer exactly as you type it" />
            </>
          )}

          {/* Show which email is being used for authenticated users */}
          {isAuthenticated && authState.email && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              Creating tour as: <strong>{authState.email}</strong>
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              {isAuthenticated ? "Cancel" : "Back to Login"}
            </Button>

            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Create Tour"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateTourForm;
