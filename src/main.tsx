import { Alert, Box, Button, Container, CssBaseline, Paper, ThemeProvider, Typography, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";
import { initializeDatabase } from "./utils/initializeDatabase";

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // This will trigger the vite-pwa:updated event that our PWAInstallPrompt component listens for
    document.dispatchEvent(new Event("vite-pwa:updated"));
  },
  onOfflineReady() {
    console.log("App is ready for offline use");
  },
});

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

// DatabaseSetupMessage component
const DatabaseSetupMessage = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Database Setup Required
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            The application cannot connect to the required database tables. Please follow the setup instructions below.
          </Alert>
          <Typography variant="body1" paragraph>
            To use this application, you need to set up the database tables in your Supabase project:
          </Typography>
          <ol>
            <li>
              <Typography variant="body1" paragraph>
                Go to your Supabase project dashboard
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Navigate to the SQL Editor
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Copy and paste the SQL from the <code>travel-expense-tracker-db-setup.sql</code> file in the project root
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                Run the SQL script to create the necessary tables and functions
              </Typography>
            </li>
          </ol>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

// Main App Wrapper
const AppWrapper = () => {
  const [databaseInitialized, setDatabaseInitialized] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkDatabase = async () => {
      try {
        const result = await initializeDatabase();
        setDatabaseInitialized(result);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setDatabaseInitialized(false);
      }
    };

    checkDatabase();
  }, []);

  if (databaseInitialized === null) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Typography>Loading...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  if (databaseInitialized === false) {
    return <DatabaseSetupMessage />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
