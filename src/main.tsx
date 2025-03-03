import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupSupabaseTables } from "./utils/setupSupabase";

// Set up Supabase tables before rendering the app
setupSupabaseTables()
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to set up Supabase tables:", error);
    // Render the app anyway
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
      </React.StrictMode>
    );
  });
