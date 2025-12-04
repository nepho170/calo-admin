import { labelsService } from '../services/labels';
import { allergiesService } from '../services/allergies';
import { mealsService } from '../services/meals';
import { macroPlansService } from '../services/macroPlans';
import { mealPackagesService } from '../services/mealPackages';
import { masterMonthTemplatesService } from '../services/masterMonthTemplates';
import { monthOverridesService } from '../services/monthOverrides';
import { getAllDietaryFilters } from '../services/dietaryFilters';
import { batchOperations } from '../services/firestore';

// ========== SAMPLE DATA ==========

// Sample Labels
const sampleLabels = [
    {
        name: "Gluten Free",
        icon: "🌾",
        color: "#4CAF50",
        category: "dietary",
        description: "Contains no gluten ingredients",
        order: 1
    },
    {
        name: "High Protein",
        icon: "💪",
        color: "#FF5722",
        category: "health",
        description: "Rich in protein content",
        order: 2
    },
    {
        name: "Dairy Free",
        icon: "🥛",
        color: "#2196F3",
        category: "dietary",
        description: "No dairy products",
        order: 3
    },
    {
        name: "Vegan",
        icon: "🌱",
        color: "#8BC34A",
        category: "lifestyle",
        description: "Plant-based ingredients only",
        order: 4
    },
    {
        name: "Keto Friendly",
        icon: "🥑",
        color: "#9C27B0",
        category: "health",
        description: "Low carb, high fat",
        order: 5
    },
    {
        name: "Low Sodium",
        icon: "🧂",
        color: "#607D8B",
        category: "health",
        description: "Reduced sodium content",
        order: 6
    }
];

// Sample Allergies
const sampleAllergies = [
    {
        name: "Peanuts",
        icon: "🥜"
    },
    {
        name: "Tree Nuts",
        icon: "🌰"
    },
    {
        name: "Fish",
        icon: "🐟"
    },
    {
        name: "Shellfish",
        icon: "🦐"
    },
    {
        name: "Dairy",
        icon: "🥛"
    },
    {
        name: "Eggs",
        icon: "🥚"
    },
    {
        name: "Soy",
        icon: "🌱"
    },
    {
        name: "Gluten",
        icon: "🌾"
    },
    {
        name: "Sesame",
        icon: "🧈"
    }
];

