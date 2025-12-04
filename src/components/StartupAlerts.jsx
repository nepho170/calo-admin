import React, { useState } from "react";
import {
  Alert,
  AlertTitle,
  Snackbar,
  Box,
  Button,
  Collapse,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

/**
 * StartupAlerts Component
 * Displays startup check results and alerts to admin users
 */
const StartupAlerts = () => {
  const { startupChecks, refreshStartupChecks, dismissAlert } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);

  if (!startupChecks.alerts || startupChecks.alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      case "success":
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertSeverity = (type, urgent) => {
    if (urgent) return "error";
    switch (type) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      case "success":
        return "success";
      default:
        return "info";
    }
  };

  const formatDetails = (details) => {
    if (!details || details.length === 0) return null;

    return (
      <List dense>
        {details.map((detail, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={detail.packageTitle || `Order ${detail.orderId}`}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Order ID: {detail.orderId}
                  </Typography>
                  {detail.daysExpired && (
                    <Chip
                      label={`${detail.daysExpired} days overdue`}
                      color="error"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                  {detail.daysUntilExpiry && (
                    <Chip
                      label={`${detail.daysUntilExpiry} days remaining`}
                      color="warning"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <>
      {/* Main Alert Snackbars */}
      {startupChecks.alerts.map((alert, index) => (
        <Snackbar
          key={index}
          open={true}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: index * 8 }}
        >
          <Alert
            severity={getAlertSeverity(alert.type, alert.urgent)}
            icon={getAlertIcon(alert.type)}
            action={
              <Box>
                {alert.details && alert.details.length > 0 && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() =>
                      setExpandedAlert(expandedAlert === index ? null : index)
                    }
                    endIcon={
                      expandedAlert === index ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )
                    }
                  >
                    Details
                  </Button>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => dismissAlert(index)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{ width: "100%", maxWidth: 600 }}
          >
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.message}

            {/* Expandable Details */}
            {alert.details && (
              <Collapse in={expandedAlert === index}>
                <Box sx={{ mt: 2 }}>{formatDetails(alert.details)}</Box>
              </Collapse>
            )}
          </Alert>
        </Snackbar>
      ))}

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Startup Check Details</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={refreshStartupChecks}
              disabled={startupChecks.loading}
            >
              Refresh
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {startupChecks.results && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Health Check Summary
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip
                      label={`${
                        startupChecks.results.healthCheck?.total
                          ?.activeSelections || 0
                      } Active Selections`}
                      color="primary"
                    />
                    <Chip
                      label={`${
                        startupChecks.results.healthCheck?.expired?.count || 0
                      } Expired`}
                      color={
                        startupChecks.results.healthCheck?.expired?.count > 0
                          ? "error"
                          : "default"
                      }
                    />
                    <Chip
                      label={`${
                        startupChecks.results.healthCheck?.expiringSoon
                          ?.count || 0
                      } Expiring Soon`}
                      color={
                        startupChecks.results.healthCheck?.expiringSoon?.count >
                        0
                          ? "warning"
                          : "default"
                      }
                    />
                  </Box>
                </CardContent>
              </Card>

              {startupChecks.results.deactivationResults && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Auto-Deactivation Results
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Chip
                        label={`${startupChecks.results.deactivationResults.attempted} Attempted`}
                        color="default"
                      />
                      <Chip
                        label={`${startupChecks.results.deactivationResults.successful} Successful`}
                        color="success"
                      />
                      {startupChecks.results.deactivationResults.failed > 0 && (
                        <Chip
                          label={`${startupChecks.results.deactivationResults.failed} Failed`}
                          color="error"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StartupAlerts;
