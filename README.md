# Biz Recipe Admin Dashboard

React admin dashboard for managing meal planning systems with Firebase backend.

## 🔗 Related Project

This is the **admin dashboard** for the Calo meal planning system. The client-side application can be found at:
**[Calo Client App](https://github.com/nepho170/calo-last)**

Both projects share the same Firebase backend and functions.

## 🚀 Features

- **Complete Database Management**: Ingredients, meals, macro plans, meal packages, and weekly menus
- **Firebase Integration**: Firestore database with real-time updates and image storage
- **Day-wise Meal Planning**: Create 3, 4, 5, 6, or 7-day meal plans
- **Nutrition Calculation**: Automatic nutrition calculation from ingredients
- **Material-UI Design**: Modern, responsive design with dark/light theme support
- **Image Management**: Upload and manage ingredient and meal photos
- **Activity Logging**: Track all admin actions and changes

## 🗄️ Database Structure

### Core Collections

1. **Ingredients** (`ingredients`)

   - Master ingredient database with nutrition per 100g
   - Categories: protein, carb, vegetable, fat, dairy, etc.
   - Allergen information and common units

2. **Labels** (`labels`)

   - Dietary and health labels (Gluten Free, High Protein, etc.)
   - Color coding and categorization
   - Reusable across meals and plans

3. **Meals** (`meals`)

   - Individual meal recipes with ingredients
   - Calculated nutrition from ingredients
   - Preparation instructions and cooking times
   - Photo attachments

4. **Macro Plans** (`macroPlans`)

   - Nutrition plans (High Protein, Balanced, Keto)
   - Macro percentages (protein/carbs/fat)
   - Target goals and audience

5. **Meal Packages** (`mealPackages`)

   - Sub-plans within macro plans
   - Meal combinations (breakfast, lunch, dinner, snacks)
   - Pricing and features

6. **Weekly Menu Templates** (`weeklyMenuTemplates`)
   - Day-wise meal planning (3-7 days)
   - Complete nutrition calculation
   - Multiple variations per plan

### Supporting Collections

- **Menu Variations** (`menuVariations`)
- **Admin Users** (`adminUsers`)
- **System Settings** (`systemSettings`)
- **Activity Logs** (`activityLogs`)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication
4. Enable Storage for image uploads
5. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Deploy Firestore Rules and Indexes

````bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:storage
```

### 5. Initialize First Super Admin

**CRITICAL**: Before you can login to the dashboard, you MUST create the first super admin user. This is a one-time setup required for security.

#### Option A: Using the Initialization Script (Recommended)

1. Make sure your `.env` file is configured with your Firebase credentials

2. Update the admin credentials in `scripts/init-admin.js`:
   ```javascript
   const ADMIN_EMAIL = "your-admin-email@example.com";
   const ADMIN_PASSWORD = "your-secure-password";
   ```

3. Run the initialization script:
   ```bash
   node scripts/init-admin.js
   ```

4. The script will create:
   - A Firebase Authentication user
   - An admin document in the `admin_users` collection with these fields:
     - `email`: Admin email address
     - `displayName`: "Super Admin"
     - `role`: "admin"
     - `permissions`: ["full_access"]
     - `active`: true
     - `createdAt`: Current timestamp
     - `updatedAt`: Current timestamp
     - `lastLogin`: null (will be updated on first login)

#### Option B: Manual Setup via Firebase Console

If the script fails or you prefer manual setup:

1. **Create Authentication User**:
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Copy the generated UID

2. **Create Admin Document**:
   - Go to Firestore Database
   - Create collection: `admin_users`
   - Document ID: [paste the UID from step 1]
   - Add these fields:
     ```
     active: true (boolean)
     createdAt: [current timestamp]
     displayName: "Super Admin" (string)
     email: "your-email@example.com" (string)
     lastLogin: null
     permissions: ["full_access"] (array with string)
     role: "admin" (string)
     updatedAt: [current timestamp]
     ```

3. **Verify Setup**:
   - Try logging in with your admin credentials
   - You should have full access to all dashboard features

#### Troubleshooting

- **Can't login**: Verify the user exists in both Firebase Auth AND the `admin_users` collection
- **Access denied**: Check that `active` is set to `true` in the admin document
- **Script fails**: Ensure your `.env` file has all required Firebase configuration variables
- **Email already exists**: If the email is already in Firebase Auth, you just need to add the Firestore document using Option B

### 6. Initialize Database

1. Start the development server:

```bash
npm run dev
````

2. Navigate to `/database-init` in the dashboard
3. Click "Initialize Database" to populate with sample data

## 📊 Database Schema Details

### Ingredients Collection

```javascript
{
  name: "Chicken Breast",
  category: "protein",
  nutritionPer100g: {
    riz Recipeies: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    cholesterol: 85
  },
  commonUnits: ["grams", "pieces", "ounces"],
  allergens: [],
  image: "https://...",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Meals Collection

```javascript
{
  title: "Grilled Chicken with Quinoa",
  description: "Perfectly seasoned grilled chicken...",
  type: "lunch",
  ingredients: [
    {
      ingredientId: "ingredient_id",
      name: "Chicken Breast",
      quantity: 150,
      unit: "grams",
      nutrition: { /* calculated for this quantity */ }
    }
  ],
  totalNutrition: { /* sum of all ingredients */ },
  labels: ["high_protein", "gluten_free"],
  preparationTime: 15,
  cookingTime: 25,
  instructions: ["Step 1...", "Step 2..."],
  image: "https://...",
  isActive: true,
  isFeatured: true
}
```

### Weekly Menu Templates Collection

```javascript
{
  macroPlanId: "high_protein_plan",
  packageId: "complete_daily_package",
  title: "High Protein - Weekly Menu",
  totalDays: 7,
  dailyMenus: {
    day1: {
      dayName: "Monday",
      meals: {
        breakfast: "meal_id_1",
        lunch: "meal_id_2",
        dinner: "meal_id_3",
        snack: "meal_id_4"
      },
      totalriz Recipeies: 1800,
      totalMacros: {
        protein: 120,
        carbs: 150,
        fat: 60
      }
    },
    // ... day2 through day7
  },
  weeklyStats: {
    averageDailyriz Recipeies: 1800,
    averageDailyMacros: { /* averages */ }
  }
}
```

## 🔧 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

```

## 🔐 Security Considerations

For production deployment:

1. Implement proper Firebase Authentication
2. Update Firestore security rules
3. Validate all input data
4. Implement role-based access control
5. Enable audit logging

## 🚀 Deployment

### Deploy Firebase Functions

**IMPORTANT**: This project shares Firebase Functions with the client-side project. When deploying functions, Firebase will prompt you to delete "unused" functions. **Always answer "No"** to this prompt, as those functions are actively used by the client application.

```bash
# Deploy only functions
firebase deploy --only functions

# When prompted: "Would you like to proceed with deletion? (y/N)"
# Type: N
```

### Firebase Hosting

```bash
# Build the project
npm run build

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy hosting only (safe)
firebase deploy --only hosting

# Or deploy everything (remember to say "No" to function deletion)
firebase deploy
```

### Vercel/Netlify

The project is ready for deployment on any static hosting service.

## 🆘 Support

For support and questions:

- Check the database initialization page for setup issues
- Review the Firebase console for connection problems
- Ensure all environment variables are configured correctly

### Need Help?

If you need assistance with setup, deployment, or any issues:

- **Email**: 2lhashmiii@gmail.com
- **WhatsApp**: +971 58 899 1960

## 📚 Additional Resources

## 📚 Additional Resources

### Vite + React

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
