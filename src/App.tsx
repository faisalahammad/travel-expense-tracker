import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AuthWrapper from "./components/Auth/AuthWrapper";
import Layout from "./components/Layout";
import { AppProvider, useAppContext } from "./context/AppContext";
import "./index.css";
import Currencies from "./pages/Currencies";
import Expenses from "./pages/Expenses";
import Home from "./pages/Home";
import Settlements from "./pages/Settlements";
import Tours from "./pages/Tours";
import Travelers from "./pages/Travelers";
import { User } from "./types";

// Create a theme instance with multiple colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Blue
      light: "#4791db",
      dark: "#115293",
    },
    secondary: {
      main: "#e91e63", // Pink
      light: "#ed4b82",
      dark: "#a31545",
    },
    error: {
      main: "#f44336", // Red
      light: "#e57373",
      dark: "#d32f2f",
    },
    warning: {
      main: "#ff9800", // Orange
      light: "#ffb74d",
      dark: "#f57c00",
    },
    info: {
      main: "#2196f3", // Light Blue
      light: "#64b5f6",
      dark: "#1976d2",
    },
    success: {
      main: "#4caf50", // Green
      light: "#81c784",
      dark: "#388e3c",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// AppRoutes component to handle user authentication
const AppRoutes: React.FC = () => {
  const { setCurrentUser } = useAppContext();

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
  };

  return (
    <Router>
      <AuthWrapper onUserChange={handleUserChange}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/travelers" element={<Travelers />} />
            <Route path="/currencies" element={<Currencies />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthWrapper>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
