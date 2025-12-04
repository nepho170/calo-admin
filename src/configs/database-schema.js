/**
 * riz Recipe ADMIN - FIRESTORE DATABASE SCHEMA
 * Complete database structure for meal planning admin dashboard
 */

// 1. INGREDIENTS COLLECTION - Master ingredient database

// 2. ALLERGIES COLLECTION - Common food allergies
export const allergiesSchema = {
    allergyId: {
        name: "string", // "Peanuts", "Fish", "Dairy", "Gluten"
        icon: "string", // "🥜", "🐟", "🥛", "🌾"
        isActive: "boolean",
        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string" // admin user ID
    }
};

// 3. LABELS COLLECTION - Reusable dietary and health labels
export const labelsSchema = {
    labelId: {
        name: "string", // "Gluten Free"
        isActive: "boolean",
        order: "number", // Display order
        createdAt: "timestamp",
        updatedAt: "timestamp"
    }
};

// 4. MEALS COLLECTION - Individual meal items
export const mealsSchema = {
    mealId: {
        title: "string", // "Grilled Salmon with Quinoa"
        description: "string", // "Fresh Atlantic salmon with herb quinoa and roasted vegetables"
        type: "breakfast | lunch | dinner | snack",
        image: "string", // URL to meal photo
        dietaryCategories: ["array"], // ["fish", "gluten_free", "meat", "dairy"] - For filtering
        labels: ["array"], // ["gluten_free", "high_protein", "dairy_free"] - references to labelIds
        allergies: ["array"], // ["allergyId1", "allergyId2"] - references to allergy IDs
        removableAllergies: ["array"], // ["allergyId1", "allergyId3"] - subset of allergies that can be removed

        // Raw ingredients for transparency and allergies
        rawIngredients: "string", // "Basmati Rice, vermicelli, Onion, Garlic, Butter, Salt, Carrot, Onion, Water, Celery, Chicken, Bay Leaf, Olive Oil, Cumin, Turmeric, Black Lemon, Whipping Cream, Okra, Yogurt, Cornflour, Coriander Powder, Lemon, Paprika, Chicken Breast, Lemon"

        // Meal components with their own nutrition and images
        components: [
            {
                componentId: "string", // Unique component ID
                name: "string", // "Vermicelli Pilaf", "Okra Ragout", "Turmeric Chicken Cubes"
                quantity: "number", // 150
                unit: "string", // "grams"
                imageUrl: "string", // URL to component photo
                nutrition: {
                    calories: "number", // calculated for this quantity
                    protein: "number",
                    carbs: "number",
                    fat: "number",
                    fiber: "number",
                    sugar: "number",
                    sodium: "number",
                    cholesterol: "number"
                },
                isRequired: "boolean", // Whether this component is required (cannot be removed)
                isOptional: "boolean"  // Whether this component is optional (can be removed)
            }
        ],
        totalNutrition: {
            calories: "number", // sum of all components
            protein: "number",
            carbs: "number",
            fat: "number",
            fiber: "number",
            sugar: "number",
            sodium: "number",
            cholesterol: "number"
        },

        isActive: "boolean",
        isFeatured: "boolean", // Show in featured meals

        // Component customization fields
        allowCustomization: "boolean", // Whether customers can customize components for this meal
        customizableComponents: ["array"], // Array of component IDs that customers can remove

        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string" // admin user ID
    }
};

// 5. MACRO PLANS COLLECTION - High Protein, Balanced, etc.
export const macroPlansSchema = {
    planId: {
        title: "string", // "High Protein"
        description: "string", // "Powerhouse diet for muscle building and weight management"
        macroPercentages: {
            protein: "number", // 45%
            carbs: "number", // 35%
            fat: "number" // 20%
        },
        startingCostPerDay: "number", // taken from mealPackagesSchema the lowest price package for this macro plan
        image: "string", // Plan illustration/photo
        isRecommended: "boolean", // Show "Recommended" badge
        targetGoals: ["array"], // ["build_muscle", "lose_weight", "gain_weight", "maintain_weight"]
        targetAudience: ["array"], // ["athletes", "beginners", "professionals", "seniors"]
        isActive: "boolean",
        order: "number", // Display order

        // --- MEAL TYPE PRICING ---
        mealTypePricing: {
            breakfast: "number", // Price for a single breakfast in this macro plan
            lunch: "number",    // Price for a single lunch in this macro plan
            dinner: "number",   // Price for a single dinner in this macro plan
            snack: "number"     // Price for a single snack in this macro plan
        },
        // --- MEAL TYPE CALORIES (RANGE) ---
        mealTypeCalories: {
            breakfast: { min: "number", max: "number" }, // Calorie range for breakfast
            lunch: { min: "number", max: "number" },    // Calorie range for lunch
            dinner: { min: "number", max: "number" },   // Calorie range for dinner
            snack: { min: "number", max: "number" }     // Calorie range for snack
        },

        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string"
    }
};

// 6. MEAL PACKAGES COLLECTION - What portion of each day's menu they receive
export const mealPackagesSchema = {
    packageId: {
        macroPlanId: "string", // Reference to macro plan
        title: "string", // "Breakfast, Lunch & Dinner"
        description: "string", // "Complete daily nutrition"
        image: "string", // URL to package photo/illustration
        includedMealTypes: ["array"], // ["breakfast", "lunch", "dinner"] - Which meals from daily plan
        calorieRange: {
            min: "number", // 1800 - calculated based on macro plan and meal types
            max: "number" // 2200 - calculated based on macro plan and meal types
        },
        pricePerDay: "number", // 105.3 - Admin sets price
        isPopular: "boolean", // Most popular badge
        order: "number", // Display order

        // Additional fields for React Native client compatibility

        features: ["array"], // Package features like ["High protein", "Gluten-free"]
        isCustom: "boolean", // false for predetermined packages, true for custom packages
        customMealQuantities: "object", // null for predetermined packages, contains quantities for custom packages
        isAutoCalculated: "boolean", // Whether calorie range is auto-calculated

        isActive: "boolean",
        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string"
    }
};

