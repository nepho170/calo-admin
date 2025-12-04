// 4. PreparationProgressIndicator.jsx - For today orders
import React from "react";
import { Paper, Box, Typography } from "@mui/material";

const PreparationProgressIndicator = ({ preparedCount, totalOrders }) => {
  if (totalOrders === 0) return null;

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: "primary.50" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">📊 Preparation Progress</Typography>
        <Typography variant="h5" color="primary">
          {preparedCount}/{totalOrders}
        </Typography>
      </Box>
      <Box sx={{ position: "relative", mb: 1 }}>
        <Box
          sx={{
            width: "100%",
            height: 8,
            bgcolor: "grey.300",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${
                totalOrders > 0 ? (preparedCount / totalOrders) * 100 : 0
              }%`,
              height: "100%",
              bgcolor: "success.main",
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {preparedCount === 0 && "🚀 Ready to start preparation"}
        {preparedCount > 0 &&
          preparedCount < totalOrders &&
          `🔄 ${preparedCount} prepared, ${
            totalOrders - preparedCount
          } remaining`}
        {preparedCount === totalOrders &&
          preparedCount > 0 &&
          "🎉 All orders prepared! Great job!"}
      </Typography>
    </Paper>
  );
};

export default PreparationProgressIndicator;
