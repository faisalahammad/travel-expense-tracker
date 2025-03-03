import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AppProvider } from "./context/AppContext";
import "./index.css";
import Currencies from "./pages/Currencies";
import Expenses from "./pages/Expenses";
import Home from "./pages/Home";
import Settlements from "./pages/Settlements";
import Tours from "./pages/Tours";
import Travelers from "./pages/Travelers";

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
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
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