// 7. DIETARY FILTERS COLLECTION - Customer filtering options
export const dietaryFiltersSchema = {
    filterId: {
        name: "string", // "No Fish"
        filterKey: "string", // "fish" - Matches meal.dietaryCategories
        icon: "string", // "🐟"
        description: "string", // "Excludes all fish and seafood meals"
        isActive: "boolean",
        order: "number",
        createdAt: "timestamp",
        updatedAt: "timestamp"
    }
};

// 8. MASTER MONTH TEMPLATES COLLECTION - One master month that repeats forever
export const masterMonthTemplatesSchema = {
    templateId: {
        macroPlanId: "string", // Which macro plan this belongs to
        templateName: "string", // "High Protein Master Month"
        description: "string", // "Standard 31-day template that repeats monthly"

        // 31 days to cover all possible month lengths
        masterDays: {
            day1: {
                dayLabel: "string", // "Day 1" or custom name like "Protein Focus Monday"
                mealOptions: {
                    breakfast: ["array"], // ["meal_id_1", "meal_id_2", "meal_id_3"]
                    lunch: ["array"], // ["meal_id_4", "meal_id_5"] 
                    dinner: ["array"], // ["meal_id_6", "meal_id_7"]
                    snack: ["array"] // ["meal_id_8", "meal_id_9"]
                }
            },
            day2: {
                dayLabel: "string",
                mealOptions: {
                    breakfast: ["array"],
                    lunch: ["array"],
                    dinner: ["array"],
                    snack: ["array"]
                }
            },
            // ... continues up to day31
            day31: {
                dayLabel: "string",
                mealOptions: {
                    breakfast: ["array"],
                    lunch: ["array"],
                    dinner: ["array"],
                    snack: ["array"]
                }
            }
        },

        // Admin management
        isActive: "boolean",
        isDefault: "boolean", // Whether this is the default template for the macro plan
        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string" // admin user ID
    }
};

// 9. MONTH OVERRIDES COLLECTION - Special date customizations
export const monthOverridesSchema = {
    overrideId: {
        macroPlanId: "string", // Which macro plan this override applies to
        date: "string", // "2024-12-25" - specific date override
        reason: "string", // "Christmas Special Menu", "Holiday Variation"

        // Custom meal options for this specific date
        customMealOptions: {
            breakfast: ["array"], // ["holiday_meal_1", "holiday_meal_2"]
            lunch: ["array"], // ["holiday_meal_3"]
            dinner: ["array"], // ["holiday_meal_4", "holiday_meal_5"]
            snack: ["array"] // ["holiday_meal_6"]
        },

        // Admin management
        isActive: "boolean",
        createdAt: "timestamp",
        updatedAt: "timestamp",
        createdBy: "string" // admin user ID
    }
};

// 11. ADMIN USERS COLLECTION - Admin dashboard users
export const adminUsersSchema = {
    userId: {
        email: "string",
        displayName: "string",
        role: "super_admin | admin | nutritionist | content_creator",
        permissions: ["array"], // ["create_meals", "edit_plans", "manage_users", "view_analytics"]
        isActive: "boolean",
        lastLogin: "timestamp",
        createdAt: "timestamp",
        updatedAt: "timestamp"
    }
};

// 12. SYSTEM SETTINGS COLLECTION - App-wide settings
export const systemSettingsSchema = {
    settingId: {
        key: "string", // "default_currency", "max_upload_size", "featured_meal_limit"
        value: "any", // "USD", 5242880, 10
        type: "string | number | boolean | array | object",
        description: "string", // "Default currency for pricing"
        category: "pricing | media | features | limits",
        isPublic: "boolean", // Whether this setting is visible to non-admin users
        updatedAt: "timestamp",
        updatedBy: "string"
    }
};

// 13. ACTIVITY LOGS COLLECTION - Admin actions tracking
export const activityLogsSchema = {
    logId: {
        userId: "string", // Admin who performed the action
        action: "string", // "created_meal", "updated_plan", "deleted_ingredient"
        entityType: "string", // "meal", "plan", "ingredient", "user"
        entityId: "string", // ID of the affected entity
        entityTitle: "string", // Title/name of the affected entity
        changes: "object", // { field: { old: "value", new: "value" } }
        timestamp: "timestamp",
        ipAddress: "string",
        userAgent: "string"
    }
};

// FIRESTORE SECURITY RULES REFERENCE
export const securityRulesReference = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin users only
    match /adminUsers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // All collections require admin authentication
    match /{collection}/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isActive == true;
    }
  }
}
`;

// COLLECTION NAMES CONSTANTS
export const COLLECTIONS = {

    LABELS: 'labels',
    MEALS: 'meals',
    MACRO_PLANS: 'macroPlans',
    MEAL_PACKAGES: 'mealPackages',
    DIETARY_FILTERS: 'dietaryFilters',
    MASTER_MONTH_TEMPLATES: 'masterMonthTemplates',
    MONTH_OVERRIDES: 'monthOverrides',
    ADMIN_USERS: 'adminUsers',
    SYSTEM_SETTINGS: 'systemSettings',
    ACTIVITY_LOGS: 'activityLogs',
    ALLERGIES: 'allergies'
};
