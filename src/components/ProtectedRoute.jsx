import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminLogin from "./AdminLogin";
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body1">Checking authentication...</Typography>
      </Box>
    );
  }

  // If user is not authenticated, show login page
  if (!user) {
    return <AdminLogin />;
  }

  // If user is not an admin, redirect to login
  if (!user.isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated admin - all admins have full access
  return children;
};

export default ProtectedRoute;
