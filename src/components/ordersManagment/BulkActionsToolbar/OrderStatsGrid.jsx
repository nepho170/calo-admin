// 5. OrderStatsGrid.jsx - Statistics display
import React from "react";
import { Grid, Paper, Typography, Badge } from "@mui/material";

const OrderStatsGrid = ({ orders, userSkipped }) => {
  const chefSelectionNeeded = orders.filter(
    (order) => order.preparationStatus.status === "chef_selection_needed"
  ).length;

  const userSelected = orders.filter(
    (order) => order.preparationStatus.status === "user_selected"
  ).length;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" color="primary">
            Total Orders
          </Typography>
          <Typography variant="h3">{orders.length}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" color="warning.main">
            Chef Selection Needed
          </Typography>
          <Typography variant="h3">
            <Badge badgeContent={chefSelectionNeeded} color="warning">
              {chefSelectionNeeded}
            </Badge>
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" color="success.main">
            User Selected
          </Typography>
          <Typography variant="h3">{userSelected}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper
          sx={{
            p: 2,
            textAlign: "center",
            bgcolor: userSkipped > 0 ? "error.light" : "background.paper",
            border: userSkipped > 0 ? 2 : 0,
            borderColor: "error.main",
          }}
        >
          <Typography variant="h6" color="error.main">
            User Skipped
          </Typography>
          <Typography variant="h3" color="error.main">
            <Badge badgeContent={userSkipped} color="error">
              {userSkipped}
            </Badge>
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OrderStatsGrid;
