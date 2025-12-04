import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Calculate as CalculateIcon } from "@mui/icons-material";
import { calculateMealPackageCalorieRange } from "../utils/calorieCalculator";

const CalorieCalculationSection = ({
  formData,
  setFormData,
  errors,
  setErrors,
}) => {
  const [calculatingCalories, setCalculatingCalories] = useState(false);
  const [autoCalculatedRange, setAutoCalculatedRange] = useState(null);
  const [useAutoCalculation, setUseAutoCalculation] = useState(
    formData.isAutoCalculated || false
  );

  // Auto calculate calorie range function
  const handleAutoCalculateCalories = async () => {
    if (
      !formData.macroPlanId ||
      !formData.includedMealTypes ||
      formData.includedMealTypes.length === 0
    ) {
      setErrors({
        ...errors,
        autoCalc: "Please select a macro plan and meal types first",
      });
      return;
    }

    try {
      setCalculatingCalories(true);
      setErrors({ ...errors, autoCalc: null });

      const result = await calculateMealPackageCalorieRange(
        formData.macroPlanId,
        formData.includedMealTypes
      );

      setAutoCalculatedRange(result);
      setUseAutoCalculation(true);

      // Update form data with calculated values
      setFormData({
        ...formData,
        calorieRange: {
          min: result.min,
          max: result.max,
        },
        isAutoCalculated: true,
      });
    } catch (error) {
      console.error("Error calculating calorie range:", error);
      setErrors({
        ...errors,
        autoCalc:
          "Failed to calculate calorie range. Please ensure the macro plan has meal templates configured.",
      });
    } finally {
      setCalculatingCalories(false);
    }
  };

  const handleToggleAutoCalculation = (enabled) => {
    setUseAutoCalculation(enabled);

    if (!enabled) {
      setAutoCalculatedRange(null);
      setFormData({
        ...formData,
        isAutoCalculated: false,
      });
    } else {
      setFormData({
        ...formData,
        isAutoCalculated: true,
      });
    }
  };

  const handleManualCalorieChange = (field, value) => {
    const newCalorieRange = {
      ...formData.calorieRange,
      [field]: parseInt(value) || 0,
    };

    setFormData({
      ...formData,
      calorieRange: newCalorieRange,
      isAutoCalculated: false, // Disable auto calculation when manually changed
    });

    // If auto calculation was enabled, disable it
    if (useAutoCalculation) {
      setUseAutoCalculation(false);
      setAutoCalculatedRange(null);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Calorie Range
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure how the calorie range is determined for this package.
        </Typography>

        {/* Auto calculation toggle */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useAutoCalculation}
                onChange={(e) => handleToggleAutoCalculation(e.target.checked)}
              />
            }
            label="Auto-calculate from meal templates"
            sx={{ mb: useAutoCalculation ? 2 : 0 }}
          />

          {useAutoCalculation && (
            <Box>
              <Button
                variant="outlined"
                onClick={handleAutoCalculateCalories}
                disabled={
                  calculatingCalories ||
                  !formData.macroPlanId ||
                  formData.includedMealTypes.length === 0
                }
                startIcon={
                  calculatingCalories ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CalculateIcon />
                  )
                }
                size="small"
                sx={{ mb: 2 }}
              >
                {calculatingCalories ? "Calculating..." : "Calculate Range"}
              </Button>

              {errors.autoCalc && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  {errors.autoCalc}
                </Typography>
              )}

              {autoCalculatedRange && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "success.light",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "success.main",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: "medium" }}
                  >
                    <strong>Calculated Range:</strong> {autoCalculatedRange.min}{" "}
                    - {autoCalculatedRange.max} calories
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Average:</strong> {autoCalculatedRange.average}{" "}
                    calories/day
                  </Typography>
                  <Typography variant="body2">
                    <strong>Based on:</strong>{" "}
                    {autoCalculatedRange.calculatedFromDays} days from meal
                    templates
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Minimum Calories"
          type="number"
          fullWidth
          value={formData.calorieRange.min}
          onChange={(e) => handleManualCalorieChange("min", e.target.value)}
          error={!!errors.calorieRange}
          helperText={errors.calorieRange}
          disabled={useAutoCalculation}
          InputProps={{
            endAdornment: useAutoCalculation && (
              <Chip label="Auto" size="small" color="success" />
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Maximum Calories"
          type="number"
          fullWidth
          value={formData.calorieRange.max}
          onChange={(e) => handleManualCalorieChange("max", e.target.value)}
          error={!!errors.calorieRange}
          disabled={useAutoCalculation}
          InputProps={{
            endAdornment: useAutoCalculation && (
              <Chip label="Auto" size="small" color="success" />
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Grid>
    </>
  );
};

export default CalorieCalculationSection;
