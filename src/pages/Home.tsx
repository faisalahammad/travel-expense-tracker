import { Card, CardActions, CardContent, Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Link, Navigate } from "react-router-dom";
import ToursList from "../components/ToursList";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
  const { authState } = useAuth();
  const { state } = useAppContext();
  const { tours, activeTourId } = state;

  // If not authenticated, redirect to auth page
  if (!authState.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const activeTour = activeTourId ? tours.find((tour) => tour.id === activeTourId) : null;

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Travel Expense Tracker
      </Typography>

      {/* Show tours list first */}
      <ToursList showTitle={false} />

      {/* Show active tour details if one is selected */}
      {activeTour && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Active Tour: {activeTour.name}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#e3f2fd", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>
                    Travelers
                  </Typography>
                  <Typography variant="h4">{activeTour.travelers.length}</Typography>
                </CardContent>
                <CardActions>
                  <Link to="/travelers" style={{ textDecoration: "none" }}>
                    Manage Travelers
                  </Link>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#e8f5e9", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" color="success" fontWeight="bold" gutterBottom>
                    Currencies
                  </Typography>
                  <Typography variant="h4">{activeTour.currencies.length}</Typography>
                </CardContent>
                <CardActions>
                  <Link to="/currencies" style={{ textDecoration: "none" }}>
                    Manage Currencies
                  </Link>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#f3e5f5", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: "purple" }} fontWeight="bold" gutterBottom>
                    Expenses
                  </Typography>
                  <Typography variant="h4">{activeTour.expenses.length}</Typography>
                </CardContent>
                <CardActions>
                  <Link to="/expenses" style={{ textDecoration: "none" }}>
                    Manage Expenses
                  </Link>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#fff3e0", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" color="warning" fontWeight="bold" gutterBottom>
                    Base Currency
                  </Typography>
                  <Typography variant="h4">{activeTour.baseCurrencyCode}</Typography>
                </CardContent>
                <CardActions>
                  <Link to="/settlements" style={{ textDecoration: "none" }}>
                    View Settlements
                  </Link>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </>
  );
};

export default Home;
