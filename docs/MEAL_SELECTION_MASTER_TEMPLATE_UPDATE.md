# Meal Selection System - Master Template Integration

## Overview

Updated the order preparation system to use meals from the current day's menu as defined in the master month templates, instead of showing all available meals to the chef.

## Changes Made

### New Utility: `mealSelectionHelper.js`

Created a new utility file that provides functions to:

1. **Get meal options for a specific date** - Fetches the correct master month template for a macro plan and returns the available meal IDs for that day
2. **Get available meals for chef selection** - Fetches only the meals that are available on the current day for a specific meal type, filtered by user allergies
3. **Filter meals by allergies** - Removes meals that contain ingredients the user is allergic to

Key functions:

- `getMealOptionsForDate(date, macroPlanId)` - Gets meal options from master template or overrides
- `getAvailableMealsForChefSelection(date, macroPlanId, mealType, allergies)` - Gets filtered meals for one meal type
- `getAvailableMealsForPackage(date, macroPlanId, mealTypes, allergies)` - Gets meals for all meal types in a package

### Updated OrderPreparation.jsx (Tomorrow's Orders)

**Before:**

- Fetched ALL active meals from the meals collection
- Filtered only by meal type and allergies during chef selection
- Showed all available meals regardless of the day's menu

**After:**

- No longer fetches all meals on component mount
- When chef selection is triggered:
  1. Gets the user's macro plan from the order
  2. Uses tomorrow's date (since these are tomorrow's orders)
  3. Fetches the master month template for that macro plan
  4. Gets the specific day's meal options (e.g., day 24 for July 24th)
  5. Fetches only those specific meals from the database
  6. Applies allergy filtering

### Updated TodayOrders.jsx (Today's Orders)

**Before:**

- Same issues as OrderPreparation - showed all meals

**After:**

- Similar changes to OrderPreparation but uses today's date instead of tomorrow's date
- Follows the same logic to fetch only the meals available on today's menu

### Key Logic Flow

1. **Date Calculation**: Uses the current day of the month (e.g., 24 for July 24th) to map to the master template day
2. **Master Template Lookup**: Finds the default master month template for the user's macro plan
3. **Day Selection**: Gets the meal options for the specific day (day1, day2, ..., day31)
4. **Meal Fetching**: Fetches only the meal IDs that are defined for that day and meal type
5. **Allergy Filtering**: Removes meals that contain user allergies

### Database Schema Used

The system now properly utilizes:

- `masterMonthTemplates` collection - Contains the monthly meal menus for each macro plan
- `monthOverrides` collection - Allows specific date overrides (e.g., holiday menus)
- `meals` collection - Individual meal details

### Example Flow

For July 24th, High Protein macro plan, Breakfast selection:

1. Get master template for "High Protein" macro plan
2. Look up `day24` in the template's `masterDays`
3. Get `mealOptions.breakfast` array (e.g., ["meal_001", "meal_002", "meal_003"])
4. Fetch those specific meals from the meals collection
5. Filter by user allergies (e.g., remove meals with "fish" if user is allergic)
6. Show only these filtered meals in the chef selection dropdown

## Benefits

1. **Accurate Menu Control**: Chefs can only select from meals that are actually on the menu for that day
2. **Better Customer Experience**: Ensures customers receive meals from their expected daily menu
3. **Consistent with Business Logic**: Aligns with the master template system already in place
4. **Proper Allergy Handling**: Still filters out meals that contain user allergies
5. **Performance**: Only fetches the specific meals needed rather than all meals

## Testing

The system should now:

1. Show different meal options for different days based on the master template
2. Respect user allergies and filter out incompatible meals
3. Display loading states while fetching the day's menu
4. Show helpful information about which day's menu is being used

## Future Enhancements

- Could add caching of master templates to improve performance
- Could add preview of upcoming days' menus
- Could add admin alerts when meals in templates are missing or inactive
