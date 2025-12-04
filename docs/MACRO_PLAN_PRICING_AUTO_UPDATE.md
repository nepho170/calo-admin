# Macro Plan Pricing Auto-Update System

## Overview

This system automatically updates meal package pricing whenever a macro plan's meal type pricing is modified. This ensures that meal packages always reflect the current pricing structure defined in their associated macro plans.

## How It Works

### 1. Automatic Updates

When you update a macro plan through the admin interface:

1. **Edit Macro Plan**: Click the edit button on any macro plan
2. **Update Meal Type Pricing**: Modify any of the meal type prices (breakfast, lunch, dinner, snack)
3. **Save Changes**: Click "Update Macro Plan"
4. **Automatic Sync**: The system automatically updates all associated meal packages

### 2. Pricing Calculation Logic

For each meal package associated with the updated macro plan:

- **Daily Price Calculation**: Sum of selected meal type prices

  ```
  Daily Price = (breakfast price if selected) + (lunch price if selected) +
                (dinner price if selected) + (snack price if selected)
  ```

- **Total Price Calculation**: Daily price × package duration
  ```
  Total Price = Daily Price × Package Duration (days)
  ```

### 3. Example

**Macro Plan Pricing:**

- Breakfast: $8.50
- Lunch: $12.00
- Dinner: $15.00
- Snack: $5.50

**Meal Package 1** (3 meals: breakfast, lunch, dinner, 7 days):

- Daily Price: $8.50 + $12.00 + $15.00 = $35.50
- Total Price: $35.50 × 7 = $248.50

**Meal Package 2** (4 meals: all meals, 7 days):

- Daily Price: $8.50 + $12.00 + $15.00 + $5.50 = $41.00
- Total Price: $41.00 × 7 = $287.00

## Technical Implementation

### Files Modified

1. **`src/services/mealPackages.js`**

   - Added `updatePricingFromMacroPlan()` method
   - Calculates and updates pricing for all packages of a macro plan

2. **`src/services/macroPlans.js`**

   - Modified `update()` method to trigger pricing updates
   - Uses dynamic import to avoid circular dependencies

3. **`src/pages/MacroPlans.jsx`**
   - Enhanced success message to indicate pricing synchronization
   - Already had the necessary service imports

### Key Functions

#### `mealPackagesService.updatePricingFromMacroPlan(macroPlanId, macroPlanData)`

- Gets all meal packages for the specified macro plan
- Calculates new pricing based on macro plan's meal type pricing
- Updates each package's `pricePerDay` and `price` fields
- Handles packages with different meal selections

#### `macroPlansService.update(planId, planData)`

- Updates the macro plan document
- If `mealTypePricing` is included, triggers package pricing update
- Error handling ensures macro plan update succeeds even if pricing update fails

## Manual Update Utilities

### Bulk Update All Packages

```javascript
// In browser console
updateAllMealPackagePricing();
```

### Update Specific Macro Plan Packages

```javascript
// In browser console
updateMacroPlanPricing("macro-plan-id");
```

These utilities are available in `src/utils/pricingUpdateUtils.js`.

## Testing

### Automated Test

Run the pricing calculation test:

```bash
node test/test-macro-plan-pricing-update.js
```

### Manual Testing

1. Go to Macro Plans page
2. Edit a macro plan with associated meal packages
3. Change meal type pricing values
4. Click "Update Macro Plan"
5. Verify meal packages show updated pricing
6. Check browser console for success logs

## Error Handling

- **Graceful Degradation**: If pricing update fails, the macro plan update still succeeds
- **Logging**: All pricing updates are logged to console
- **User Feedback**: Success message indicates when pricing has been synchronized

## Benefits

1. **Consistency**: Meal packages always reflect current macro plan pricing
2. **Efficiency**: No manual updates needed for meal packages
3. **Accuracy**: Eliminates pricing discrepancies
4. **Transparency**: Clear feedback when pricing is updated

## Future Enhancements

- **Batch Processing**: Optimize for macro plans with many packages
- **Pricing History**: Track pricing changes over time
- **Custom Pricing Rules**: Allow package-specific pricing overrides
- **Validation**: Ensure pricing makes sense (e.g., minimum margins)

## Troubleshooting

### Common Issues

1. **Pricing Not Updating**

   - Check if macro plan has `mealTypePricing` configured
   - Verify meal packages exist for the macro plan
   - Check browser console for errors

2. **Incorrect Calculations**

   - Verify meal package `mealSelections` are properly configured
   - Check that meal type pricing values are positive numbers

3. **Performance Issues**
   - For macro plans with many packages, updates may take a few seconds
   - Check network tab for any failed requests

### Debug Mode

Enable detailed logging by adding this to browser console:

```javascript
localStorage.setItem("debug-pricing", "true");
```
