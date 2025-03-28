import { Add as AddIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActions, CardContent, Divider, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Home: React.FC = () => {
  const { state, createTour } = useAppContext();
  const { tours, activeTourId } = state;

  const [newTourName, setNewTourName] = useState("");
  const [newTourCurrency, setNewTourCurrency] = useState("USD");

  const activeTour = activeTourId ? tours.find((tour) => tour.id === activeTourId) : null;

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTourName.trim() && newTourCurrency.trim()) {
      createTour(newTourName.trim(), newTourCurrency.trim());
      setNewTourName("");
      setNewTourCurrency("USD");
    }
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Travel Expense Tracker
      </Typography>

      {tours.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          Welcome to Travel Expense Tracker! Get started by creating your first tour.
        </Alert>
      ) : (
        activeTour && (
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
                    <Button component={Link} to="/travelers" size="small" color="primary">
                      Manage Travelers
                    </Button>
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
                    <Button component={Link} to="/currencies" size="small" color="success">
                      Manage Currencies
                    </Button>
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
                    <Button component={Link} to="/expenses" size="small" sx={{ color: "purple" }}>
                      Manage Expenses
                    </Button>
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
                    <Button component={Link} to="/settlements" size="small" color="warning">
                      View Settlements
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Create New Tour
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleCreateTour}>
              <TextField fullWidth id="tourName" label="Tour Name" placeholder="e.g., Philippines Trip 2023" variant="outlined" value={newTourName} onChange={(e) => setNewTourName(e.target.value)} required margin="normal" />
              <TextField fullWidth id="baseCurrency" label="Base Currency" placeholder="e.g., USD" variant="outlined" value={newTourCurrency} onChange={(e) => setNewTourCurrency(e.target.value)} required margin="normal" helperText="Enter the 3-letter currency code (e.g., USD, EUR, JPY)" />
              <Button type="submit" variant="contained" color="primary" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                Create Tour
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {tours.length > 0 && (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button component={Link} to="/tours" variant="outlined" color="primary" startIcon={<SettingsIcon />}>
            Manage All Tours
          </Button>
        </Box>
      )}
    </>
  );
};

export default Home;
