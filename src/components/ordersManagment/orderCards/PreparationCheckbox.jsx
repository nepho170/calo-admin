// 3. PreparationCheckbox.jsx
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

const PreparationCheckbox = ({
  orderId,
  isPrepared,
  onTogglePreparedStatus,
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      sx={{
        p: 1,
        bgcolor: isPrepared ? "success.50" : "grey.50",
        borderRadius: 1,
        border: 1,
        borderColor: isPrepared ? "success.main" : "grey.300",
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={isPrepared}
            onChange={() => onTogglePreparedStatus(orderId)}
            icon={<CheckBoxOutlineBlankIcon />}
            checkedIcon={<CheckBoxIcon />}
            sx={{
              color: isPrepared ? "success.main" : "grey.500",
              "&.Mui-checked": {
                color: "success.main",
              },
            }}
          />
        }
        label={
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: isPrepared ? "success.main" : "text.primary",
              textDecoration: isPrepared ? "line-through" : "none",
            }}
          >
            {isPrepared ? "✅ Order Prepared" : "🔄 Mark as Prepared"}
          </Typography>
        }
      />
      {isPrepared && (
        <Chip
          label="READY"
          size="small"
          color="success"
          sx={{ fontWeight: "bold" }}
        />
      )}
    </Box>
  );
};

export default PreparationCheckbox;
