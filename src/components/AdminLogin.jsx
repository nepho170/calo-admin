import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const AdminLogin = () => {
  const { signIn, resetPassword, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signIn(formData.email, formData.password);
      // AuthContext will handle the redirect after successful authentication
    } catch (error) {
      console.error("Login error:", error);

      // Handle specific error cases
      let errorMessage = "Login failed. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (
        error.message === "Access denied. Admin privileges required."
      ) {
        errorMessage =
          "Access denied. You must be an active admin to access this dashboard.";
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    setResetEmail(formData.email);
    setResetDialog(true);
    setResetError("");
    setResetSuccess(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setResetError("");
    } catch (error) {
      console.error("Reset password error:", error);

      let errorMessage = "Failed to send reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }

      setResetError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetDialog = () => {
    setResetDialog(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Checking authentication...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
            <AdminIcon fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
            Admin Dashboard
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, textAlign: "center" }}
          >
            Sign in to access the Biz Recipe admin panel
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isSubmitting || !formData.email || !formData.password}
            >
              {isSubmitting ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing In...</span>
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>

            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{
                  textDecoration: "none",
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot your password?
              </Link>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Only authorized admin users can access this dashboard.
            <br />
            <br />
            <strong>First time setup?</strong> You must initialize a super admin
            first.
            <br />
            Run:{" "}
            <code
              style={{
                backgroundColor: "#f5f5f5",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              npm run init-admin
            </code>
          </Typography>
        </Paper>

        {/* Reset Password Dialog */}
        <Dialog
          open={resetDialog}
          onClose={closeResetDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Typography>

            {resetSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset email sent! Check your inbox and follow the
                instructions to reset your password.
              </Alert>
            ) : (
              <>
                {resetError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {resetError}
                  </Alert>
                )}

                <TextField
                  autoFocus
                  margin="dense"
                  id="reset-email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeResetDialog} disabled={resetLoading}>
              {resetSuccess ? "Close" : "Cancel"}
            </Button>
            {!resetSuccess && (
              <Button
                onClick={handleResetPassword}
                variant="contained"
                disabled={resetLoading || !resetEmail}
              >
                {resetLoading ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} color="inherit" />
                    <span>Sending...</span>
                  </Box>
                ) : (
                  "Send Reset Email"
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminLogin;
