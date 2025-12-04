// 3. OrdersList.jsx - Container component for orders
import React from "react";
import { Box, Typography } from "@mui/material";
import OrderCard from "../orderCards/OrderCard";

const OrdersList = ({
  orders,
  date,
  allergyNames,
  allergies,
  componentNames,

  // Preparation features (for today orders)
  showPreparationCheckbox = false,
  preparedOrders = {},
  onTogglePreparedStatus,

  // Bulk selection features
  bulkSelectionMode = false,
  selectedOrdersForBulk = {},
  onToggleOrderSelection,

  // Status management
  onStatusUpdate,
  onStatusUpdated,
  onChefSelection,
  adminUserId = "admin_user",

  // Expandable details
  expandedOrders = {},
  onToggleOrderDetails,
}) => {
  // Sort orders for today view: unprepared first, then prepared
  const sortedOrders = showPreparationCheckbox
    ? [...orders].sort((a, b) => {
        const aPrepared = preparedOrders[a.id] || false;
        const bPrepared = preparedOrders[b.id] || false;

        // If preparation status is different, sort by that (unprepared first)
        if (aPrepared !== bPrepared) {
          return aPrepared ? 1 : -1;
        }

        // If same preparation status, maintain original order
        return 0;
      })
    : orders;

  const preparedCount = showPreparationCheckbox
    ? Object.values(preparedOrders).filter(Boolean).length
    : 0;
  const unpreparedCount = orders.length - preparedCount;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📋 Order Preparation Dashboard
      </Typography>

      {!bulkSelectionMode && showPreparationCheckbox && unpreparedCount > 0 && (
        <Box sx={{ mb: 3 }}></Box>
      )}

      {sortedOrders.map((order, index) => {
        const isPrepared = showPreparationCheckbox
          ? preparedOrders[order.id] || false
          : false;
        const prevOrder = index > 0 ? sortedOrders[index - 1] : null;
        const prevWasPrepared =
          prevOrder && showPreparationCheckbox
            ? preparedOrders[prevOrder.id] || false
            : false;

        // Show prepared header when transitioning from unprepared to prepared orders
        const showPreparedHeader =
          showPreparationCheckbox &&
          isPrepared &&
          (index === 0 || !prevWasPrepared) &&
          preparedCount > 0;

        return (
          <Box key={order.id}>
            {showPreparedHeader && (
              <Box sx={{ mt: 4, mb: 3 }}>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✅ Prepared Orders ({preparedCount})
                </Typography>
              </Box>
            )}
            <OrderCard
              order={order}
              date={date}
              allergyNames={allergyNames}
              allergies={allergies}
              componentNames={componentNames}
              // Preparation features
              showPreparationCheckbox={showPreparationCheckbox}
              isPrepared={isPrepared}
              onTogglePreparedStatus={onTogglePreparedStatus}
              // Bulk selection features
              bulkSelectionMode={bulkSelectionMode}
              isSelectedForBulk={selectedOrdersForBulk[order.id] || false}
              onToggleOrderSelection={onToggleOrderSelection}
              // Status management
              onStatusUpdate={onStatusUpdate}
              onStatusUpdated={onStatusUpdated}
              onChefSelection={onChefSelection}
              adminUserId={adminUserId}
              // Expandable details
              isExpanded={expandedOrders[order.id] || false}
              onToggleExpanded={onToggleOrderDetails}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default OrdersList;
