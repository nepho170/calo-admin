// 2. BulkStatusUpdateDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { AdminPanelSettings as AdminPanelSettingsIcon } from "@mui/icons-material";
import { ORDER_STATUSES, SKIP_REASONS } from "../../../services/orderStatus";

const BulkStatusUpdateDialog = ({
  open,
  onClose,
  selectedOrders = [],
  date,
  loading = false,
  selectedStatus,
  reason,
  note,
  onStatusChange,
  onReasonChange,
  onNoteChange,
  onSave,
}) => {
  const selectedOrdersCount = selectedOrders.length;
  const selectedOrderIds = selectedOrders
    .map((order) => `#${order.id.slice(-8)}`)
    .join(", ");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AdminPanelSettingsIcon color="warning" />
          <Typography variant="h6">
            Bulk Status Update - {selectedOrdersCount} Selected Orders
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            ⚠️ This will update the status for {selectedOrdersCount} selected
            orders for {date}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected orders: {selectedOrderIds}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This action is typically used for holidays, emergencies, or
            system-wide delivery changes.
          </Typography>
        </Alert>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>New Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            label="New Status"
          >
            <MenuItem value={ORDER_STATUSES.DELIVERY_SKIPPED}>
              🚫 Delivery Skipped
            </MenuItem>
            <MenuItem value={ORDER_STATUSES.CANCELLED}>❌ Cancelled</MenuItem>
            <MenuItem value={ORDER_STATUSES.OUT_FOR_DELIVERY}>
              🚚 Out for Delivery
            </MenuItem>
            <MenuItem value={ORDER_STATUSES.DELIVERED}>✅ Delivered</MenuItem>
          </Select>
        </FormControl>

        {selectedStatus === ORDER_STATUSES.DELIVERY_SKIPPED && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Skip Reason</InputLabel>
            <Select
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              label="Skip Reason"
            >
              <MenuItem value={SKIP_REASONS.HOLIDAY}>
                🏖️ Holiday - Service Closed
              </MenuItem>
              <MenuItem value={SKIP_REASONS.DELIVERY_ISSUES}>
                🚨 Delivery Issues - Unable to Deliver
              </MenuItem>
              <MenuItem value={SKIP_REASONS.WEATHER}>
                🌧️ Weather Conditions
              </MenuItem>
              <MenuItem value={SKIP_REASONS.OTHER}>
                📝 Other (specify in notes)
              </MenuItem>
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes (Optional)"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add any additional information about this bulk status update..."
          sx={{ mb: 2 }}
        />

        <Alert severity="info">
          <Typography variant="body2">
            📧 Email notifications will be sent to all affected customers
            automatically.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="warning"
          disabled={!selectedStatus || loading || selectedOrdersCount === 0}
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : (
              <AdminPanelSettingsIcon />
            )
          }
        >
          {loading
            ? "Updating..."
            : `Update ${selectedOrdersCount} Selected Orders`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkStatusUpdateDialog;
