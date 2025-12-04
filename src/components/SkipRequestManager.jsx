import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  PendingActions as PendingIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  Person as UserIcon,
  Schedule as TimeIcon,
} from "@mui/icons-material";
import {
  handleAdminSkipAction,
  getSkipRequestDetails,
  SKIP_REQUEST_STATUS,
  SKIP_REQUEST_TYPES,
} from "../services/orderSynchronization";

/**
 * Skip Request Review Dialog
 * Shows when admin needs to review a user's skip request
 */
export const SkipRequestDialog = ({
  open,
  onClose,
  orderId,
  date,
  userMealSelectionId,
  onActionCompleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [skipDetails, setSkipDetails] = useState(null);
  const [adminAction, setAdminAction] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && orderId && date) {
      fetchSkipDetails();
    }
  }, [open, orderId, date]);

  const fetchSkipDetails = async () => {
    try {
      setLoading(true);
      const details = await getSkipRequestDetails(orderId, date);
      setSkipDetails(details);
    } catch (err) {
      setError("Failed to load skip request details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!adminAction) {
      setError("Please select an action");
      return;
    }

    try {
      setLoading(true);
      await handleAdminSkipAction(
        orderId,
        userMealSelectionId,
        date,
        "admin_user", // Replace with actual admin ID
        adminAction,
        adminNotes
      );

      if (onActionCompleted) {
        onActionCompleted(adminAction);
      }

      onClose();
    } catch (err) {
      setError("Failed to process action: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAdminAction("");
    setAdminNotes("");
    setError("");
    onClose();
  };

  if (!skipDetails) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            {loading
              ? "Loading skip request details..."
              : "No details available"}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const { skipRequest } = skipDetails;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PendingIcon color="warning" />
          <Typography variant="h6">User Skip Request Review</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Order #{orderId.slice(-8)} - {date}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Skip Request Details */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Skip Request Details</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <UserIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Requested by:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {skipRequest.skipRequestedBy || "Unknown User"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Requested at:
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {skipRequest.skipRequestedAt
                    ? new Date(
                        skipRequest.skipRequestedAt.seconds * 1000
                      ).toLocaleString()
                    : "Unknown"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Reason:
                </Typography>
                <Typography variant="body1">
                  {skipRequest.skipReason || "No reason provided"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={`Status: ${skipRequest.skipRequestStatus}`}
                    color={
                      skipRequest.skipRequestStatus ===
                      SKIP_REQUEST_STATUS.PENDING
                        ? "warning"
                        : "default"
                    }
                    size="small"
                  />
                  <Chip
                    label={`Type: ${skipRequest.skipRequestType}`}
                    color="info"
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Admin Action */}
        <Typography variant="h6" gutterBottom>
          Admin Action Required
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={adminAction}
            onChange={(e) => setAdminAction(e.target.value)}
            label="Action"
          >
            <MenuItem value="approve">
              <Box display="flex" alignItems="center" gap={1}>
                <ApproveIcon color="success" fontSize="small" />
                <span>Approve Skip Request</span>
              </Box>
            </MenuItem>
            <MenuItem value="reject">
              <Box display="flex" alignItems="center" gap={1}>
                <RejectIcon color="error" fontSize="small" />
                <span>Reject Skip Request</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Admin Notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about your decision..."
          sx={{ mb: 2 }}
        />

        {adminAction === "approve" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Approving this request will:</strong>
              <br />
              • Set order status to "Delivery Skipped"
              <br />
              • Mark the day as skipped in meal selections
              <br />
              • Send notification to customer
              <br />• Update billing/refund if applicable
            </Typography>
          </Alert>
        )}

        {adminAction === "reject" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Rejecting this request will:</strong>
              <br />
              • Keep the order active for delivery
              <br />
              • Remove the skip flag from meal selections
              <br />
              • Notify customer of the rejection
              <br />• Require explanation in admin notes
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAction}
          variant="contained"
          disabled={!adminAction || loading}
          color={adminAction === "approve" ? "success" : "error"}
        >
          {loading
            ? "Processing..."
            : `${adminAction === "approve" ? "Approve" : "Reject"} Request`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Skip Request Indicator Chip
 * Shows on order cards when there's a pending skip request
 */
export const SkipRequestIndicator = ({
  orderId,
  date,
  skipRequest,
  onReviewClick,
}) => {
  if (!skipRequest?.adminActionRequired) {
    return null;
  }

  const getChipColor = () => {
    switch (skipRequest.skipRequestStatus) {
      case SKIP_REQUEST_STATUS.PENDING:
        return "warning";
      case SKIP_REQUEST_STATUS.APPROVED:
        return "success";
      case SKIP_REQUEST_STATUS.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  const getChipLabel = () => {
    switch (skipRequest.skipRequestStatus) {
      case SKIP_REQUEST_STATUS.PENDING:
        return "🔔 Skip Request Pending";
      case SKIP_REQUEST_STATUS.APPROVED:
        return "✅ Skip Approved";
      case SKIP_REQUEST_STATUS.REJECTED:
        return "❌ Skip Rejected";
      default:
        return "Skip Request";
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Chip
        icon={<PendingIcon />}
        label={getChipLabel()}
        color={getChipColor()}
        size="small"
        onClick={
          skipRequest.skipRequestStatus === SKIP_REQUEST_STATUS.PENDING
            ? onReviewClick
            : undefined
        }
        clickable={
          skipRequest.skipRequestStatus === SKIP_REQUEST_STATUS.PENDING
        }
        sx={{
          mb: 1,
          cursor:
            skipRequest.skipRequestStatus === SKIP_REQUEST_STATUS.PENDING
              ? "pointer"
              : "default",
        }}
      />

      {skipRequest.skipRequestStatus === SKIP_REQUEST_STATUS.PENDING && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Customer requested to skip this day.</strong>
            <br />
            Reason: {skipRequest.skipReason}
            <br />
            <Button
              size="small"
              variant="outlined"
              onClick={onReviewClick}
              sx={{ mt: 1 }}
            >
              Review Request
            </Button>
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SkipRequestDialog;
