# Admin User Management System Documentation

## Overview

The admin user management system provides comprehensive authentication and authorization for the Calo Recipe admin dashboard. It ensures that only authorized administrators can access and manage the system.

## 🔐 Security Architecture

### Firestore Security Rules

The system uses sophisticated Firestore security rules that:

- **Verify Authentication**: Users must be authenticated with Firebase Auth
- **Check Admin Status**: Users must exist in the `adminUsers` collection
- **Validate Active Status**: Admin users must have `isActive: true`
- **Enforce Permissions**: Different admin roles have different permissions

### Admin Roles

| Role                | Description                | Permissions                                        |
| ------------------- | -------------------------- | -------------------------------------------------- |
| **Super Admin**     | Full system access         | All permissions including admin management         |
| **Admin**           | General admin access       | Most features except admin management              |
| **Nutritionist**    | Meal and nutrition focused | Create/edit meals, manage packages, view analytics |
| **Content Creator** | Content management         | Create/edit meals, view analytics                  |

### Permission System

```javascript
export const ADMIN_PERMISSIONS = {
  CREATE_MEALS: "create_meals",
  EDIT_MEALS: "edit_meals",
  DELETE_MEALS: "delete_meals",
  MANAGE_PACKAGES: "manage_packages",
  MANAGE_USERS: "manage_users",
  MANAGE_ORDERS: "manage_orders",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ADMINS: "manage_admins", // Super Admin only
};
```

## 🚀 Initial Setup

### 1. Create First Admin User

Since admin users can only be created by other admins, you need to manually create the first super admin:

#### Option A: Using Initialization Script (Recommended)

1. **Configure Admin Credentials**:

   - Edit `scripts/init-admin.js`
   - Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` with your desired credentials

2. **Run the Script**:

   ```bash
   npm run init-admin
   # or
   node scripts/init-admin.js
   ```

3. **Script Creates**:
   - Firebase Authentication user
   - Admin document in `admin_users` collection with proper structure

#### Option B: Through Firebase Console (Manual)

1. **Create Firebase Auth User**:

   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Copy the generated UID

2. **Add to admin_users Collection**:
   - Go to Firestore Database → Start collection
   - Collection ID: `admin_users`
   - Document ID: [paste the UID from step 1]
   - Add fields:
     ```
     active: true (boolean)
     createdAt: [current timestamp]
     displayName: "Super Admin" (string)
     email: "admin@yourcompany.com" (string)
     lastLogin: null
     permissions: ["full_access"] (array)
     role: "admin" (string)
     updatedAt: [current timestamp]
     ```

### 2. Deploy Security Rules

Make sure your Firestore security rules are deployed:

```bash
firebase deploy --only firestore:rules
```

### 3. Test Login

Try logging in with the admin credentials through the dashboard.

## 🎯 Features

### Admin User Management

- **Create Admin Users**: Add new admin users with specific roles
- **Role Management**: Assign roles with appropriate permissions
- **Status Control**: Activate/deactivate admin accounts
- **Permission Checking**: Verify user permissions for specific actions
- **Login Tracking**: Track last login times
- **Statistics**: View admin user statistics and activity

### Authentication Flow

1. **User Login**: Firebase Auth authentication
2. **Admin Check**: Verify user exists in `adminUsers` collection
3. **Status Validation**: Ensure user is active
4. **Permission Loading**: Load user role and permissions
5. **Session Management**: Maintain authenticated session
6. **Logout**: Clean session and redirect

### Protected Routes

All admin routes are protected with the `ProtectedRoute` component:

```jsx
// Basic admin protection
<ProtectedRoute>
    <AdminPage />
</ProtectedRoute>

// Permission-specific protection
<ProtectedRoute requiredPermission="manage_admins">
    <AdminUsersPage />
</ProtectedRoute>
```

## 📱 Usage

### For Super Admins

1. **Access Admin Users**: Navigate to "Configuration" → "Admin Users"
2. **Add New Admin**: Click "Add Admin User" button
3. **Fill Details**: Enter email, display name, and select role
4. **Save**: Admin user will be created with role-based permissions

### For Regular Admins

- Access is determined by role and permissions
- Can view their own admin details
- Cannot access admin management features

### Navigation

Admin Users menu item is only visible to users with `manage_admins` permission (Super Admins by default).

## 🔧 Technical Implementation

### Key Files

- **`src/services/adminUsers.js`**: Admin user service with CRUD operations
- **`src/pages/AdminUsers.jsx`**: Admin user management interface
- **`src/components/ProtectedRoute.jsx`**: Route protection component
- **`src/components/AdminLogin.jsx`**: Login interface
- **`src/contexts/AuthContext.jsx`**: Authentication context with admin checks
- **`src/utils/adminSetup.js`**: Initial setup utilities

### Database Schema

```javascript
// admin_users collection
{
    // Document ID is Firebase Auth UID
    email: "string",
    displayName: "string",
    role: "admin",  // Currently only "admin" role (all have full access)
    permissions: ["full_access"],  // Array with "full_access" string
    active: true,  // boolean - must be true for login
    lastLogin: "timestamp",  // Updated on each login
    createdAt: "timestamp",
    updatedAt: "timestamp"
}
```

### Service Functions

```javascript
// Check admin status
const adminStatus = await adminUsersService.checkAdminStatus(userId);

// Create admin user
await adminUsersService.create(userId, adminData);

// Update admin user
await adminUsersService.update(userId, updateData);

// Check permission
const hasPermission = await adminUsersService.hasPermission(
  userId,
  "manage_orders"
);

// Toggle active status
await adminUsersService.toggleActive(userId, true);
```

## 🛡️ Security Best Practices

### 1. Firestore Rules

- ✅ All collections require authentication
- ✅ Admin operations require admin status verification
- ✅ Users can only access their own data
- ✅ Admin users collection is protected
- ✅ Catch-all rule denies unauthorized access

### 2. Frontend Protection

- ✅ Protected routes prevent unauthorized access
- ✅ Permission-based UI rendering
- ✅ Client-side validation with server-side enforcement
- ✅ Automatic logout on permission revocation

### 3. Role Management

- ✅ Least privilege principle
- ✅ Role-based permission assignment
- ✅ Permission checking at component level
- ✅ Granular access control

## 🚨 Important Notes

1. **First Admin**: Must be created manually through Firebase Console
2. **Security Rules**: Ensure rules are deployed before use
3. **Permissions**: Super Admin is required to manage other admins
4. **Self-Management**: Admins cannot deactivate or delete themselves
5. **Session Management**: Authentication state is managed by Firebase Auth

## 🔄 Workflow

### Adding New Admin User

1. Super Admin logs into dashboard
2. Navigates to Admin Users page
3. Clicks "Add Admin User"
4. Enters user details and selects role
5. System creates Firebase Auth user (in production)
6. System adds user to adminUsers collection
7. New admin receives credentials and can log in

### Managing Existing Admins

1. View all admin users in table format
2. See statistics and activity overview
3. Edit admin details and roles
4. Activate/deactivate accounts
5. Delete admin accounts (except own)

## 📊 Monitoring

### Admin Statistics

- Total admin count
- Active vs inactive admins
- Role breakdown
- Recent login activity

### Audit Trail

- Activity logs for admin actions
- Login/logout tracking
- Permission changes
- Role modifications

This admin system provides enterprise-grade security and management capabilities for your Calo Recipe admin dashboard.
