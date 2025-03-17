import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, Select, Tab, Tabs, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChangePinData, ChangeSecurityQuestionData, DeleteAccountData, SecurityQuestion } from "../types";
import { supabase } from "../utils/supabase";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`account-tabpanel-${index}`} aria-labelledby={`account-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AccountSettings: React.FC = () => {
  const { authState, changePin, changeSecurityQuestion, getSecurityQuestions, isValidPin, deleteAccount } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  // Change PIN states
  const [changePinData, setChangePinData] = useState<ChangePinData>({
    currentPin: "",
    newPin: "",
  });
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Change Security Question states
  const [securityData, setSecurityData] = useState<ChangeSecurityQuestionData>({
    pin: "",
    securityQuestionId: 0,
    securityAnswer: "",
  });
  const [showSecurityPin, setShowSecurityPin] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentSecurityQuestionId, setCurrentSecurityQuestionId] = useState<number>(0);

  // Delete Account states
  const [deleteAccountData, setDeleteAccountData] = useState<DeleteAccountData>({
    pin: "",
    securityAnswer: "",
  });
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Load security questions
  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const questions = await getSecurityQuestions();
        setSecurityQuestions(questions);
        if (questions.length > 0) {
          setSecurityData((prev) => ({ ...prev, securityQuestionId: questions[0].id }));
        }

        // Get the current user's security question ID
        if (authState.isAuthenticated && authState.email) {
          const { data, error } = await supabase.from("users").select("security_question_id").eq("email", authState.email).single();

          if (!error && data && data.security_question_id) {
            setCurrentSecurityQuestionId(data.security_question_id);
          } else {
            // If no security question found, set to the first available question
            if (questions.length > 0) {
              setCurrentSecurityQuestionId(questions[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading security questions:", error);
        setSecurityError("Failed to load security questions. Please try again.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [getSecurityQuestions, authState.isAuthenticated, authState.email]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Change PIN handlers
  const handlePinDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePinData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmNewPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmNewPin(e.target.value);
  };

  const handleToggleShowPins = () => {
    setShowPins(!showPins);
  };

  const validatePinForm = (): boolean => {
    if (!changePinData.currentPin.trim()) {
      setPinError("Current PIN is required");
      return false;
    }

    if (!changePinData.newPin.trim()) {
      setPinError("New PIN is required");
      return false;
    }

    if (!isValidPin(changePinData.newPin)) {
      setPinError("PIN must be 4-6 alphanumeric characters");
      return false;
    }

    if (changePinData.newPin !== confirmNewPin) {
      setPinError("PINs do not match");
      return false;
    }

    return true;
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!validatePinForm()) {
      return;
    }

    setPinLoading(true);

    try {
      const result = await changePin(changePinData);

      if (result.success) {
        setPinSuccess(result.message);
        setChangePinData({ currentPin: "", newPin: "" });
        setConfirmNewPin("");
      } else {
        setPinError(result.message);
      }
    } catch (error) {
      console.error("Error changing PIN:", error);
      setPinError("An unexpected error occurred. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  // Change Security Question handlers
  const handleSecurityDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleShowSecurityPin = () => {
    setShowSecurityPin(!showSecurityPin);
  };

  const validateSecurityForm = (): boolean => {
    if (!securityData.pin.trim()) {
      setSecurityError("PIN is required");
      return false;
    }

    if (!securityData.securityAnswer.trim()) {
      setSecurityError("Security answer is required");
      return false;
    }

    return true;
  };

  const handleChangeSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!validateSecurityForm()) {
      return;
    }

    setSecurityLoading(true);

    try {
      const result = await changeSecurityQuestion(securityData);

      if (result.success) {
        setSecuritySuccess(result.message);
        setSecurityData((prev) => ({ ...prev, pin: "", securityAnswer: "" }));
      } else {
        setSecurityError(result.message);
      }
    } catch (error) {
      console.error("Error changing security question:", error);
      setSecurityError("An unexpected error occurred. Please try again.");
    } finally {
      setSecurityLoading(false);
    }
  };

  // Delete Account handlers
  const handleDeleteDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeleteAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleShowDeletePin = () => {
    setShowDeletePin(!showDeletePin);
  };

  const validateDeleteForm = (): boolean => {
    if (!deleteAccountData.pin.trim()) {
      setDeleteError("PIN is required");
      return false;
    }

    if (!deleteAccountData.securityAnswer.trim()) {
      setDeleteError("Security answer is required");
      return false;
    }

    return true;
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!validateDeleteForm()) {
      return;
    }

    // Show confirmation dialog with download suggestion
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.\n\nWe recommend downloading your tour data as an Excel file before proceeding.")) {
      return;
    }

    setDeleteLoading(true);

    try {
      const result = await deleteAccount(deleteAccountData);

      if (result.success) {
        // Redirect to auth page after successful deletion
        navigate("/auth");
      } else {
        setDeleteError(result.message);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <Card elevation={3} sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            You must be logged in to access account settings
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3} sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Account Settings
        </Typography>

        {/* Display user's email */}
        {authState.email && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="subtitle1" color="text.secondary">
              Logged in as: <strong>{authState.email}</strong>
            </Typography>
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="account settings tabs">
            <Tab label="Change PIN" id="account-tab-0" aria-controls="account-tabpanel-0" />
            <Tab label="Security Question" id="account-tab-1" aria-controls="account-tabpanel-1" />
            <Tab label="Delete Account" id="account-tab-2" aria-controls="account-tabpanel-2" sx={{ color: "error.main" }} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Change Your PIN
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {pinError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {pinError}
            </Alert>
          )}

          {pinSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {pinSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleChangePinSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPin"
              label="Current PIN"
              type={showPins ? "text" : "password"}
              id="currentPin"
              value={changePinData.currentPin}
              onChange={handlePinDataChange}
              disabled={pinLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle pin visibility" onClick={handleToggleShowPins} edge="end">
                      {showPins ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField margin="normal" required fullWidth name="newPin" label="New PIN" type={showPins ? "text" : "password"} id="newPin" value={changePinData.newPin} onChange={handlePinDataChange} disabled={pinLoading} helperText="PIN must be 4-6 alphanumeric characters" />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmNewPin"
              label="Confirm New PIN"
              type={showPins ? "text" : "password"}
              id="confirmNewPin"
              value={confirmNewPin}
              onChange={handleConfirmNewPinChange}
              disabled={pinLoading}
              error={confirmNewPin !== changePinData.newPin && confirmNewPin !== ""}
              helperText={confirmNewPin !== changePinData.newPin && confirmNewPin !== "" ? "PINs do not match" : ""}
            />

            <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} disabled={pinLoading}>
              {pinLoading ? <CircularProgress size={24} /> : "Change PIN"}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Update Security Question
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {securityError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {securityError}
            </Alert>
          )}

          {securitySuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {securitySuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleChangeSecuritySubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="pin"
              label="Your PIN"
              type={showSecurityPin ? "text" : "password"}
              id="pin"
              value={securityData.pin}
              onChange={handleSecurityDataChange}
              disabled={securityLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle pin visibility" onClick={handleToggleShowSecurityPin} edge="end">
                      {showSecurityPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal" disabled={securityLoading || loadingQuestions}>
              <InputLabel id="security-question-label">Security Question</InputLabel>
              <Select native labelId="security-question-label" id="securityQuestionId" value={securityData.securityQuestionId} label="Security Question" onChange={(e) => setSecurityData((prev) => ({ ...prev, securityQuestionId: Number(e.target.value) }))}>
                <option value={0} disabled>
                  Select a security question
                </option>
                {securityQuestions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.question}
                  </option>
                ))}
              </Select>
              <FormHelperText>Choose a security question you can easily remember</FormHelperText>
            </FormControl>

            <TextField margin="normal" required fullWidth name="securityAnswer" label="Security Answer" id="securityAnswer" value={securityData.securityAnswer} onChange={handleSecurityDataChange} disabled={securityLoading} helperText="This will be used to reset your PIN if you forget it" />

            <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} disabled={securityLoading}>
              {securityLoading ? <CircularProgress size={24} /> : "Update Security Question"}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom color="error">
            Delete Your Account
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1">This action is permanent and cannot be undone. All your tours, expenses, and data will be deleted. We recommend downloading your tour data before proceeding.</Typography>
          </Alert>

          {deleteError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {deleteError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleDeleteAccountSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="pin"
              label="Your PIN"
              type={showDeletePin ? "text" : "password"}
              id="delete-pin"
              value={deleteAccountData.pin}
              onChange={handleDeleteDataChange}
              disabled={deleteLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle pin visibility" onClick={handleToggleShowDeletePin} edge="end">
                      {showDeletePin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal" disabled={deleteLoading || loadingQuestions}>
              <InputLabel id="delete-security-question-label">Security Question</InputLabel>
              <Select native labelId="delete-security-question-label" id="delete-security-question" value={currentSecurityQuestionId} label="Security Question" disabled>
                <option value={0} disabled>
                  Select a security question
                </option>
                {securityQuestions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.question}
                  </option>
                ))}
              </Select>
              <FormHelperText>Your current security question</FormHelperText>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              name="securityAnswer"
              label="Your Security Answer"
              id="delete-security-answer"
              value={deleteAccountData.securityAnswer}
              onChange={handleDeleteDataChange}
              disabled={deleteLoading}
              helperText="Enter your security answer exactly as you created it"
            />

            <Button type="submit" variant="contained" color="error" sx={{ mt: 3 }} disabled={deleteLoading}>
              {deleteLoading ? <CircularProgress size={24} /> : "Permanently Delete My Account"}
            </Button>
          </Box>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;
