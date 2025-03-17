import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ResetPinData, SecurityQuestion } from "../types";

interface ResetPinFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ResetPinForm: React.FC<ResetPinFormProps> = ({ onSuccess, onCancel }) => {
  const { resetPin: resetPinFn, getSecurityQuestions, isValidPin } = useAuth();

  const [resetData, setResetData] = useState<ResetPinData>({
    email: "",
    securityQuestionId: 0,
    securityAnswer: "",
    newPin: "",
  });

  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load security questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const questions = await getSecurityQuestions();
        setSecurityQuestions(questions);
        if (questions.length > 0) {
          setResetData((prev) => ({ ...prev, securityQuestionId: questions[0].id }));
        }
      } catch (error) {
        console.error("Error loading security questions:", error);
        setError("Failed to load security questions. Please try again.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [getSecurityQuestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    setResetData((prev) => ({ ...prev, securityQuestionId: e.target.value as number }));
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPin(e.target.value);
  };

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  const validateForm = (): boolean => {
    if (!resetData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!resetData.securityAnswer.trim()) {
      setError("Security answer is required");
      return false;
    }

    if (!resetData.newPin.trim()) {
      setError("New PIN is required");
      return false;
    }

    if (!isValidPin(resetData.newPin)) {
      setError("PIN must be 4-6 alphanumeric characters");
      return false;
    }

    if (resetData.newPin !== confirmPin) {
      setError("PINs do not match");
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
      const result = await resetPinFn(resetData);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Reset Your PIN
        </Typography>

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
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={resetData.email} onChange={handleChange} disabled={loading} />

          <FormControl fullWidth margin="normal" disabled={loading || loadingQuestions}>
            <InputLabel id="security-question-label">Security Question</InputLabel>
            <Select labelId="security-question-label" id="securityQuestionId" value={resetData.securityQuestionId} label="Security Question" onChange={handleSelectChange}>
              {securityQuestions.map((question) => (
                <MenuItem key={question.id} value={question.id}>
                  {question.question}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select the security question you chose when creating your tour</FormHelperText>
          </FormControl>

          <TextField margin="normal" required fullWidth id="securityAnswer" label="Security Answer" name="securityAnswer" value={resetData.securityAnswer} onChange={handleChange} disabled={loading} />

          <TextField
            margin="normal"
            required
            fullWidth
            name="newPin"
            label="New PIN"
            type={showPin ? "text" : "password"}
            id="newPin"
            value={resetData.newPin}
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
            onChange={handleConfirmPinChange}
            disabled={loading}
            error={confirmPin !== resetData.newPin && confirmPin !== ""}
            helperText={confirmPin !== resetData.newPin && confirmPin !== "" ? "PINs do not match" : ""}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
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
