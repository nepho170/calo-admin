import React, { useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Edit as EditIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import {
  ORDER_STATUSES,
  STATUS_CONFIG,
  updateOrderDailyStatus,
  getOrderStatusForDateSync,
  getAllowedNextStatuses,
  getOrderStatusHistoryForDate,
  getStatusStatistics,
  groupOrdersByStatus,
  SKIP_REASONS,
  SKIP_REASON_LABELS,
} from "../services/orderStatus";

/**
 * Order Status Chip Component
 */
export const OrderStatusChip = ({ order, date, size = "medium" }) => {
  if (!order) {
    return (
      <Chip
        label="⚠️ Error"
        color="error"
        size={size}
        title="Order not found"
      />
    );
  }

  const status = getOrderStatusForDateSync(order, date);
  const config = STATUS_CONFIG[status];

  // Fallback for any unexpected status values
  if (!config) {
    console.warn("Unknown status found:", status);
    const fallbackConfig = STATUS_CONFIG[ORDER_STATUSES.PENDING];
    return (
      <Chip
        label={`${fallbackConfig.icon} ${fallbackConfig.label}`}
        color={fallbackConfig.color}
        size={size}
        variant="filled"
      />
    );
  }

  return (
    <Chip
      label={`${config.icon} ${config.label}`}
      color={config.color}
      size={size}
      variant="filled"
    />
  );
};

/**
 * Status Update Dialog Component
 */
export const StatusUpdateDialog = ({
  open,
  onClose,
  order,
  date,
  onStatusUpdated,
  adminUserId = "admin_user",
}) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [skipReason, setSkipReason] = useState("");
  const [customSkipReason, setCustomSkipReason] = useState("");

  // Guard against null order
  if (!order) {
    console.warn("StatusUpdateDialog received null order");
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">Cannot update status: Order not found</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const currentStatus = getOrderStatusForDateSync(order, date);
  const allowedStatuses = getAllowedNextStatuses(order, date);

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !order) return;

    // Validate skip reason for delivery skipped status
    if (selectedStatus === ORDER_STATUSES.DELIVERY_SKIPPED && !skipReason) {
      alert("Please select a reason for skipping the delivery");
      return;
    }

    // If "Other" is selected, custom reason is required
    if (
      selectedStatus === ORDER_STATUSES.DELIVERY_SKIPPED &&
      skipReason === SKIP_REASONS.OTHER &&
      !customSkipReason.trim()
    ) {
      alert("Please provide a custom reason for skipping the delivery");
      return;
    }

    try {
      setUpdating(true);

      // Determine the final skip reason
      const finalSkipReason =
        skipReason === SKIP_REASONS.OTHER
          ? customSkipReason.trim()
          : skipReason
          ? SKIP_REASON_LABELS[skipReason]
          : "";

      await updateOrderDailyStatus(
        order.id,
        date,
        selectedStatus,
        adminUserId,
        notes,
        sendEmailNotification,
        finalSkipReason
      );

      if (onStatusUpdated) {
        onStatusUpdated();
      }

      onClose();
      setSelectedStatus("");
      setNotes("");
      setSendEmailNotification(true);
      setSkipReason("");
      setCustomSkipReason("");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedStatus("");
    setNotes("");
    setSendEmailNotification(true);
    setSkipReason("");
    setCustomSkipReason("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon />
          <Typography variant="h6">Update Order Status</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Order #{order?.id?.slice(-8)} - {date}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Status:
          </Typography>
          <OrderStatusChip order={order} date={date} />
        </Box>

        {allowedStatuses.length > 0 ? (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel>New Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="New Status"
              >
                {allowedStatuses.map((status) => {
                  const config =
                    STATUS_CONFIG[status] ||
                    STATUS_CONFIG[ORDER_STATUSES.PENDING];
                  return (
                    <MenuItem key={status} value={status}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Skip Reason Dropdown - Only show for Delivery Skipped */}
            {selectedStatus === ORDER_STATUSES.DELIVERY_SKIPPED && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Skip Reason</InputLabel>
                  <Select
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    label="Skip Reason"
                    required
                  >
                    {Object.entries(SKIP_REASON_LABELS).map(
                      ([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                {/* Custom Reason Text Field - Only show when "Other" is selected */}
                {skipReason === SKIP_REASONS.OTHER && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Custom Skip Reason"
                    value={customSkipReason}
                    onChange={(e) => setCustomSkipReason(e.target.value)}
                    placeholder="Please specify the reason for skipping delivery..."
                    required
                  />
                )}
              </>
            )}

            <TextField
              fullWidth
              margin="normal"
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="Add any notes about this status change..."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    Send email notification to customer
                  </Typography>
                </Box>
              }
              sx={{ mt: 2, mb: 1 }}
            />

            {selectedStatus && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>
                    {
                      (
                        STATUS_CONFIG[selectedStatus] ||
                        STATUS_CONFIG[ORDER_STATUSES.PENDING]
                      ).label
                    }
                    :
                  </strong>{" "}
                  {
                    (
                      STATUS_CONFIG[selectedStatus] ||
                      STATUS_CONFIG[ORDER_STATUSES.PENDING]
                    ).description
                  }
                </Typography>
              </Alert>
            )}
          </>
        ) : (
          <Alert severity="info">
            <Typography variant="body2">
              This order has reached its final status. No further status changes
              are allowed.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={updating}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdateStatus}
          variant="contained"
          disabled={!selectedStatus || updating || allowedStatuses.length === 0}
          startIcon={updating ? <CircularProgress size={16} /> : <CheckIcon />}
        >
          {updating ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Order Status History Component
 */
export const OrderStatusHistory = ({ order, date }) => {
  const statusHistory = getOrderStatusHistoryForDate(order, date);
  const config =
    STATUS_CONFIG[statusHistory.status] ||
    STATUS_CONFIG[ORDER_STATUSES.PENDING];

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <HistoryIcon color="action" />
          <Typography variant="h6">Status History</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            label={`${config.icon} ${config.label}`}
            color={config.color}
            variant="filled"
          />
          <Typography variant="body2" color="text.secondary">
            Updated by: {statusHistory.updatedBy}
          </Typography>
        </Box>

        {statusHistory.notes && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Notes:
            </Typography>
            <Typography variant="body2">{statusHistory.notes}</Typography>
          </Box>
        )}

        {statusHistory.skipReason &&
          statusHistory.status === ORDER_STATUSES.DELIVERY_SKIPPED && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Skip Reason:
              </Typography>
              <Chip
                label={statusHistory.skipReason}
                color="warning"
                size="small"
                variant="outlined"
              />
            </Box>
          )}

        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(statusHistory.timestamp).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

/**
 * Status Statistics Dashboard Component
 */
export const StatusStatistics = ({
  orders,
  date,
  title = "Order Status Overview",
}) => {
  const stats = getStatusStatistics(orders, date);
  const grouped = groupOrdersByStatus(orders, date);

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total Orders: {stats.total} | Date: {date}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = stats.byStatus[status]?.count || 0;
            const percentage = stats.byStatus[status]?.percentage || 0;

            return (
              <Grid item xs={6} sm={4} md={2} key={status}>
                <Box textAlign="center" p={1}>
                  <Chip
                    label={`${config.icon} ${count}`}
                    color={config.color}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block">
                    {config.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {percentage}%
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Quick Status Action Buttons Component
 */
export const QuickStatusActions = ({
  order,
  date,
  onStatusUpdated,
  adminUserId = "admin_user",
}) => {
  const [updating, setUpdating] = useState(null);
  const allowedStatuses = getAllowedNextStatuses(order, date);

  const handleQuickUpdate = async (status) => {
    // For delivery skipped status, require using the full dialog
    if (status === ORDER_STATUSES.DELIVERY_SKIPPED) {
      alert(
        "Please use the 'Edit Status' button to specify a skip reason for delivery skipped orders."
      );
      return;
    }

    try {
      setUpdating(status);
      await updateOrderDailyStatus(
        order.id,
        date,
        status,
        adminUserId,
        `Quick update to ${
          (STATUS_CONFIG[status] || STATUS_CONFIG[ORDER_STATUSES.PENDING]).label
        }`,
        true // Send email notification for quick updates
      );

      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      {allowedStatuses.map((status) => {
        const config =
          STATUS_CONFIG[status] || STATUS_CONFIG[ORDER_STATUSES.PENDING];
        const isUpdating = updating === status;

        return (
          <Button
            key={status}
            size="small"
            variant="outlined"
            color={config.color}
            onClick={() => handleQuickUpdate(status)}
            disabled={isUpdating}
            startIcon={
              isUpdating ? (
                <CircularProgress size={16} />
              ) : (
                <span>{config.icon}</span>
              )
            }
          >
            {isUpdating ? "Updating..." : config.label}
          </Button>
        );
      })}
    </Box>
  );
};
