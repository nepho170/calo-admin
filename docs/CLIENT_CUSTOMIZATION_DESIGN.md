# Client Package Customization - Firebase Only Design

## 🎯 Overview

This document outlines how to implement client-side package customization where customers can choose quantities of each meal type (e.g., 2 breakfasts, 3 lunches, 1 dinner) and get real-time calorie calculations using **100% Firebase** - no separate API needed!

## 🔥 **Firebase-Only Architecture**

### **Admin Panel** (Firebase Hosting)

- React admin app deployed on Firebase Hosting
- Connects directly to Firestore
- Manages packages, meals, and customization rules

### **Mobile Client App**

- Connects directly to Firestore (no API layer)
- Reads package data and meal templates
- Calculates calories client-side using same logic as admin
- Creates orders directly in Firestore

### **Firestore Database Structure**

```javascript
// Collections in Firestore:
// - mealPackages (your existing)
// - masterMonthTemplates (your existing)
// - meals (your existing)
// - customerOrders (new)
// - customizationRules (new)
```

## 🗄️ **Enhanced Database Schema**

### **Meal Packages Collection** (Enhanced)

```javascript
// /mealPackages/{packageId}
{
  id: "complete_daily_package",
  title: "Complete Daily Nutrition",
  macroPlanId: "high_protein_plan",

  // Base configuration (current system)
  baseIncludedMealTypes: ["breakfast", "lunch", "dinner", "snack"],
  baseCalorieRange: { min: 1800, max: 2200 },
  basePricePerDay: 150,

  // NEW: Customization settings
  customizationEnabled: true,
  customizationRules: {
    breakfast: { min: 0, max: 3, default: 1, pricePerExtra: 20 },
    lunch: { min: 0, max: 2, default: 1, pricePerExtra: 35 },
    dinner: { min: 1, max: 2, default: 1, pricePerExtra: 45 }, // Required
    snack: { min: 0, max: 4, default: 1, pricePerExtra: 15 }
  },


```

### **Customer Orders Collection** (New)

```javascript
// /customerOrders/{orderId}
{
  customerId: "user123",
  packageId: "complete_daily_package",
  macroPlanId: "high_protein_plan",

  // Customer's custom selection
  customQuantities: {
    breakfast: 2,  // Customer wants 2 breakfasts
    lunch: 1,
    dinner: 1,
    snack: 3      // Customer wants 3 snacks
  },

  // Calculated values (done client-side)
  calculatedCalorieRange: { min: 2100, max: 2650 },
  calculatedPrice: 185,
  totalMealsPerDay: 7,

  // Order details
  startDate: "2025-07-15",
  duration: 7, // days
  status: "active",
  createdAt: timestamp
}
```

## 📱 **Client-Side Implementation**

### **Mobile App Firestore Setup**

