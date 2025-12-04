# Ingredient Customization Feature

## 🎯 Overview

This feature allows administrators to enable ingredient customization for meals, letting customers choose which optional ingredients to include or remove from their orders. The system maintains essential ingredients while providing flexibility for dietary preferences and customization.

## 🏗️ Architecture

### Database Schema Updates

#### Meals Collection

```javascript
{
  // ... existing meal fields ...

  // NEW: Ingredient customization fields
  allowCustomization: boolean,        // Whether customers can customize ingredients
  customizableIngredients: [string],  // Array of ingredient IDs that can be removed

  // Example:
  allowCustomization: true,
  customizableIngredients: ["ingredient_123", "ingredient_456"], // Optional cheese, sauce, etc.
}
```

### Component Structure

1. **MealEditor.jsx** - Admin interface for setting up customization
2. **IngredientsEditor.jsx** - Shows customization status of ingredients
3. **MealIngredientCustomizer.jsx** - Client-side customization interface
4. **IngredientCustomizationDemo.jsx** - Demo page showing client experience

## 🔧 Admin Features

### Setting Up Customizable Meals

1. **Enable Customization**

   - In the Meal Editor, check "Allow Ingredient Customization"
   - This enables the customization feature for the meal

2. **Select Customizable Ingredients**

   - Once customization is enabled, admin can choose which ingredients are optional
   - Essential ingredients (like main protein, base sauce) remain unchecked
   - Optional ingredients (like cheese, extra toppings) can be checked

3. **Visual Indicators**
   - Meals with customization show a "Customizable" chip
   - Ingredient tables show status: Required, Optional, or Fixed

### Admin Interface Features

- **Meal Cards**: Show "Customizable" badge for meals with ingredient options
- **Ingredient Management**: Visual status indicators in tables
- **Preview Mode**: See how customers will experience the customization

## 👤 Client Experience

### Customization Interface

```jsx
<MealIngredientCustomizer
  meal={mealData}
  selectedIngredients={selectedIngredientIds}
  onIngredientsChange={(ingredientIds) => {
    // Handle ingredient selection changes
  }}
  showNutrition={true}
/>
```

### Features for Customers

1. **Visual Ingredient List**

   - Required ingredients: Locked with lock icon
   - Optional ingredients: Checkboxes for selection/deselection
   - Ingredient images and nutritional info

2. **Real-time Nutrition Updates**

   - Calories, protein, carbs, fat update based on selections
   - Shows impact of removing ingredients

3. **Clear Visual Feedback**
   - Selected ingredients highlighted
   - Check marks for included items
   - "Required" badges for essential ingredients

## 💡 Use Cases

### 1. Dietary Restrictions

```javascript
// Customer with dairy allergy can remove optional cheese
meal: "Chicken Caesar Salad",
customizableIngredients: ["parmesan_cheese", "caesar_dressing"],
customerSelection: ["chicken", "lettuce", "croutons"] // No cheese or dressing
```

### 2. Preference-based Customization

```javascript
// Customer doesn't like mushrooms
meal: "Vegetable Stir Fry",
customizableIngredients: ["mushrooms", "bell_peppers", "broccoli"],
customerSelection: ["bell_peppers", "broccoli"] // No mushrooms
```

### 3. Calorie Control

```javascript
// Customer wants lower calories
meal: "Pasta with Sauce",
customizableIngredients: ["parmesan", "olive_oil", "pine_nuts"],
customerSelection: ["parmesan"] // Removes high-calorie toppings
```

## 🎨 UI/UX Design

### Admin Interface

- **Toggle Switch**: Enable/disable customization
- **Ingredient Checkboxes**: Select which ingredients are customizable
- **Status Chips**: Visual indicators (Required/Optional/Fixed)
- **Preview Mode**: See customer experience

### Client Interface

- **Ingredient Cards**: Visual representation with images
- **Checkboxes**: Easy selection/deselection
- **Lock Icons**: Clear indication of required items
- **Nutrition Display**: Real-time updates
- **Summary Section**: Shows final nutritional values

## 🔄 Data Flow

### Admin Setup Flow

1. Admin creates/edits meal
2. Enables "Allow Customization"
3. Selects which ingredients are customizable
4. Saves meal with customization settings

### Customer Order Flow

1. Customer views customizable meal
2. Opens customization interface
3. Selects/deselects optional ingredients
4. Reviews updated nutrition info
5. Adds customized meal to order

### Order Processing

```javascript
// Order structure with customizations
{
  mealId: "meal_123",
  originalIngredients: ["all", "ingredient", "ids"],
  selectedIngredients: ["customer", "selected", "ids"],
  removedIngredients: ["ingredients", "customer", "removed"],
  finalNutrition: {
    calories: 450, // Updated based on selections
    protein: 35,   // Recalculated
    // ... other nutrition values
  }
}
```

## 🧪 Testing & Demo

### Demo Page Features

- **Live Customization**: Real working interface
- **Nutrition Updates**: See immediate impact
- **Multiple Meals**: Compare different customization options

### Testing Scenarios

1. **No Customization**: Meals work normally without customization
2. **Partial Customization**: Some ingredients removable, others required
3. **Full Customization**: Most ingredients optional
4. **Edge Cases**: All ingredients required (no real customization)

## 🚀 Implementation Benefits

### For Customers

- **Dietary Flexibility**: Accommodate allergies and preferences
- **Calorie Control**: Adjust portions and ingredients
- **Transparency**: See exactly what's in their meal
- **Satisfaction**: Feel in control of their dining experience

### For Business

- **Reduced Food Waste**: Only prepare what customers want
- **Higher Satisfaction**: Customers get exactly what they prefer
- **Competitive Advantage**: Stand out with customization options
- **Data Insights**: Learn customer preferences

### Technical Benefits

- **Scalable Architecture**: Easy to add new customization features
- **Real-time Updates**: Instant nutrition calculations
- **Flexible Data Model**: Supports various customization patterns
- **Performance Optimized**: Client-side calculations reduce server load

## 🔮 Future Enhancements

### Planned Features

1. **Ingredient Substitutions**: Replace ingredients instead of just removing
2. **Portion Adjustments**: Increase/decrease ingredient quantities
3. **Add-on Ingredients**: Extra ingredients for additional cost
4. **Dietary Presets**: One-click customization for common diets
5. **Nutritionist Recommendations**: AI-suggested customizations

### Advanced Customization

```javascript
// Future enhanced structure
{
  allowCustomization: true,
  customizationOptions: {
    removable: ["cheese", "sauce"],
    substitutable: {
      "chicken": ["tofu", "tempeh"],
      "wheat_pasta": ["gluten_free_pasta", "zucchini_noodles"]
    },
    adjustable: ["olive_oil", "salt"],
    addable: ["extra_vegetables", "nuts"]
  }
}
```

This ingredient customization feature provides a solid foundation for personalized dining experiences while maintaining operational efficiency and food quality standards.
