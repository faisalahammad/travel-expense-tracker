import { AppBar, Box, Button, Container, Divider, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Toolbar, Typography } from "@mui/material";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, setActiveTour } = useApp();
  const location = useLocation();
  const { tours, activeTourId } = state;

  const handleTourChange = (event: SelectChangeEvent<string>) => {
    setActiveTour(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: "none", color: "white" }}>
            Travel Expense Tracker
          </Typography>

          {tours.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 1 }}>
                <InputLabel id="tour-select-label" sx={{ color: "white" }}>
                  Tour
                </InputLabel>
                <Select labelId="tour-select-label" id="tour-select" value={activeTourId || ""} onChange={handleTourChange} label="Tour" sx={{ color: "white" }}>
                  {tours.map((tour) => (
                    <MenuItem key={tour.id} value={tour.id}>
                      {tour.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button component={Link} to="/tours" variant={location.pathname === "/tours" ? "contained" : "text"} color="inherit">
                  Manage Tours
                </Button>

                {activeTourId && (
                  <>
                    <Button component={Link} to="/travelers" variant={location.pathname === "/travelers" ? "contained" : "text"} color="inherit">
                      Travelers
                    </Button>
                    <Button component={Link} to="/currencies" variant={location.pathname === "/currencies" ? "contained" : "text"} color="inherit">
                      Currencies
                    </Button>
                    <Button component={Link} to="/expenses" variant={location.pathname === "/expenses" ? "contained" : "text"} color="inherit">
                      Expenses
                    </Button>
                    <Button component={Link} to="/settlements" variant={location.pathname === "/settlements" ? "contained" : "text"} color="inherit">
                      Settlements
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          {children}
        </Paper>
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: "background.paper", mt: "auto" }}>
        <Container maxWidth="lg">
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Travel Expense Tracker
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