// Sample Meals (ingredients are now managed as subcollections within each meal)
const sampleMeals = [
    {
        title: "Grilled Chicken with Quinoa",
        description: "Perfectly seasoned grilled chicken breast served with fluffy quinoa and steamed broccoli",
        type: "lunch",
        // NEW: Enable customization for this meal
        allowCustomization: true,
        // Main protein is required, sides are optional
        customizableIngredients: ["ingredient_broccoli_001", "ingredient_quinoa_001"],
        ingredients: [
            {
                ingredientId: "ingredient_chicken_001", // Unique ID for ingredient
                name: "Chicken Breast",
                quantity: 150,
                unit: "grams",
                nutrition: {
                    calories: 248,
                    protein: 46.5,
                    carbs: 0,
                    fat: 5.4,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                ingredientId: "ingredient_quinoa_001",
                name: "Quinoa",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 294,
                    protein: 11.2,
                    carbs: 51.2,
                    fat: 4.8,
                    fiber: 5.6,
                    sugar: 0
                }
            },
            {
                ingredientId: "ingredient_broccoli_001",
                name: "Broccoli",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 34,
                    protein: 2.8,
                    carbs: 7,
                    fat: 0.4,
                    fiber: 2.6,
                    sugar: 1.5
                }
            }
        ],
        totalNutrition: {
            calories: 576,
            protein: 60.5,
            carbs: 58.2,
            fat: 10.6,
            fiber: 8.2,
            sugar: 1.5,
            sodium: 140,
            cholesterol: 85
        },
        labels: ["high_protein", "gluten_free"],
        preparationTime: 15,
        cookingTime: 25,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Season chicken breast with salt, pepper, and herbs",
            "Grill chicken for 6-8 minutes per side until internal temperature reaches 165°F",
            "Cook quinoa according to package directions",
            "Steam broccoli for 5-7 minutes until tender-crisp",
            "Serve hot and enjoy!"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Salmon Avocado Bowl",
        description: "Fresh salmon with creamy avocado over brown rice with a side of mixed greens",
        type: "dinner",
        ingredients: [
            {
                name: "Salmon Fillet",
                quantity: 120,
                unit: "grams",
                nutrition: {
                    calories: 250,
                    protein: 30,
                    carbs: 0,
                    fat: 14.4,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name: "Brown Rice",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 217,
                    protein: 4.2,
                    carbs: 43.2,
                    fat: 1.8,
                    fiber: 2.4,
                    sugar: 0.2
                }
            },
            {
                name: "Avocado",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 128,
                    protein: 1.6,
                    carbs: 7.2,
                    fat: 12,
                    fiber: 5.6,
                    sugar: 0.6
                }
            }
        ],
        totalNutrition: {
            calories: 595,
            protein: 35.8,
            carbs: 50.4,
            fat: 28.2,
            fiber: 8,
            sugar: 0.8,
            sodium: 55,
            cholesterol: 55
        },
        labels: ["high_protein", "gluten_free"],
        preparationTime: 10,
        cookingTime: 15,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Cook brown rice according to package directions",
            "Season salmon with salt, pepper, and lemon",
            "Pan-sear salmon for 4-5 minutes per side",
            "Slice avocado and arrange over rice",
            "Top with salmon and serve immediately"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Greek Yogurt Parfait",
        description: "Creamy Greek yogurt layered with fresh berries and crunchy almonds",
        type: "breakfast",
        // NEW: Allow customization - almonds can be removed for nut allergies
        allowCustomization: true,
        customizableIngredients: ["ingredient_almonds_001"], // Nuts are optional for allergies
        ingredients: [
            {
                ingredientId: "ingredient_greek_yogurt_001",
                name: "Greek Yogurt",
                quantity: 200,
                unit: "grams",
                nutrition: {
                    calories: 194,
                    protein: 18,
                    carbs: 8,
                    fat: 10,
                    fiber: 0,
                    sugar: 8
                }
            },
            {
                ingredientId: "ingredient_almonds_001", // Optional - can be removed for nut allergies
                name: "Almonds",
                quantity: 20,
                unit: "grams",
                nutrition: {
                    calories: 116,
                    protein: 4.2,
                    carbs: 4.4,
                    fat: 10,
                    fiber: 2.4,
                    sugar: 0.8
                }
            }
        ],
        totalNutrition: {
            calories: 310,
            protein: 22.2,
            carbs: 12.4,
            fat: 20,
            fiber: 2.4,
            sugar: 8.8,
            sodium: 70,
            cholesterol: 20
        },
        labels: ["high_protein", "gluten_free"],
        preparationTime: 5,
        cookingTime: 0,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Layer Greek yogurt in a bowl or glass",
            "Add fresh berries if available",
            "Top with chopped almonds",
            "Serve immediately"
        ],
        isActive: true,
        isFeatured: false
    },
    {
        title: "Mediterranean Chickpea Salad",
        description: "Fresh and vibrant salad with chickpeas, tomatoes, cucumber, and olive oil dressing",
        type: "lunch",
        dietaryCategories: ["vegetarian", "vegan", "dairy_free"],
        // NEW: Enable customization - feta cheese and olive oil are optional
        allowCustomization: true,
        customizableIngredients: ["ingredient_feta_001", "ingredient_olive_oil_001"],
        ingredients: [
            {
                ingredientId: "ingredient_chickpeas_001",
                name: "Chickpeas",
                quantity: 150,
                unit: "grams",
                nutrition: {
                    calories: 246,
                    protein: 12.6,
                    carbs: 40.5,
                    fat: 3.9,
                    fiber: 9.9,
                    sugar: 1.5
                }
            },
            {
                ingredientId: "ingredient_tomatoes_001",
                name: "Cherry Tomatoes",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 18,
                    protein: 0.9,
                    carbs: 3.9,
                    fat: 0.2,
                    fiber: 1.2,
                    sugar: 2.6
                }
            },
            {
                ingredientId: "ingredient_cucumber_001",
                name: "Cucumber",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 16,
                    protein: 0.7,
                    carbs: 4.0,
                    fat: 0.1,
                    fiber: 0.5,
                    sugar: 1.7
                }
            },
            {
                ingredientId: "ingredient_olive_oil_001", // Optional - can be removed for lower calories
                name: "Extra Virgin Olive Oil",
                quantity: 15,
                unit: "ml",
                nutrition: {
                    calories: 134,
                    protein: 0,
                    carbs: 0,
                    fat: 15,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                ingredientId: "ingredient_feta_001", // Optional - can be removed for vegan option
                name: "Feta Cheese",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 80,
                    protein: 4.3,
                    carbs: 1.2,
                    fat: 6.4,
                    fiber: 0,
                    sugar: 1.2
                }
            }
        ],
        totalNutrition: {
            calories: 494,
            protein: 18.5,
            carbs: 49.6,
            fat: 25.6,
            fiber: 11.6,
            sugar: 7.0,
            sodium: 420,
            cholesterol: 25
        },
        labels: ["vegetarian", "mediterranean", "high_fiber"],
        preparationTime: 15,
        cookingTime: 0,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Drain and rinse chickpeas",
            "Dice tomatoes and cucumber",
            "Combine chickpeas, tomatoes, and cucumber in a bowl",
            "Whisk olive oil with lemon juice, salt, and pepper",
            "Toss salad with dressing and top with crumbled feta",
            "Let flavors meld for 10 minutes before serving"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Beef Stir-Fry with Vegetables",
        description: "Tender beef strips with colorful vegetables in a savory Asian-inspired sauce",
        type: "dinner",
        dietaryCategories: ["meat", "dairy_free"],
        ingredients: [
            {
                name: "Beef Sirloin",
                quantity: 120,
                unit: "grams",
                nutrition: {
                    calories: 232,
                    protein: 29.9,
                    carbs: 0,
                    fat: 11.8,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name: "Bell Peppers",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 31,
                    protein: 1.0,
                    carbs: 7.3,
                    fat: 0.3,
                    fiber: 2.5,
                    sugar: 4.2
                }
            },
            {
                name: "Snap Peas",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 34,
                    protein: 2.2,
                    carbs: 6.2,
                    fat: 0.2,
                    fiber: 2.1,
                    sugar: 3.4
                }
            },
            {
                name: "Brown Rice",
                quantity: 70,
                unit: "grams",
                nutrition: {
                    calories: 254,
                    protein: 4.9,
                    carbs: 50.4,
                    fat: 2.1,
                    fiber: 2.8,
                    sugar: 0.2
                }
            },
            {
                name: "Sesame Oil",
                quantity: 10,
                unit: "ml",
                nutrition: {
                    calories: 88,
                    protein: 0,
                    carbs: 0,
                    fat: 10,
                    fiber: 0,
                    sugar: 0
                }
            }
        ],
        totalNutrition: {
            calories: 639,
            protein: 38,
            carbs: 63.9,
            fat: 24.4,
            fiber: 7.4,
            sugar: 7.8,
            sodium: 380,
            cholesterol: 75
        },
        labels: ["high_protein", "dairy_free", "asian_inspired"],
        preparationTime: 20,
        cookingTime: 15,
        servings: 1,
        difficulty: "medium",
        instructions: [
            "Cut beef into thin strips against the grain",
            "Prepare vegetables by cutting into bite-sized pieces",
            "Cook brown rice according to package directions",
            "Heat sesame oil in a wok or large skillet",
            "Stir-fry beef for 3-4 minutes until browned",
            "Add vegetables and stir-fry for 4-5 minutes",
            "Season with soy sauce and serve over rice"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Overnight Chia Pudding",
        description: "Creamy overnight pudding with chia seeds, almond milk, and fresh fruits",
        type: "breakfast",
        dietaryCategories: ["vegetarian", "vegan", "dairy_free", "gluten_free"],
        ingredients: [
            {
                name: "Chia Seeds",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 146,
                    protein: 5.1,
                    carbs: 11.4,
                    fat: 9.3,
                    fiber: 9.6,
                    sugar: 0
                }
            },
            {
                name: "Almond Milk",
                quantity: 200,
                unit: "ml",
                nutrition: {
                    calories: 32,
                    protein: 1.2,
                    carbs: 3.2,
                    fat: 2.4,
                    fiber: 0.8,
                    sugar: 2.8
                }
            },
            {
                name: "Maple Syrup",
                quantity: 15,
                unit: "ml",
                nutrition: {
                    calories: 52,
                    protein: 0,
                    carbs: 13.4,
                    fat: 0,
                    fiber: 0,
                    sugar: 12.1
                }
            },
            {
                name: "Blueberries",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 34,
                    protein: 0.4,
                    carbs: 8.6,
                    fat: 0.2,
                    fiber: 1.4,
                    sugar: 5.8
                }
            },
            {
                name: "Sliced Almonds",
                quantity: 15,
                unit: "grams",
                nutrition: {
                    calories: 87,
                    protein: 3.2,
                    carbs: 3.3,
                    fat: 7.5,
                    fiber: 1.8,
                    sugar: 0.6
                }
            }
        ],
        totalNutrition: {
            calories: 351,
            protein: 9.9,
            carbs: 39.9,
            fat: 19.4,
            fiber: 13.6,
            sugar: 21.3,
            sodium: 95,
            cholesterol: 0
        },
        labels: ["vegan", "gluten_free", "high_fiber", "dairy_free"],
        preparationTime: 10,
        cookingTime: 0,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Mix chia seeds with almond milk in a jar",
            "Add maple syrup and stir well",
            "Refrigerate overnight or at least 4 hours",
            "Stir mixture halfway through if possible",
            "Top with blueberries and sliced almonds before serving",
            "Enjoy cold straight from the fridge"
        ],
        isActive: true,
        isFeatured: false
    },
    {
        title: "Turkey and Avocado Wrap",
        description: "Lean turkey breast with fresh avocado and vegetables in a whole wheat tortilla",
        type: "lunch",
        dietaryCategories: ["meat", "dairy_free"],
        ingredients: [
            {
                name: "Turkey Breast",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 189,
                    protein: 29,
                    carbs: 0,
                    fat: 7.4,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name: "Whole Wheat Tortilla",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 174,
                    protein: 5.4,
                    carbs: 28.8,
                    fat: 4.2,
                    fiber: 3.6,
                    sugar: 0.6
                }
            },
            {
                name: "Avocado",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 96,
                    protein: 1.2,
                    carbs: 5.4,
                    fat: 9,
                    fiber: 4.2,
                    sugar: 0.4
                }
            },
            {
                name: "Lettuce",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 4,
                    protein: 0.4,
                    carbs: 0.8,
                    fat: 0.1,
                    fiber: 0.4,
                    sugar: 0.2
                }
            },
            {
                name: "Tomato",
                quantity: 50,
                unit: "grams",
                nutrition: {
                    calories: 9,
                    protein: 0.4,
                    carbs: 1.9,
                    fat: 0.1,
                    fiber: 0.6,
                    sugar: 1.3
                }
            }
        ],
        totalNutrition: {
            calories: 472,
            protein: 36.4,
            carbs: 36.9,
            fat: 20.8,
            fiber: 8.8,
            sugar: 2.5,
            sodium: 420,
            cholesterol: 70
        },
        labels: ["high_protein", "dairy_free", "portable"],
        preparationTime: 10,
        cookingTime: 0,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Lay the tortilla flat on a clean surface",
            "Slice the turkey breast into thin pieces",
            "Mash half the avocado and spread on tortilla",
            "Layer turkey, lettuce, tomato, and remaining avocado",
            "Season with salt, pepper, and lemon juice",
            "Roll tightly and cut in half diagonally"
        ],
        isActive: true,
        isFeatured: false
    },
    {
        title: "Vegetable Lentil Curry",
        description: "Hearty and warming curry with red lentils, vegetables, and aromatic spices",
        type: "dinner",
        dietaryCategories: ["vegetarian", "vegan", "dairy_free", "gluten_free"],
        ingredients: [
            {
                name: "Red Lentils",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 293,
                    protein: 22.4,
                    carbs: 48,
                    fat: 1.6,
                    fiber: 7.2,
                    sugar: 1.6
                }
            },
            {
                name: "Sweet Potato",
                quantity: 120,
                unit: "grams",
                nutrition: {
                    calories: 103,
                    protein: 2.3,
                    carbs: 24,
                    fat: 0.1,
                    fiber: 3.6,
                    sugar: 6.8
                }
            },
            {
                name: "Spinach",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 14,
                    protein: 1.7,
                    carbs: 2.2,
                    fat: 0.2,
                    fiber: 1.3,
                    sugar: 0.3
                }
            },
            {
                name: "Coconut Milk",
                quantity: 100,
                unit: "ml",
                nutrition: {
                    calories: 230,
                    protein: 2.3,
                    carbs: 6,
                    fat: 23.8,
                    fiber: 2.2,
                    sugar: 3.3
                }
            },
            {
                name: "Basmati Rice",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 216,
                    protein: 4.8,
                    carbs: 44.4,
                    fat: 0.6,
                    fiber: 0.6,
                    sugar: 0.2
                }
            }
        ],
        totalNutrition: {
            calories: 856,
            protein: 33.5,
            carbs: 124.6,
            fat: 26.3,
            fiber: 14.9,
            sugar: 12.2,
            sodium: 280,
            cholesterol: 0
        },
        labels: ["vegan", "gluten_free", "high_protein", "high_fiber"],
        preparationTime: 15,
        cookingTime: 30,
        servings: 1,
        difficulty: "medium",
        instructions: [
            "Rinse red lentils until water runs clear",
            "Cube sweet potato into small pieces",
            "Sauté onions and garlic with curry spices",
            "Add lentils, sweet potato, and vegetable broth",
            "Simmer for 20 minutes until lentils are soft",
            "Stir in coconut milk and spinach",
            "Cook rice separately and serve curry over rice"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Quinoa Buddha Bowl",
        description: "Nutritious bowl with quinoa, roasted vegetables, chickpeas, and tahini dressing",
        type: "lunch",
        dietaryCategories: ["vegetarian", "vegan", "gluten_free", "dairy_free"],
        ingredients: [
            {
                name: "Quinoa",
                quantity: 75,
                unit: "grams",
                nutrition: {
                    calories: 275,
                    protein: 10.5,
                    carbs: 48,
                    fat: 4.5,
                    fiber: 5.2,
                    sugar: 0
                }
            },
            {
                name: "Roasted Sweet Potato",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 86,
                    protein: 1.9,
                    carbs: 20,
                    fat: 0.1,
                    fiber: 3,
                    sugar: 5.7
                }
            },
            {
                name: "Chickpeas",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 131,
                    protein: 6.7,
                    carbs: 21.6,
                    fat: 2.1,
                    fiber: 5.3,
                    sugar: 0.8
                }
            },
            {
                name: "Kale",
                quantity: 50,
                unit: "grams",
                nutrition: {
                    calories: 22,
                    protein: 2.2,
                    carbs: 4.4,
                    fat: 0.3,
                    fiber: 2,
                    sugar: 0.8
                }
            },
            {
                name: "Tahini",
                quantity: 20,
                unit: "grams",
                nutrition: {
                    calories: 119,
                    protein: 3.4,
                    carbs: 4.2,
                    fat: 10.6,
                    fiber: 1.4,
                    sugar: 0.2
                }
            },
            {
                name: "Pumpkin Seeds",
                quantity: 15,
                unit: "grams",
                nutrition: {
                    calories: 84,
                    protein: 4.2,
                    carbs: 2.2,
                    fat: 7.2,
                    fiber: 0.6,
                    sugar: 0.2
                }
            }
        ],
        totalNutrition: {
            calories: 717,
            protein: 28.9,
            carbs: 100.4,
            fat: 24.8,
            fiber: 17.5,
            sugar: 7.7,
            sodium: 320,
            cholesterol: 0
        },
        labels: ["vegan", "gluten_free", "high_fiber", "superfood"],
        preparationTime: 20,
        cookingTime: 25,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Cook quinoa according to package directions",
            "Roast sweet potato cubes at 400°F for 20 minutes",
            "Massage kale with lemon juice and olive oil",
            "Drain and rinse chickpeas",
            "Arrange quinoa, sweet potato, chickpeas, and kale in bowl",
            "Drizzle with tahini dressing and top with pumpkin seeds"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Protein Power Smoothie",
        description: "Energizing smoothie with protein powder, banana, spinach, and almond butter",
        type: "breakfast",
        dietaryCategories: ["vegetarian", "gluten_free"],
        ingredients: [
            {
                name: "Protein Powder (Vanilla)",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 110,
                    protein: 25,
                    carbs: 2,
                    fat: 1,
                    fiber: 1,
                    sugar: 1
                }
            },
            {
                name: "Banana",
                quantity: 120,
                unit: "grams",
                nutrition: {
                    calories: 107,
                    protein: 1.3,
                    carbs: 27.5,
                    fat: 0.4,
                    fiber: 3.1,
                    sugar: 14.4
                }
            },
            {
                name: "Baby Spinach",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 7,
                    protein: 0.9,
                    carbs: 1.1,
                    fat: 0.1,
                    fiber: 0.7,
                    sugar: 0.1
                }
            },
            {
                name: "Almond Butter",
                quantity: 20,
                unit: "grams",
                nutrition: {
                    calories: 119,
                    protein: 4.4,
                    carbs: 4.4,
                    fat: 11,
                    fiber: 2.4,
                    sugar: 1.2
                }
            },
            {
                name: "Unsweetened Almond Milk",
                quantity: 250,
                unit: "ml",
                nutrition: {
                    calories: 40,
                    protein: 1.5,
                    carbs: 4,
                    fat: 3,
                    fiber: 1,
                    sugar: 3.5
                }
            },
            {
                name: "Ice Cubes",
                quantity: 50,
                unit: "grams",
                nutrition: {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    fiber: 0,
                    sugar: 0
                }
            }
        ],
        totalNutrition: {
            calories: 383,
            protein: 33.1,
            carbs: 39,
            fat: 15.5,
            fiber: 8.2,
            sugar: 20.2,
            sodium: 180,
            cholesterol: 0
        },
        labels: ["high_protein", "gluten_free", "quick", "post_workout"],
        preparationTime: 5,
        cookingTime: 0,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Add almond milk to blender first",
            "Add protein powder and blend until smooth",
            "Add banana, spinach, and almond butter",
            "Add ice cubes and blend until creamy",
            "Pour into glass and serve immediately",
            "Garnish with sliced banana if desired"
        ],
        isActive: true,
        isFeatured: false
    },
    {
        title: "Herb-Crusted Cod with Quinoa",
        description: "Flaky white fish with herbs and lemon, served with fluffy quinoa and green beans",
        type: "dinner",
        dietaryCategories: ["pescatarian", "gluten_free", "dairy_free"],
        ingredients: [
            {
                name: "Cod Fillet",
                quantity: 150,
                unit: "grams",
                nutrition: {
                    calories: 135,
                    protein: 29.4,
                    carbs: 0,
                    fat: 1.1,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name: "Quinoa",
                quantity: 70,
                unit: "grams",
                nutrition: {
                    calories: 257,
                    protein: 9.8,
                    carbs: 44.8,
                    fat: 4.2,
                    fiber: 4.9,
                    sugar: 0
                }
            },
            {
                name: "Green Beans",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 35,
                    protein: 1.8,
                    carbs: 8.1,
                    fat: 0.1,
                    fiber: 2.7,
                    sugar: 3.3
                }
            },
            {
                name: "Fresh Herbs (Parsley, Dill)",
                quantity: 10,
                unit: "grams",
                nutrition: {
                    calories: 3,
                    protein: 0.3,
                    carbs: 0.6,
                    fat: 0.1,
                    fiber: 0.3,
                    sugar: 0.1
                }
            },
            {
                name: "Lemon",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 5,
                    protein: 0.2,
                    carbs: 1.6,
                    fat: 0.1,
                    fiber: 0.5,
                    sugar: 0.5
                }
            },
            {
                name: "Olive Oil",
                quantity: 10,
                unit: "ml",
                nutrition: {
                    calories: 89,
                    protein: 0,
                    carbs: 0,
                    fat: 10,
                    fiber: 0,
                    sugar: 0
                }
            }
        ],
        totalNutrition: {
            calories: 524,
            protein: 41.5,
            carbs: 55.1,
            fat: 15.6,
            fiber: 8.4,
            sugar: 3.9,
            sodium: 95,
            cholesterol: 60
        },
        labels: ["high_protein", "gluten_free", "omega_3", "low_sodium"],
        preparationTime: 15,
        cookingTime: 20,
        servings: 1,
        difficulty: "medium",
        instructions: [
            "Preheat oven to 400°F (200°C)",
            "Season cod with salt, pepper, and herbs",
            "Drizzle with olive oil and lemon juice",
            "Bake for 12-15 minutes until fish flakes easily",
            "Cook quinoa according to package directions",
            "Steam green beans for 5-7 minutes until tender",
            "Serve fish over quinoa with green beans on the side"
        ],
        isActive: true,
        isFeatured: true
    },
    {
        title: "Mexican Black Bean Quesadilla",
        description: "Crispy tortilla filled with black beans, cheese, peppers, and served with salsa",
        type: "lunch",
        dietaryCategories: ["vegetarian"],
        ingredients: [
            {
                name: "Whole Wheat Tortillas",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 232,
                    protein: 7.2,
                    carbs: 38.4,
                    fat: 5.6,
                    fiber: 4.8,
                    sugar: 0.8
                }
            },
            {
                name: "Black Beans",
                quantity: 100,
                unit: "grams",
                nutrition: {
                    calories: 132,
                    protein: 8.9,
                    carbs: 23.7,
                    fat: 0.5,
                    fiber: 8.7,
                    sugar: 0.3
                }
            },
            {
                name: "Cheddar Cheese",
                quantity: 40,
                unit: "grams",
                nutrition: {
                    calories: 164,
                    protein: 10.2,
                    carbs: 1.3,
                    fat: 13.6,
                    fiber: 0,
                    sugar: 0.4
                }
            },
            {
                name: "Bell Peppers",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 19,
                    protein: 0.6,
                    carbs: 4.4,
                    fat: 0.2,
                    fiber: 1.5,
                    sugar: 2.5
                }
            },
            {
                name: "Red Onion",
                quantity: 30,
                unit: "grams",
                nutrition: {
                    calories: 12,
                    protein: 0.3,
                    carbs: 2.8,
                    fat: 0,
                    fiber: 0.5,
                    sugar: 1.3
                }
            },
            {
                name: "Salsa",
                quantity: 50,
                unit: "grams",
                nutrition: {
                    calories: 18,
                    protein: 0.8,
                    carbs: 4.1,
                    fat: 0.1,
                    fiber: 1.1,
                    sugar: 2.4
                }
            }
        ],
        totalNutrition: {
            calories: 577,
            protein: 28,
            carbs: 74.7,
            fat: 20,
            fiber: 16.6,
            sugar: 7.7,
            sodium: 920,
            cholesterol: 42
        },
        labels: ["vegetarian", "high_fiber", "mexican", "comfort_food"],
        preparationTime: 10,
        cookingTime: 8,
        servings: 1,
        difficulty: "easy",
        instructions: [
            "Mash black beans lightly with fork",
            "Dice bell peppers and red onion",
            "Layer beans, cheese, and vegetables on one tortilla",
            "Top with second tortilla and press gently",
            "Cook in skillet for 3-4 minutes per side until golden",
            "Cut into wedges and serve with salsa"
        ],
        isActive: true,
        isFeatured: false
    },
    {
        title: "Asian Sesame Tofu Bowl",
        description: "Crispy baked tofu with sesame glaze, served over jasmine rice with steamed vegetables",
        type: "dinner",
        dietaryCategories: ["vegetarian", "vegan", "dairy_free"],
        ingredients: [
            {
                name: "Extra-Firm Tofu",
                quantity: 120,
                unit: "grams",
                nutrition: {
                    calories: 168,
                    protein: 18.2,
                    carbs: 4.8,
                    fat: 9.6,
                    fiber: 2.4,
                    sugar: 0.6
                }
            },
            {
                name: "Jasmine Rice",
                quantity: 65,
                unit: "grams",
                nutrition: {
                    calories: 234,
                    protein: 4.9,
                    carbs: 48.1,
                    fat: 0.7,
                    fiber: 0.7,
                    sugar: 0.1
                }
            },
            {
                name: "Broccoli",
                quantity: 80,
                unit: "grams",
                nutrition: {
                    calories: 27,
                    protein: 2.2,
                    carbs: 5.6,
                    fat: 0.3,
                    fiber: 2.1,
                    sugar: 1.2
                }
            },
            {
                name: "Carrots",
                quantity: 60,
                unit: "grams",
                nutrition: {
                    calories: 25,
                    protein: 0.6,
                    carbs: 5.8,
                    fat: 0.1,
                    fiber: 1.7,
                    sugar: 2.8
                }
            },
            {
                name: "Sesame Oil",
                quantity: 10,
                unit: "ml",
                nutrition: {
                    calories: 88,
                    protein: 0,
                    carbs: 0,
                    fat: 10,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name: "Soy Sauce",
                quantity: 15,
                unit: "ml",
                nutrition: {
                    calories: 8,
                    protein: 1.3,
                    carbs: 0.8,
                    fat: 0,
                    fiber: 0.1,
                    sugar: 0.4
                }
            },
            {
                name: "Sesame Seeds",
                quantity: 10,
                unit: "grams",
                nutrition: {
                    calories: 57,
                    protein: 1.8,
                    carbs: 2.4,
                    fat: 5.0,
                    fiber: 1.2,
                    sugar: 0.1
                }
            }
        ],
        totalNutrition: {
            calories: 607,
            protein: 29,
            carbs: 67.5,
            fat: 25.7,
            fiber: 8.2,
            sugar: 5.2,
            sodium: 1020,
            cholesterol: 0
        },
        labels: ["vegan", "high_protein", "asian_inspired", "dairy_free"],
        preparationTime: 20,
        cookingTime: 25,
        servings: 1,
        difficulty: "medium",
        instructions: [
            "Press tofu and cut into cubes",
            "Marinate tofu in soy sauce and sesame oil for 15 minutes",
            "Bake tofu at 400°F for 20-25 minutes until golden",
            "Cook jasmine rice according to package directions",
            "Steam broccoli and carrots for 5-7 minutes",
            "Arrange rice, tofu, and vegetables in bowl",
            "Drizzle with remaining sesame oil and sprinkle with sesame seeds"
        ],
        isActive: true,
        isFeatured: true
    }
];

