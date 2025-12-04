// 2. BulkSelectionCheckbox.jsx
import React from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Chip,
} from "@mui/material";
import {
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";

const BulkSelectionCheckbox = ({ orderId, isSelected, onToggleSelection }) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      sx={{
        p: 1,
        bgcolor: isSelected ? "primary.50" : "grey.50",
        borderRadius: 1,
        border: 2,
        borderColor: isSelected ? "primary.main" : "grey.300",
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelection(orderId)}
            icon={<CheckBoxOutlineBlankIcon />}
            checkedIcon={<CheckBoxIcon />}
            sx={{
              color: isSelected ? "primary.main" : "grey.500",
              "&.Mui-checked": {
                color: "primary.main",
              },
            }}
          />
        }
        label={
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: isSelected ? "primary.main" : "text.primary",
            }}
          >
            {isSelected
              ? "🔘 Selected for Bulk Update"
              : "⚪ Select for Bulk Update"}
          </Typography>
        }
      />
      {isSelected && (
        <Chip
          label="SELECTED"
          size="small"
          color="primary"
          sx={{ fontWeight: "bold" }}
        />
      )}
    </Box>
  );
};

export default BulkSelectionCheckbox;
