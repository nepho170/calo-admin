// 5. OrderStatusSection.jsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { OrderStatusChip, QuickStatusActions } from "../../OrderStatusManager";

const OrderStatusSection = ({
  order,
  date,
  onStatusUpdate,
  onStatusUpdated,
  adminUserId,
}) => {
  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle2">Order Status for {date}:</Typography>
        <OrderStatusChip order={order} date={date} size="small" />
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
        <QuickStatusActions
          order={order}
          date={date}
          onStatusUpdated={onStatusUpdated}
          adminUserId={adminUserId}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onStatusUpdate(order, date)}
        >
          Update Status
        </Button>
      </Box>
    </Box>
  );
};

export default OrderStatusSection;
