import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  PersonAdd,
  Block,
  CheckCircle,
  Email,
} from "@mui/icons-material";
import { adminUsersService } from "../services/adminUsers.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../configs/firebase.js";

const AdminUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const adminsList = await adminUsersService.getAllAdmins();
      setAdmins(adminsList);
      setError("");
    } catch (err) {
      console.error("Error loading admins:", err);
      setError("Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      setAddError("Email and password are required");
      return;
    }

    try {
      setAddLoading(true);
      setAddError("");

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAdmin.email,
        newAdmin.password
      );

      // Create admin record in Firestore
      await adminUsersService.createAdmin(
        userCredential.user.uid,
        newAdmin.email,
        newAdmin.displayName || newAdmin.email.split("@")[0]
      );

      // Refresh admin list
      await loadAdmins();

      // Close dialog and reset form
      setAddDialog(false);
      setNewAdmin({ email: "", password: "", displayName: "" });
    } catch (err) {
      console.error("Error adding admin:", err);
      let errorMessage = "Failed to add admin user";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }

      setAddError(errorMessage);
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (uid, currentStatus) => {
    try {
      await adminUsersService.toggleActive(uid, !currentStatus);
      await loadAdmins();
    } catch (err) {
      console.error("Error toggling admin status:", err);
      setError("Failed to update admin status");
    }
  };

  const handleSendPasswordReset = async (email) => {
    try {
      await adminUsersService.sendPasswordReset(email);
      alert(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error("Error sending password reset:", err);
      alert("Failed to send password reset email");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Never";
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Admin Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialog(true)}
        >
          Add Admin
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.uid}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.displayName || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={admin.active !== false ? "Active" : "Inactive"}
                      color={admin.active !== false ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(admin.createdAt)}</TableCell>
                  <TableCell>{formatDate(admin.lastLogin)}</TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={admin.active !== false ? "Deactivate" : "Activate"}
                    >
                      <IconButton
                        onClick={() =>
                          handleToggleActive(admin.uid, admin.active !== false)
                        }
                        color={admin.active !== false ? "error" : "success"}
                      >
                        {admin.active !== false ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Password Reset">
                      <IconButton
                        onClick={() => handleSendPasswordReset(admin.email)}
                        color="primary"
                      >
                        <Email />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No admin users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Admin Dialog */}
      <Dialog
        open={addDialog}
        onClose={() => setAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAdd />
            Add New Admin
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new admin user with full dashboard access.
          </Typography>

          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newAdmin.email}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, email: e.target.value })
            }
            disabled={addLoading}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newAdmin.password}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, password: e.target.value })
            }
            disabled={addLoading}
            helperText="Minimum 6 characters"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Display Name (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newAdmin.displayName}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, displayName: e.target.value })
            }
            disabled={addLoading}
            helperText="If not provided, will use email prefix"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)} disabled={addLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAdmin}
            variant="contained"
            disabled={addLoading || !newAdmin.email || !newAdmin.password}
          >
            {addLoading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} color="inherit" />
                Creating...
              </Box>
            ) : (
              "Add Admin"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