// Sample Macro Plans
const sampleMacroPlans = [
    {
        title: "High Protein",
        description: "Powerhouse diet for muscle building and weight management. Perfect for athletes and fitness enthusiasts.",
        macroPercentages: {
            protein: 45,
            carbs: 35,
            fat: 20
        },
        startingCostPerDay: 120,
        targetGoals: ["build_muscle", "lose_weight", "athletic_performance"],
        targetAudience: ["athletes", "fitness_enthusiasts", "bodybuilders"],
        calorieRanges: {
            min: 1500,
            max: 3000
        },
        isRecommended: true,
        isActive: true,
        order: 1
    },
    {
        title: "Balanced Nutrition",
        description: "Well-rounded nutrition plan for overall health and wellness. Suitable for everyone.",
        macroPercentages: {
            protein: 25,
            carbs: 50,
            fat: 25
        },
        startingCostPerDay: 105,
        targetGoals: ["maintain_weight", "general_health", "balanced_lifestyle"],
        targetAudience: ["beginners", "general_public", "health_conscious"],
        calorieRanges: {
            min: 1200,
            max: 2500
        },
        isRecommended: false,
        isActive: true,
        order: 2
    },
    {
        title: "Keto Friendly",
        description: "Low-carb, high-fat nutrition plan for ketogenic lifestyle and rapid weight loss.",
        macroPercentages: {
            protein: 25,
            carbs: 10,
            fat: 65
        },
        startingCostPerDay: 135,
        targetGoals: ["lose_weight", "ketogenic_lifestyle", "metabolic_health"],
        targetAudience: ["keto_dieters", "weight_loss_focused", "low_carb_enthusiasts"],
        calorieRanges: {
            min: 1000,
            max: 2200
        },
        isRecommended: false,
        isActive: true,
        order: 3
    }
];

