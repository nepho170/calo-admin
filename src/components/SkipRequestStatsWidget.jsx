import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Alert,
  Button,
} from "@mui/material";
import {
  PendingActions as PendingIcon,
  Person as UserIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";
import {
  getSkipRequestStats,
  getOrdersWithPendingSkipRequests,
  getSkipRequestStatus,
} from "../utils/skipRequestUtils";

/**
 * Skip Request Statistics Widget
 * Shows overview of skip requests for admin dashboard
 */
export const SkipRequestStatsWidget = ({
  orders,
  date,
  onViewPendingRequests,
}) => {
  const stats = getSkipRequestStats(orders, date);
  const pendingOrders = getOrdersWithPendingSkipRequests(orders, date);

  if (stats.skipped === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Skip Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No skip requests for {date}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Skip Requests - {date}</Typography>
          {stats.pending > 0 && (
            <Chip
              icon={<PendingIcon />}
              label={`${stats.pending} Pending`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {/* Pending Requests Alert */}
        {stats.pending > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={onViewPendingRequests}
              >
                Review
              </Button>
            }
          >
            <Typography variant="body2">
              <strong>
                {stats.pending} skip request{stats.pending > 1 ? "s" : ""}{" "}
                pending admin review
              </strong>
            </Typography>
          </Alert>
        )}

        {/* Statistics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center" p={1}>
              <Typography variant="h5" color="text.secondary">
                {stats.skipped}
              </Typography>
              <Typography variant="caption" display="block">
                Total Skipped
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box textAlign="center" p={1}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={0.5}
              >
                <UserIcon fontSize="small" color="primary" />
                <Typography variant="h5" color="primary">
                  {stats.userRequested}
                </Typography>
              </Box>
              <Typography variant="caption" display="block">
                User Requests
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box textAlign="center" p={1}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={0.5}
              >
                <AdminIcon fontSize="small" color="action" />
                <Typography variant="h5" color="text.secondary">
                  {stats.adminSkipped}
                </Typography>
              </Box>
              <Typography variant="caption" display="block">
                Admin Actions
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box textAlign="center" p={1}>
              <Typography variant="h5" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="caption" display="block">
                Pending Review
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Status Breakdown */}
        {(stats.approved > 0 || stats.rejected > 0) && (
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="subtitle2" gutterBottom>
              Request Status
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {stats.approved > 0 && (
                <Chip
                  icon={<ApprovedIcon />}
                  label={`${stats.approved} Approved`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
              {stats.rejected > 0 && (
                <Chip
                  icon={<RejectedIcon />}
                  label={`${stats.rejected} Rejected`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Pending Skip Requests List
 * Compact list of orders with pending skip requests
 */
export const PendingSkipRequestsList = ({ orders, date, onReviewRequest }) => {
  const pendingOrders = getOrdersWithPendingSkipRequests(orders, date);

  if (pendingOrders.length === 0) {
    return <Alert severity="info">No pending skip requests for {date}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Skip Requests ({pendingOrders.length})
      </Typography>

      {pendingOrders.map((order) => {
        const skipStatus = getSkipRequestStatus(order, date);

        return (
          <Card key={order.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="subtitle2">
                    Order #{order.id.slice(-8)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skipStatus.reason}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requested:{" "}
                    {skipStatus.requestedAt
                      ? new Date(
                          skipStatus.requestedAt.seconds * 1000
                        ).toLocaleString()
                      : "Unknown"}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    onReviewRequest(order.id, date, order.userMealSelectionId)
                  }
                >
                  Review
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default SkipRequestStatsWidget;
