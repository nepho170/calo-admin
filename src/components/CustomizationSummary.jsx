// import React from "react";
// import {
//   Box,
//   Typography,
//   Alert,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Chip,
//   Paper,
// } from "@mui/material";
// import {
//   ExpandMore as ExpandMoreIcon,
//   Warning as WarningIcon,
//   Restaurant as RestaurantIcon,
//   Person as PersonIcon,
// } from "@mui/icons-material";

// /**
//  * Component to display a summary of orders with customizations
//  * Shows which orders have customized meals that need special attention
//  */
// const CustomizationSummary = ({ orders, date, title }) => {
//   // Filter orders that have customizations
//   const ordersWithCustomizations = orders.filter((order) => {
//     if (!order.dailySelection || !order.dailySelection.meals) return false;

//     return Object.values(order.dailySelection.meals).some((meals) =>
//       meals.some((meal) => meal.isCustomized)
//     );
//   });

//   const getCustomizedMealsForOrder = (order) => {
//     const customizedMeals = [];
//     if (order.dailySelection && order.dailySelection.meals) {
//       Object.entries(order.dailySelection.meals).forEach(
//         ([mealType, meals]) => {
//           meals.forEach((meal, index) => {
//             if (meal.isCustomized) {
//               customizedMeals.push({
//                 mealType,
//                 index,
//                 meal,
//               });
//             }
//           });
//         }
//       );
//     }
//     return customizedMeals;
//   };
// };

// export default CustomizationSummary;
