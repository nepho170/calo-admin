// 1. BulkActionsToolbar.jsx
import React from "react";
import { Box, Button, Chip, Typography, Alert } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";

const BulkActionsToolbar = ({
  // Preparation actions (for today orders)
  showPreparationActions = false,
  preparedCount = 0,
  totalOrders = 0,
  onMarkAllPrepared,
  onClearAllPrepared,

  // Bulk selection actions
  bulkSelectionMode = false,
  selectedOrdersCount = 0,
  onToggleBulkSelection,
  onSelectAllOrders,
  onDeselectAllOrders,
  onBulkStatusUpdate,

  // Holiday skip action
  onHolidaySkip,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Bulk Preparation Actions (Today Orders Only) */}
      {showPreparationActions && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={onMarkAllPrepared}
            disabled={preparedCount === totalOrders}
          >
            Mark All as Prepared
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<WarningIcon />}
            onClick={onClearAllPrepared}
            disabled={preparedCount === 0}
          >
            Clear All Prepared
          </Button>
        </Box>
      )}

      {/* Bulk Status Actions */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="warning"
          startIcon={<AdminPanelSettingsIcon />}
          onClick={onBulkStatusUpdate}
          sx={{ position: "relative" }}
        >
          {bulkSelectionMode ? "Update Selected" : "Select Orders"}
          <Chip
            label={bulkSelectionMode ? selectedOrdersCount : totalOrders}
            size="small"
            color={bulkSelectionMode ? "primary" : "warning"}
            sx={{ ml: 1, fontSize: "0.75rem" }}
          />
        </Button>

        {/* Selection Mode Controls */}
        {bulkSelectionMode && (
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={onSelectAllOrders}
              size="small"
            >
              Select All
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<WarningIcon />}
              onClick={onDeselectAllOrders}
              size="small"
              disabled={selectedOrdersCount === 0}
            >
              Deselect All
            </Button>
            <Button
              variant="outlined"
              onClick={onToggleBulkSelection}
              size="small"
            >
              Cancel Selection
            </Button>
          </>
        )}

        <Button
          variant="outlined"
          color="error"
          startIcon={<EventBusyIcon />}
          onClick={onHolidaySkip}
        >
          Skip All (Holiday)
        </Button>

        <Typography variant="body2" color="text.secondary">
          Quick actions for bulk preparation and status management
        </Typography>
      </Box>

      {/* Selection Mode Indicator */}
      {bulkSelectionMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body1" fontWeight="bold">
              🔘 Selection Mode Active - {selectedOrdersCount} of {totalOrders}{" "}
              orders selected
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={onToggleBulkSelection}
            >
              Exit Selection Mode
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Click the checkboxes above each order to select/deselect orders for
            bulk status update.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default BulkActionsToolbar;