```javascript
// Mobile app connects directly to Firestore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase config (same as admin)
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

### **Client Package Customization Component**

```javascript
// React Native component (or React web)
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const PackageCustomizer = ({ packageId }) => {
  const [package, setPackage] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({
    breakfast: 1,
    lunch: 1,
    dinner: 1,
    snack: 1,
  });
  const [calculatedCalories, setCalculatedCalories] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Load package data from Firestore
  useEffect(() => {
    const loadPackage = async () => {
      const packageDoc = await getDoc(doc(db, "mealPackages", packageId));
      if (packageDoc.exists()) {
        const packageData = packageDoc.data();
        setPackage(packageData);

        // Set default quantities
        const defaultQuantities = {};
        Object.entries(packageData.customizationRules).forEach(
          ([mealType, rules]) => {
            defaultQuantities[mealType] = rules.default;
          }
        );
        setSelectedQuantities(defaultQuantities);
      }
    };

    loadPackage();
  }, [packageId]);

  // Calculate calories when quantities change
  useEffect(() => {
    if (package && selectedQuantities) {
      calculateCustomCalories();
      calculateCustomPrice();
    }
  }, [selectedQuantities, package]);

  // CLIENT-SIDE CALORIE CALCULATION (no API needed!)
  const calculateCustomCalories = async () => {
    try {
      // Get master month template for this macro plan
      const templatesQuery = query(
        collection(db, "masterMonthTemplates"),
        where("macroPlanId", "==", package.macroPlanId)
      );

      const templatesSnapshot = await getDocs(templatesQuery);
      if (templatesSnapshot.empty) return;

      const template = templatesSnapshot.docs[0].data();

      // Calculate calories for custom quantities
      const dailyCalories = [];

      // Process each day (sample first 7 days for performance)
      for (let dayNum = 1; dayNum <= 7; dayNum++) {
        const dayKey = `day${dayNum}`;
        const dayData = template.masterDays[dayKey];

        if (dayData && dayData.mealOptions) {
          let dayTotal = 0;

          // Calculate calories for each meal type based on selected quantities
          for (const [mealType, quantity] of Object.entries(
            selectedQuantities
          )) {
            const mealOptions = dayData.mealOptions[mealType] || [];

            if (mealOptions.length > 0 && quantity > 0) {
              // Get first meal option for this meal type
              const mealDoc = await getDoc(doc(db, "meals", mealOptions[0]));
              if (mealDoc.exists()) {
                const meal = mealDoc.data();
                const mealCalories = meal.totalNutrition?.calories || 0;
                dayTotal += mealCalories * quantity; // Multiply by quantity!
              }
            }
          }

          dailyCalories.push(dayTotal);
        }
      }

      // Calculate min/max range
      const min = Math.min(...dailyCalories);
      const max = Math.max(...dailyCalories);
      const average = Math.round(
        dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length
      );

      setCalculatedCalories({ min, max, average });
    } catch (error) {
      console.error("Error calculating calories:", error);
    }
  };

  // Calculate price based on custom quantities
  const calculateCustomPrice = () => {
    let totalPrice = package.basePricePerDay;
    let totalMeals = 0;

    // Count total meals
    Object.values(selectedQuantities).forEach((quantity) => {
      totalMeals += quantity;
    });

    // Calculate extra meal charges
    const extraMeals = Math.max(0, totalMeals - package.baseMealsIncluded);
    totalPrice += extraMeals * package.extraMealBasePrice;

    // Add meal-specific pricing
    Object.entries(selectedQuantities).forEach(([mealType, quantity]) => {
      const rules = package.customizationRules[mealType];
      if (quantity > rules.default) {
        const extraQuantity = quantity - rules.default;
        totalPrice += extraQuantity * rules.pricePerExtra;
      }
    });

    setCalculatedPrice(totalPrice);
  };

  // Handle quantity changes
  const handleQuantityChange = (mealType, newQuantity) => {
    const rules = package.customizationRules[mealType];
    if (newQuantity >= rules.min && newQuantity <= rules.max) {
      setSelectedQuantities((prev) => ({
        ...prev,
        [mealType]: newQuantity,
      }));
    }
  };

  // Save order to Firestore
  const createOrder = async () => {
    const orderData = {
      customerId: "user123", // Current user ID
      packageId: package.id,
      macroPlanId: package.macroPlanId,
      customQuantities: selectedQuantities,
      calculatedCalorieRange: calculatedCalories,
      calculatedPrice: calculatedPrice,
      totalMealsPerDay: Object.values(selectedQuantities).reduce(
        (a, b) => a + b,
        0
      ),
      startDate: new Date().toISOString(),
      status: "pending",
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "customerOrders"), orderData);
      console.log("Order created successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  if (!package) return <div>Loading...</div>;

  return (
    <div className="package-customizer">
      <h2>{package.title}</h2>

      {/* Meal Type Selectors */}
      {Object.entries(package.customizationRules).map(([mealType, rules]) => (
        <div key={mealType} className="meal-type-selector">
          <h3>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
          <div className="quantity-controls">
            <button
              onClick={() =>
                handleQuantityChange(mealType, selectedQuantities[mealType] - 1)
              }
              disabled={selectedQuantities[mealType] <= rules.min}
            >
              -
            </button>
            <span>{selectedQuantities[mealType]}</span>
            <button
              onClick={() =>
                handleQuantityChange(mealType, selectedQuantities[mealType] + 1)
              }
              disabled={selectedQuantities[mealType] >= rules.max}
            >
              +
            </button>
          </div>
          <p>
            Min: {rules.min}, Max: {rules.max}
          </p>
        </div>
      ))}

      {/* Real-time Calculation Results */}
      {calculatedCalories && (
        <div className="calculation-results">
          <h3>Your Customized Package</h3>
          <p>
            Daily Calories: {calculatedCalories.min} - {calculatedCalories.max}{" "}
            cal
          </p>
          <p>Average: {calculatedCalories.average} cal/day</p>
          <p>Price: ${calculatedPrice}/day</p>
          <p>
            Total Meals:{" "}
            {Object.values(selectedQuantities).reduce((a, b) => a + b, 0)} per
            day
          </p>
        </div>
      )}

      <button onClick={createOrder}>Order This Package</button>
    </div>
  );
};
```

## 🔧 **Admin Panel Enhancements**

### **Add Customization Rules to Meal Packages**

````javascript
// In your MealPackages.jsx component, add these fields:

const MealPackageDialog = ({ open, onClose, pkg, onSave }) => {
  const [formData, setFormData] = useState({
    // ...existing fields...



## 🚀 **Key Benefits of Firebase-Only Approach**

### ✅ **Advantages**

- **No API server needed** - everything runs on Firebase
- **Real-time updates** - Firestore real-time listeners
- **Scalable** - Firebase handles scaling automatically
- **Secure** - Firestore security rules protect data
- **Cost-effective** - Only pay for what you use
- **Deploy anywhere** - Admin on Firebase Hosting, mobile app in stores

### ✅ **Performance**

- **Client-side calculations** - No API latency
- **Cached meal data** - Store frequently used meals locally
- **Efficient queries** - Only fetch needed data
- **Offline support** - Firebase offline persistence

### ✅ **Security**

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customers can only read packages and meals
    match /mealPackages/{packageId} {
      allow read: if request.auth != null;
    }

    match /meals/{mealId} {
      allow read: if request.auth != null;
    }

    match /masterMonthTemplates/{templateId} {
      allow read: if request.auth != null;
    }

    // Customers can only create/read their own orders
    match /customerOrders/{orderId} {
      allow read, create: if request.auth != null &&
        request.auth.uid == resource.data.customerId;
    }

    // Admin access to everything
    match /{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
````

## 📱 **Mobile App Flow**

1. **Customer opens app** → Authenticates with Firebase Auth
2. **Browses packages** → Reads from `/mealPackages` collection
3. **Selects package** → Loads customization rules
4. **Customizes quantities** → Real-time calorie/price calculation
5. **Places order** → Writes to `/customerOrders` collection
6. **Admin sees orders** → Reads from `/customerOrders` in admin panel

## 🎯 **Example Usage**

```javascript
// Customer selects:
// - 2 breakfasts
// - 1 lunch
// - 1 dinner
// - 3 snacks

// System calculates:
// Day 1: (Breakfast A: 350cal) + (Breakfast B: 380cal) + (Lunch: 520cal) + (Dinner: 720cal) + (Snack A: 200cal) + (Snack B: 180cal) + (Snack C: 220cal) = 2570 cal
// Day 2: Different meal combinations = 2420 cal
// Result: "Your custom package serves 2420-2650 calories per day"
```

This approach keeps everything in Firebase, scales automatically, and gives you the same calorie calculation power on both admin and client sides! 🔥
