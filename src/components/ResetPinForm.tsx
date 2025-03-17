import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Select, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { SecurityQuestion } from "../types";
import { resetPin } from "../utils/auth";

interface ResetPinFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ResetPinForm: React.FC<ResetPinFormProps> = ({ onSuccess, onCancel }) => {
  const { getSecurityQuestions, isValidPin } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [newPin, setNewPin] = useState("");
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

  // Load security questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const questions = await getSecurityQuestions();

        // Filter out any duplicate questions based on id
        const uniqueQuestions = Array.from(new Map(questions.map((q) => [q.id, q])).values()) as SecurityQuestion[];

        setSecurityQuestions(uniqueQuestions);
        if (uniqueQuestions.length > 0) {
          setSecurityQuestionId(uniqueQuestions[0].id);
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
  }, [getSecurityQuestions]);

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  const validateForm = (): boolean => {
    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    // Validate PIN
    if (!newPin.trim()) {
      setError("PIN is required");
      return false;
    }

    if (!isValidPin(newPin)) {
      setError("PIN must be 4-6 alphanumeric characters");
      return false;
    }

    if (newPin !== confirmPin) {
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

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await resetPin({
        email,
        securityQuestionId,
        securityAnswer,
        newPin,
      });

      if (!result.success) {
        setError(result.message || "Failed to reset PIN. Please check your information and try again.");
        return;
      }

      setSuccess("PIN reset successfully! You can now log in with your new PIN.");

      // Reset form
      setEmail("");
      setNewPin("");
      setConfirmPin("");
      setSecurityAnswer("");

      // Redirect after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Error resetting PIN:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Reset PIN
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
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />

          <FormControl fullWidth margin="normal" disabled={loading || loadingQuestions}>
            <InputLabel id="security-question-label">Security Question</InputLabel>
            <Select native labelId="security-question-label" id="securityQuestionId" value={securityQuestionId} onChange={(e) => setSecurityQuestionId(Number(e.target.value))} label="Security Question">
              <option value={0} disabled>
                Select a security question
              </option>
              {securityQuestions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.question}
                </option>
              ))}
            </Select>
            <FormHelperText>Select the security question you answered when creating your account</FormHelperText>
          </FormControl>

          <TextField margin="normal" required fullWidth id="securityAnswer" label="Security Answer" name="securityAnswer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} disabled={loading} />

          <TextField
            margin="normal"
            required
            fullWidth
            name="newPin"
            label="New PIN"
            type={showPin ? "text" : "password"}
            id="newPin"
            autoComplete="new-password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
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
            label="Confirm New PIN"
            type={showPin ? "text" : "password"}
            id="confirmPin"
            autoComplete="new-password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            disabled={loading}
            error={confirmPin !== newPin && confirmPin !== ""}
            helperText={confirmPin !== newPin && confirmPin !== "" ? "PINs do not match" : ""}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Back to Login
            </Button>

            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Reset PIN"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResetPinForm;
