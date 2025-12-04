# riz Recipe ADMIN - MEAL COMPONENTS GUIDE

## Overview

This guide explains the new meal structure implemented to match the riz Recipe app design. The system now uses:

- **Raw Ingredients**: Text field listing all ingredients for transparency and allergy information
- **Meal Components**: Individual components with their own nutrition data and images

## Meal Structure

### Raw Ingredients

```javascript
{
  rawIngredients: "Basmati Rice, vermicelli, Onion, Garlic, Butter, Salt, Carrot, Onion, Water, Celery, Chicken, Bay Leaf, Olive Oil, Cumin, Turmeric, Black Lemon, Whipping Cream, Okra, Yogurt, Cornflour, Coriander Powder, Lemon, Paprika, Chicken Breast, Lemon";
}
```

### Meal Components

```javascript
{
  components: [
    {
      componentId: "comp_001",
      name: "Vermicelli Pilaf",
      quantity: 100,
      unit: "g",
      imageUrl: "https://storage.example.com/vermicelli-pilaf.jpg",
      nutrition: {
        calories: 290,
        protein: 12,
        carbs: 42,
        fat: 8,
        fiber: 2,
        sugar: 1,
        sodium: 200,
        cholesterol: 0
      }
    },
    {
      componentId: "comp_002",
      name: "Okra Ragout",
      quantity: 80,
      unit: "g",
      imageUrl: "https://storage.example.com/okra-ragout.jpg",
      nutrition: {
        calories: 126,
        protein: 2,
        carbs: 8,
        fat: 10,
        fiber: 3,
        sugar: 2,
        sodium: 150,
        cholesterol: 0
      }
    },
    {
      componentId: "comp_003",
      name: "Turmeric Chicken Cubes",
      quantity: 120,
      unit: "g",
      imageUrl: "https://storage.example.com/turmeric-chicken.jpg",
      nutrition: {
        calories: 204,
        protein: 34,
        carbs: 1,
        fat: 7,
        fiber: 0,
        sugar: 0,
        sodium: 180,
        cholesterol: 85
      }
    }
  ],
  // Component customization
  allowCustomization: true,
  customizableComponents: ["comp_001", "comp_002"], // Vermicelli Pilaf and Okra Ragout are optional
}
```

## User Interface Components

### 1. MealEditor.jsx

- **Raw Ingredients Field**: Multi-line text field for listing all ingredients
- **Components Management**: Button to open ComponentsEditor
- **Auto-calculated Nutrition**: Total nutrition calculated from all components

### 2. ComponentsEditor.jsx

- **Component List**: Table showing all meal components
- **Add/Edit Components**: Form to manage individual components
- **Image Upload**: Each component can have its own image
- **Nutrition Input**: Individual nutrition data per component
- **Customization Status**: Shows which components are optional/required

### 3. MealComponentCustomizer.jsx

- **Client Preview**: Shows how customers will see the meal
- **Component Selection**: Customers can check/uncheck optional components
- **Required Components**: Locked components that cannot be removed
- **Live Nutrition**: Updates nutrition totals based on selected components

### 4. Meals Page View Dialog

- **Raw Ingredients Display**: Shows ingredient text for transparency
- **Components Table**: Visual display of all meal components
- **Total Nutrition**: Calculated summary

## Admin Workflow

### 1. Create/Edit Meal

1. Enter basic meal information (title, description, type, etc.)
2. Add raw ingredients in the text field for transparency and allergy information
3. Upload main meal image
4. **Enable customization** if customers should be able to modify components
5. Click "Manage Components" to add meal components

### 2. Manage Components

1. Click "Add Component" to create a new component
2. Enter component details:
   - Name (e.g., "Vermicelli Pilaf")
   - Quantity and unit
   - Upload component image
   - Enter nutrition information
3. Save component
4. Repeat for all meal components
5. Total nutrition is automatically calculated

### 3. Configure Customization

1. In the MealEditor, check "Allow Component Customization"
2. The "Customizable Components" section will appear
3. Select which components customers can remove:
   - Essential components (like main protein) → leave unchecked
   - Optional components (like sides, sauces) → check them
4. Save the meal

### 4. Preview Customization

1. View the meal in the admin panel
2. If customization is enabled, see the "Client Customization Preview"
3. Test how customers will interact with the meal
4. Verify nutrition updates correctly when components are toggled

### 5. View Complete Meal

- Raw ingredients are displayed as text for customer transparency
- Components are shown with images and individual nutrition
- Total nutrition summary is displayed

## Benefits of New Structure

### 1. Transparency

- Complete ingredient list visible to customers
- Clear allergy and dietary information
- Matches riz Recipe app design

### 2. Visual Appeal

- Each component has its own image
- Better visual representation of meal contents
- Professional presentation

### 3. Accurate Nutrition

- Component-level nutrition tracking
- Automatic total calculation
- More precise nutritional information

### 4. Flexibility

- Easy to modify individual components
- Clear separation of concerns
- Scalable structure

### 5. Customer Customization

- Customers can remove optional components
- Required components remain locked
- Real-time nutrition updates
- Better customer satisfaction

## Customer Experience

### Fixed Meals

- All components are included
- No customization options
- Standard nutrition values

### Customizable Meals

- **Required Components**: Locked with lock icon, cannot be removed
- **Optional Components**: Checkbox to include/exclude
- **Real-time Updates**: Nutrition totals update as components are selected
- **Visual Feedback**: Selected components highlighted, deselected ones dimmed

## Example: Chicken and Okra Stew

### Raw Ingredients Text

```
Basmati Rice, vermicelli, Onion, Garlic, Butter, Salt, Carrot, Onion, Water, Celery, Chicken, Bay Leaf, Olive Oil, Cumin, Turmeric, Black Lemon, Whipping Cream, Okra, Yogurt, Cornflour, Coriander Powder, Lemon, Paprika, Chicken Breast, Lemon
```

### Components

1. **Vermicelli Pilaf** (100g) - 290 kcal, 12g Pro, 42g Carb, 8g Fat - **Required**
2. **Okra Ragout** (80g) - 126 kcal, 2g Pro, 8g Carb, 10g Fat - **Optional**
3. **Turmeric Chicken Cubes** (120g) - 204 kcal, 34g Pro, 1g Carb, 7g Fat - **Required**
4. **Lemon Wedges** (20g) - 7 kcal, 0g Pro, 1g Carb, 0g Fat - **Optional**

### Customization Settings

```javascript
allowCustomization: true,
customizableComponents: ["comp_002", "comp_004"] // Okra Ragout and Lemon Wedges
```

### Total Nutrition

- **All Components**: 627 kcal, 48g Pro, 52g Carb, 25g Fat
- **Without Optional**: 501 kcal, 46g Pro, 43g Carb, 15g Fat (if customer removes okra and lemon)

This structure provides transparency, visual appeal, and accurate nutrition tracking while matching the riz Recipe app design.
