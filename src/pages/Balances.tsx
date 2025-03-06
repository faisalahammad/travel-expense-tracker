import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Balances: React.FC = () => {
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
        Balances
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Tour: {activeTour.name}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Traveler Balances
        </Typography>
        <Typography variant="body1">This page will show the current balance for each traveler.</Typography>
      </Paper>
    </Box>
  );
};

export default Balances;
