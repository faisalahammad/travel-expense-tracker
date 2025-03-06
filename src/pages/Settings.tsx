import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Settings: React.FC = () => {
  const { state } = useAppContext();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  // Redirect if no active tour
  if (!activeTourId) {
    navigate("/");
    return null;
  }

  const activeTour = tours.find((tour) => tour.id === activeTourId);

  if (!activeTour) {
    navigate("/");
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Tour: {activeTour.name}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Application Settings
        </Typography>
        <Typography variant="body1">This page will contain settings for the application.</Typography>
      </Paper>
    </Box>
  );
};

export default Settings;
