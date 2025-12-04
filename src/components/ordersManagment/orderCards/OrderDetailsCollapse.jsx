// 4. OrderDetailsCollapse.jsx
import React from "react";
import { Collapse, Box, Typography, Chip } from "@mui/material";
import { Info as InfoIcon, Phone as PhoneIcon } from "@mui/icons-material";

const OrderDetailsCollapse = ({ order, isExpanded }) => {
  return (
    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
      <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <InfoIcon fontSize="small" />
          Order Details
        </Typography>

        {/* Contact Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Contact Information:
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {order.address?.firstName}{" "}
              {order.address?.lastName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <PhoneIcon fontSize="small" />
              <Typography variant="body2">
                <strong>Phone:</strong> {order.phone || "Not provided"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Full Address */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Delivery Address:
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2">
              <strong>Emirate:</strong>{" "}
              {order.address?.emirate || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Area:</strong> {order.address?.area || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Street:</strong>{" "}
              {order.address?.street || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Building:</strong>{" "}
              {order.address?.building || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Flat:</strong> {order.address?.flat || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Address Type:</strong>{" "}
              {order.address?.type || "Not specified"}
            </Typography>
            <Typography variant="body2">
              <strong>Delivery Time:</strong>{" "}
              {order.deliveryTime || "Not specified"}
            </Typography>
          </Box>
        </Box>

        {/* Delivery Instructions */}
        {order.instructions && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Delivery Instructions:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                {order.instructions.call && (
                  <Chip
                    label="📞 Call Customer"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {order.instructions.ringBell && (
                  <Chip
                    label="🔔 Ring Bell"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {order.instructions.leaveAtDoor && (
                  <Chip
                    label="🚪 Leave at Door"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              {order.instructions.customNote && (
                <Typography variant="body2">
                  <strong>Custom Note:</strong> {order.instructions.customNote}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Location Coordinates */}
        {order.location &&
          (order.location.latitude || order.location.longitude) && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Location Coordinates:
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 2 }}
              >
                Lat: {order.location.latitude}, Lng: {order.location.longitude}
              </Typography>
            </Box>
          )}
      </Box>
    </Collapse>
  );
};

export default OrderDetailsCollapse;
