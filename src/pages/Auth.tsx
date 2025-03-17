import { Box, Container, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AccountSettings from "../components/AccountSettings";
import CreateTourForm from "../components/CreateTourForm";
import LoginForm from "../components/LoginForm";
import ResetPinForm from "../components/ResetPinForm";
import { useAuth } from "../context/AuthContext";

enum AuthView {
  LOGIN = "login",
  RESET_PIN = "reset_pin",
  CREATE_TOUR = "create_tour",
  ACCOUNT = "account",
}

const Auth: React.FC = () => {
  const { authState } = useAuth();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>(() => {
    // Initialize the view based on the current path
    return location.pathname === "/account" ? AuthView.ACCOUNT : AuthView.LOGIN;
  });

  // Update the view when the location changes
  useEffect(() => {
    if (location.pathname === "/account") {
      setCurrentView(AuthView.ACCOUNT);
    } else if (location.pathname === "/auth") {
      // Only reset to LOGIN if we're on the auth page and not already in RESET_PIN or CREATE_TOUR
      if (currentView !== AuthView.RESET_PIN && currentView !== AuthView.CREATE_TOUR) {
        setCurrentView(AuthView.LOGIN);
      }
    }
  }, [location.pathname, currentView]);

  // If user is already authenticated and trying to access login page, redirect to home
  // But don't redirect if they're trying to access the account page
  if (authState.isAuthenticated && currentView !== AuthView.ACCOUNT && location.pathname !== "/account") {
    return <Navigate to="/" replace />;
  }

  // If user is not authenticated and trying to access account page, redirect to auth
  if (!authState.isAuthenticated && location.pathname === "/account") {
    return <Navigate to="/auth" replace />;
  }

  const handleLoginSuccess = () => {
    // Redirect will happen automatically due to authState change
  };

  const handleForgotPin = () => {
    setCurrentView(AuthView.RESET_PIN);
  };

  const handleCreateTour = () => {
    setCurrentView(AuthView.CREATE_TOUR);
  };

  const handleBackToLogin = () => {
    setCurrentView(AuthView.LOGIN);
  };

  const renderView = () => {
    switch (currentView) {
      case AuthView.LOGIN:
        return <LoginForm onSuccess={handleLoginSuccess} onForgotPin={handleForgotPin} onCreateTour={handleCreateTour} />;
      case AuthView.RESET_PIN:
        return <ResetPinForm onSuccess={handleBackToLogin} onCancel={handleBackToLogin} />;
      case AuthView.CREATE_TOUR:
        return <CreateTourForm onSuccess={handleBackToLogin} onCancel={handleBackToLogin} />;
      case AuthView.ACCOUNT:
        return <AccountSettings />;
      default:
        return <LoginForm onSuccess={handleLoginSuccess} onForgotPin={handleForgotPin} onCreateTour={handleCreateTour} />;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Travel Expense Tracker
        </Typography>
        {renderView()}
      </Box>
    </Container>
  );
};

export default Auth;
