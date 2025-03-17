import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import Auth from "./pages/Auth";
import Currencies from "./pages/Currencies";
import Expenses from "./pages/Expenses";
import Home from "./pages/Home";
import Planning from "./pages/Planning";
import Settlements from "./pages/Settlements";
import Tours from "./pages/Tours";
import Travelers from "./pages/Travelers";

// Create a theme instance with multiple colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#0D9488", // Teal - representing oceans and tropical waters
      light: "#5EEAD4",
      dark: "#0F766E",
    },
    secondary: {
      main: "#F59E0B", // Amber - representing sun and beaches
      light: "#FCD34D",
      dark: "#D97706",
    },
    error: {
      main: "#EF4444", // Red
      light: "#FCA5A5",
      dark: "#B91C1C",
    },
    warning: {
      main: "#F97316", // Orange - representing sunsets
      light: "#FDBA74",
      dark: "#C2410C",
    },
    info: {
      main: "#3B82F6", // Blue - representing clear skies
      light: "#93C5FD",
      dark: "#1D4ED8",
    },
    success: {
      main: "#10B981", // Green - representing forests and nature
      light: "#6EE7B7",
      dark: "#047857",
    },
    background: {
      default: "#F8FAFC", // Light blue-gray - airy and open feeling
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
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

// AppRoutes component
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute redirectPath="/auth" />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tours" element={<Tours />} />
            <Route path="travelers" element={<Travelers />} />
            <Route path="currencies" element={<Currencies />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="planning" element={<Planning />} />
            <Route path="account" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