// Sample Meal Packages
const sampleMealPackages = [
    {
        title: "Complete Daily Nutrition",
        description: "Breakfast, lunch, dinner, and snacks - everything you need for the day",
        mealTypes: {
            breakfast: 1,
            lunch: 1,
            dinner: 1,
            snack: 1
        },
        calorieRange: {
            min: 1800,
            max: 2200
        },
        pricePerDay: 150,
        isPopular: true,
        order: 1,

    },
    {
        title: "Main Meals Only",
        description: "Breakfast, lunch, and dinner - core meals without snacks",
        mealTypes: {
            breakfast: 1,
            lunch: 1,
            dinner: 1,
            snack: 0
        },
        calorieRange: {
            min: 1500,
            max: 1800
        },
        pricePerDay: 120,
        isPopular: false,
        order: 2,

    },
    {
        title: "Lunch & Dinner",
        description: "Perfect for those who prefer to handle their own breakfast",
        mealTypes: {
            breakfast: 0,
            lunch: 1,
            dinner: 1,
            snack: 0
        },
        calorieRange: {
            min: 1000,
            max: 1400
        },
        pricePerDay: 85,
        isPopular: false,
        order: 3,

    }
];

// ========== INITIALIZATION FUNCTIONS ==========

export const initializeDatabase = async (userId) => {
    try {
        console.log('🚀 Starting database initialization...');

        // Initialize labels first
        console.log('📝 Creating labels...');
        const labelIds = [];
        for (const label of sampleLabels) {
            const labelId = await labelsService.add({
                ...label,
                isActive: true
            }, userId);
            labelIds.push(labelId);
            console.log(`✅ Created label: ${label.name}`);
        }

        // Initialize allergies
        console.log('⚠️ Creating allergies...');
        const allergyIds = [];
        for (const allergy of sampleAllergies) {
            const allergyId = await allergiesService.add({
                ...allergy,
                isActive: true
            });
            allergyIds.push(allergyId);
            console.log(`✅ Created allergy: ${allergy.name}`);
        }

        // Initialize meals (ingredients are now handled as subcollections within meals)
        console.log('🍽️ Creating meals...');
        const mealIds = [];
        for (const meal of sampleMeals) {
            const mealId = await mealsService.add(meal, userId);
            mealIds.push(mealId);
            console.log(`✅ Created meal: ${meal.title}`);
        }

        // Initialize macro plans
        console.log('📊 Creating macro plans...');
        const planIds = [];
        for (const plan of sampleMacroPlans) {
            const planId = await macroPlansService.add(plan, userId);
            planIds.push(planId);
            console.log(`✅ Created macro plan: ${plan.title}`);
        }

        // Initialize meal packages for each plan
        console.log('📦 Creating meal packages...');
        const packageIds = [];
        for (const planId of planIds) {
            for (const packageData of sampleMealPackages) {
                const packageId = await mealPackagesService.add({
                    ...packageData,
                    macroPlanId: planId,
                    isActive: true
                }, userId);
                packageIds.push(packageId);
                console.log(`✅ Created meal package: ${packageData.title}`);
            }
        }

        console.log('🎉 Database initialization completed successfully!');

        return {
            labelIds,
            mealIds,
            planIds,
            packageIds,
            menuTemplateId,
            success: true
        };

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
};

// Quick reset function for development
export const resetDatabase = async () => {
    console.log('⚠️ This function should only be used in development!');
    console.log('🗑️ Database reset is not implemented for safety reasons.');
    console.log('Please manually delete collections from Firebase Console if needed.');
};

// Validate database structure
export const validateDatabaseStructure = async () => {
    try {
        console.log('🔍 Validating database structure...');

        const labels = await labelsService.getAll();
        const meals = await mealsService.getAll();
        const plans = await macroPlansService.getAll();
        const packages = await mealPackagesService.getAll();
        const dietaryFilters = await getAllDietaryFilters();

        // Get master templates and overrides for the first macro plan (if any)
        let masterTemplates = [];
        let monthOverrides = [];
        if (plans.length > 0) {
            masterTemplates = await masterMonthTemplatesService.getByMacroPlan(plans[0].id);
            monthOverrides = await monthOverridesService.getByMacroPlan(plans[0].id);
        }

        console.log(`📝 Labels: ${labels.length}`);
        console.log(`🍽️ Meals: ${meals.length} (ingredients managed as subcollections)`);
        console.log(`📊 Macro Plans: ${plans.length}`);
        console.log(`📦 Meal Packages: ${packages.length}`);
        console.log(`🏷️ Dietary Filters: ${dietaryFilters.length}`);
        console.log(`📋 Master Month Templates: ${masterTemplates.length}`);
        console.log(`📅 Month Overrides: ${monthOverrides.length}`);

        return {
            labels: labels.length,
            meals: meals.length,
            plans: plans.length,
            packages: packages.length,
            dietaryFilters: dietaryFilters.length,
            masterTemplates: masterTemplates.length,
            monthOverrides: monthOverrides.length,
            isValid: true
        };

    } catch (error) {
        console.error('❌ Error validating database structure:', error);
        return {
            isValid: false,
            error: error.message
        };
    }
};
