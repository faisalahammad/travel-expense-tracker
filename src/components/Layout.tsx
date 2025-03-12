import { Assignment as AssignmentIcon, ExploreOutlined as ExploreIcon, ReceiptLongOutlined as ReceiptLongIcon, SwapHorizOutlined as SwapHorizIcon } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Button, Container, CssBaseline, Divider, Drawer, FormControl, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, SelectChangeEvent, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import PWAInstallPrompt from "./PWAInstallPrompt";

const drawerWidth = 240;

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setActiveTour } = useAppContext();
  const { tours, activeTourId } = state;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTourChange = (event: SelectChangeEvent) => {
    const tourId = event.target.value;
    setActiveTour(tourId);
  };

  const activeTour = tours.find((tour) => tour.id === activeTourId);

  // Define navigation items
  const navItems = [
    { text: "Home", path: "/", icon: <ExploreIcon /> },
    { text: "Tours", path: "/tours", icon: <ExploreIcon /> },
    { text: "Expenses", path: "/expenses", icon: <ReceiptLongIcon /> },
    { text: "Settlements", path: "/settlements", icon: <SwapHorizIcon /> },
    { text: "Planning", path: "/planning", icon: <AssignmentIcon /> },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography
        variant="h6"
        component={Link}
        to="/"
        sx={{
          my: 2,
          display: "block",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        Travel Expense Tracker
      </Typography>
      <Divider />

      {tours.length > 0 && (
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1, textAlign: "left" }}>
              Active Tour
            </Typography>
            <Select value={activeTourId || ""} onChange={handleTourChange} displayEmpty variant="outlined" size="small">
              <MenuItem value="" disabled>
                Select a Tour
              </MenuItem>
              {tours.map((tour) => (
                <MenuItem key={tour.id} value={tour.id}>
                  {tour.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                textAlign: "left",
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                  "&:hover": {
                    backgroundColor: "primary.light",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar component="nav" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderRadius: 0 }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              display: { xs: "none", sm: "block" },
              textDecoration: "none",
              color: "inherit",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            Travel Expense Tracker
          </Typography>

          {tours.length > 0 && (
            <FormControl sx={{ minWidth: 200, mr: 2, backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 0 }}>
              <Select
                value={activeTourId || ""}
                onChange={handleTourChange}
                displayEmpty
                variant="outlined"
                sx={{
                  color: "white",
                  ".MuiOutlinedInput-notchedOutline": { border: "none" },
                  ".MuiSvgIcon-root": { color: "white" },
                }}
              >
                <MenuItem value="" disabled>
                  Select a Tour
                </MenuItem>
                {tours.map((tour) => (
                  <MenuItem key={tour.id} value={tour.id}>
                    {tour.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  mx: 1,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  ...(location.pathname === item.path && {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  }),
                }}
                startIcon={item.icon}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: "64px", // AppBar height
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: (theme) => theme.palette.primary.main,
          color: "white",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Travel Expense Tracker | Built with ❤️ by{" "}
            <a href="https://faisalahammad.com" target="_blank" rel="noopener noreferrer" style={{ color: "white" }}>
              Faisal
            </a>
          </Typography>
          <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.8 }}>
            Simplify group travel finances with easy expense tracking and automatic currency conversion
          </Typography>
        </Container>
      </Box>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default Layout;
