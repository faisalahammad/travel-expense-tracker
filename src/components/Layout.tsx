import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Button, Container, Divider, FormControl, IconButton, InputLabel, Menu, MenuItem, Paper, Select, SelectChangeEvent, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { state, setActiveTour } = useAppContext();
  const location = useLocation();
  const { tours, activeTourId } = state;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleTourChange = (event: SelectChangeEvent<string>) => {
    setActiveTour(event.target.value);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: "none", color: "white" }}>
            Travel Expense Tracker
          </Typography>

          {tours.length > 0 && (
            <>
              {isMobile ? (
                <>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 120, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 1, mr: 1 }}>
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

                  <IconButton size="large" edge="end" color="inherit" aria-label="menu" onClick={handleMobileMenuOpen}>
                    <MenuIcon />
                  </IconButton>

                  <Menu
                    anchorEl={mobileMenuAnchorEl}
                    open={isMobileMenuOpen}
                    onClose={handleMobileMenuClose}
                    PaperProps={{
                      elevation: 3,
                      sx: { mt: 1.5 },
                    }}
                  >
                    <MenuItem
                      component={Link}
                      to="/tours"
                      onClick={handleMobileMenuClose}
                      selected={location.pathname === "/tours"}
                      sx={{
                        minWidth: 150,
                        bgcolor: location.pathname === "/tours" ? "primary.light" : "inherit",
                        color: location.pathname === "/tours" ? "white" : "inherit",
                        "&:hover": {
                          bgcolor: location.pathname === "/tours" ? "primary.main" : "action.hover",
                        },
                      }}
                    >
                      Manage Tours
                    </MenuItem>

                    {activeTourId && (
                      <>
                        <MenuItem
                          component={Link}
                          to="/travelers"
                          onClick={handleMobileMenuClose}
                          selected={location.pathname === "/travelers"}
                          sx={{
                            minWidth: 150,
                            bgcolor: location.pathname === "/travelers" ? "primary.light" : "inherit",
                            color: location.pathname === "/travelers" ? "white" : "inherit",
                            "&:hover": {
                              bgcolor: location.pathname === "/travelers" ? "primary.main" : "action.hover",
                            },
                          }}
                        >
                          Travelers
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/currencies"
                          onClick={handleMobileMenuClose}
                          selected={location.pathname === "/currencies"}
                          sx={{
                            minWidth: 150,
                            bgcolor: location.pathname === "/currencies" ? "primary.light" : "inherit",
                            color: location.pathname === "/currencies" ? "white" : "inherit",
                            "&:hover": {
                              bgcolor: location.pathname === "/currencies" ? "primary.main" : "action.hover",
                            },
                          }}
                        >
                          Currencies
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/expenses"
                          onClick={handleMobileMenuClose}
                          selected={location.pathname === "/expenses"}
                          sx={{
                            minWidth: 150,
                            bgcolor: location.pathname === "/expenses" ? "primary.light" : "inherit",
                            color: location.pathname === "/expenses" ? "white" : "inherit",
                            "&:hover": {
                              bgcolor: location.pathname === "/expenses" ? "primary.main" : "action.hover",
                            },
                          }}
                        >
                          Expenses
                        </MenuItem>
                        <MenuItem
                          component={Link}
                          to="/settlements"
                          onClick={handleMobileMenuClose}
                          selected={location.pathname === "/settlements"}
                          sx={{
                            minWidth: 150,
                            bgcolor: location.pathname === "/settlements" ? "primary.light" : "inherit",
                            color: location.pathname === "/settlements" ? "white" : "inherit",
                            "&:hover": {
                              bgcolor: location.pathname === "/settlements" ? "primary.main" : "action.hover",
                            },
                          }}
                        >
                          Settlements
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                </>
              ) : (
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
            </>
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
            &copy; {new Date().getFullYear()} Travel Expense Tracker | Made with ❤️ by{" "}
            <a href="https://faisalahammad.com" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
              Faisal
            </a>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
