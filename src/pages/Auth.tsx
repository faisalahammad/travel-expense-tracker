import { Box, Container, Typography } from "@mui/material";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AccountSettings from "../components/AccountSettings";
import CreateTourForm from "../components/CreateTourForm";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ResetPinForm from "../components/ResetPinForm";
import { useAuth } from "../context/AuthContext";

enum AuthView {
  LOGIN = "login",
  RESET_PIN = "reset-pin",
  CREATE_TOUR = "create-tour",
  REGISTER = "register",
  ACCOUNT = "account",
}

const Auth = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If authenticated and not in account settings, redirect to /tours
    if (isAuthenticated && !location.pathname.includes("/account")) {
      navigate("/tours");
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const getCurrentView = (): AuthView => {
    if (location.pathname === "/reset-pin") return AuthView.RESET_PIN;
    if (location.pathname === "/create-tour") return AuthView.CREATE_TOUR;
    if (location.pathname === "/register") return AuthView.REGISTER;
    if (location.pathname === "/account") return AuthView.ACCOUNT;
    return AuthView.LOGIN;
  };

  const handleLoginSuccess = () => {
    navigate("/tours");
  };

  const handleRegisterSuccess = () => {
    navigate("/login");
  };

  const handleResetPinSuccess = () => {
    navigate("/login");
  };

  const handleCreateTourSuccess = () => {
    navigate("/tours");
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleForgotPin = () => {
    navigate("/reset-pin");
  };

  const renderView = () => {
    const currentView = getCurrentView();
    console.log("Current view:", currentView, "Path:", location.pathname);

    switch (currentView) {
      case AuthView.LOGIN:
        return <LoginForm onSuccess={handleLoginSuccess} onForgotPin={handleForgotPin} onRegister={handleRegister} />;
      case AuthView.RESET_PIN:
        return <ResetPinForm onSuccess={handleResetPinSuccess} onCancel={handleBackToLogin} />;
      case AuthView.CREATE_TOUR:
        return <CreateTourForm onSuccess={handleCreateTourSuccess} onCancel={handleBackToLogin} />;
      case AuthView.REGISTER:
        return <RegisterForm onSuccess={handleRegisterSuccess} onCancel={handleBackToLogin} />;
      case AuthView.ACCOUNT:
        return <AccountSettings />;
      default:
        return <LoginForm onSuccess={handleLoginSuccess} onForgotPin={handleForgotPin} onRegister={handleRegister} />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Travel Expense Tracker
        </Typography>
        {renderView()}
      </Box>
    </Container>
  );
};

export default Auth;
