# Removable Allergies Feature

## Overview

The **Removable Allergies** feature allows administrators to specify which allergies in a meal can be removed by customers who have those specific allergies. This provides flexibility for customers while maintaining food safety.

## How It Works

### For Administrators

1. **Meal Creation/Editing**: When creating or editing a meal, admins can:

   - Select allergies that are present in the meal
   - Choose which of those allergies are "removable" (can be safely removed by customers)

2. **Example**: A "Strawberry Smoothie Bowl" contains:
   - **Peanuts** (from peanut butter drizzle) - **REMOVABLE**
   - **Dairy** (from yogurt base) - **NOT REMOVABLE**
   - **Gluten** (from granola topping) - **NOT REMOVABLE**

### For Customers (Client-side Impact)

1. **Allergy Indication**: When customers view meals, they will see:

   - `⚠️ Contains peanuts (Removable)` - Displayed in yellow/warning color
   - `⚠️ Contains dairy` - Displayed in red/error color
   - `⚠️ Contains gluten` - Displayed in red/error color

2. **Customer Decision Making**:
   - Customer with **peanut allergy**: Can safely order this meal and remove the peanut butter
   - Customer with **dairy allergy**: Cannot safely order this meal
   - Customer with **both peanut and gluten allergies**: Cannot safely order (gluten cannot be removed)

## Database Schema Changes

### Before

```javascript
{
  id: "meal-123",
  title: "Strawberry Smoothie Bowl",
  allergies: ["peanuts", "dairy", "gluten"],
  // ... other fields
}
```

### After

```javascript
{
  id: "meal-123",
  title: "Strawberry Smoothie Bowl",
  allergies: ["peanuts", "dairy", "gluten"],
  removableAllergies: ["peanuts"], // NEW FIELD - subset of allergies
  // ... other fields
}
```

## UI Changes

### 1. Meal Editor Component

- Added **"Removable Allergies"** dropdown that appears only when allergies are selected
- Only shows allergies that are already selected for the meal
- Automatically cleans up removable allergies when main allergies are removed
- Visual distinction: removable allergies shown with warning color (yellow/orange)

### 2. Meal Preview Component

- Added section to display allergies with removable status
- Color-coded chips:
  - **Yellow/Warning**: Removable allergies
  - **Red/Error**: Non-removable allergies
- Helper text explaining the color coding

### 3. Meals List Page

- Meal cards now show allergies with removable indicators
- Format: `"Allergy Name (R)"` for removable allergies
- Compact display suitable for card view

## Technical Implementation

### Files Modified

1. **`src/configs/database-schema.js`**

   - Added `removableAllergies` field documentation

2. **`src/components/MealEditor.jsx`**

   - Added removable allergies dropdown
   - Added validation logic to keep removable allergies in sync
   - Backward compatibility for meals without the new field

3. **`src/components/MealPreview.jsx`**

   - Added allergies display section with removable status
   - Color-coded visual distinction

4. **`src/pages/Meals.jsx`**

   - Updated meal cards to show allergies with removable indicators

5. **`src/utils/allergyHelper.js`**
   - Added utility functions for managing removable allergies
   - Functions for validation, categorization, and status checking

### New Utility Functions

```javascript
import {
  isAllergyRemovable,
  categorizeAllergies,
  validateRemovableAllergies,
} from "../utils/allergyHelper";

// Check if specific allergy is removable
const removable = isAllergyRemovable("peanuts", meal);

// Get allergies categorized by removable status
const { removable, nonRemovable } = await categorizeAllergies(meal);

// Clean up removable allergies when main allergies change
const cleaned = validateRemovableAllergies(
  newAllergies,
  currentRemovableAllergies
);
```

## Migration

### For Existing Meals

All existing meals will automatically have an empty `removableAllergies` array. A migration script is provided:

```javascript
import { migrateMealsToAddRemovableAllergies } from "../utils/migrate-removable-allergies";

// Run once to add the field to existing meals
await migrateMealsToAddRemovableAllergies();
```

### Backward Compatibility

- Existing meals without `removableAllergies` field will default to empty array
- No breaking changes to existing functionality
- All allergies will be treated as non-removable until explicitly configured

## Testing

A comprehensive test file is provided at `test/test-removable-allergies.js` with:

- Example meal data
- Functionality testing
- Customer experience examples
- Form usage examples

## Usage Examples

### Admin Workflow

1. **Creating a New Meal**:

   ```
   1. Fill out basic meal info (title, description, etc.)
   2. Select allergies: ["peanuts", "dairy", "gluten"]
   3. Select removable allergies: ["peanuts"]
   4. Save meal
   ```

2. **Editing Existing Meal**:
   ```
   1. Open meal in editor
   2. Modify allergies as needed
   3. Adjust removable allergies (automatically filtered)
   4. Save changes
   ```

### Customer Experience Examples

1. **Customer with Peanut Allergy**:

   - Sees: "⚠️ Contains peanuts (Removable)"
   - Action: Can order and request peanut removal
   - Result: Safe meal

2. **Customer with Dairy Allergy**:

   - Sees: "⚠️ Contains dairy"
   - Action: Must choose different meal
   - Result: Food safety maintained

3. **Customer with Multiple Allergies**:
   - Sees: "⚠️ Contains peanuts (Removable), dairy"
   - Action: Cannot safely order (dairy not removable)
   - Result: Clear understanding of limitations

## Benefits

1. **Increased Meal Options**: Customers with certain allergies can now safely order more meals
2. **Better Communication**: Clear indication of what can and cannot be modified
3. **Food Safety**: Maintains safety by clearly marking non-removable allergies
4. **Flexibility**: Allows for meal customization where safe and practical
5. **User Experience**: Customers can make informed decisions about meal ordering

## Best Practices

1. **Conservative Approach**: Only mark allergies as removable if they can be completely and safely removed
2. **Clear Component Separation**: Removable allergies should come from distinct, optional components
3. **Staff Training**: Ensure kitchen staff understand which components can be omitted
4. **Regular Review**: Periodically review removable allergies to ensure accuracy
5. **Documentation**: Keep clear records of why certain allergies are marked as removable

## Future Enhancements

Potential future improvements could include:

- Component-level allergy tracking
- Automated removable allergy suggestions based on meal components
- Customer preference saving for consistent removal requests
- Integration with order preparation systems for automatic component exclusion
