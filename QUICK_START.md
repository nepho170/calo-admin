# Quick Start Guide - Calo Admin Dashboard

## 🚨 First Time Setup - MUST DO BEFORE LOGGING IN

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Make sure your `.env` file exists with Firebase credentials (it should already be there).

### Step 3: Initialize First Super Admin ⚠️ REQUIRED

**You cannot login until you create the first admin user!**

#### Method 1: Using Script (Easiest)

1. Edit `scripts/init-admin.js` and update credentials:

   ```javascript
   const ADMIN_EMAIL = "your-email@example.com";
   const ADMIN_PASSWORD = "your-secure-password";
   ```

2. Run the initialization:

   ```bash
   npm run init-admin
   ```

3. You should see:
   ```
   ✅ First admin user created successfully!
   📧 Email: your-email@example.com
   🔒 Password: your-secure-password
   🆔 UID: [generated-uid]
   ```

#### Method 2: Manual Firebase Console

1. **Firebase Console → Authentication → Add User**

   - Enter email and password
   - Copy the UID

2. **Firebase Console → Firestore → Create Collection**
   - Collection: `admin_users`
   - Document ID: [paste UID]
   - Fields:
     ```
     active: true
     createdAt: [current timestamp]
     displayName: "Super Admin"
     email: "your-email@example.com"
     lastLogin: null
     permissions: ["full_access"]
     role: "admin"
     updatedAt: [current timestamp]
     ```

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Login

- Open http://localhost:5173
- Login with your admin credentials
- You're in! 🎉

## 🔐 Current Super Admin

```
Email: nepho17@hotmail.com
```

(Password stored securely - use password reset if needed)

## 📝 Managing Additional Admins

Once logged in as super admin:

1. Go to **Configuration → Admin Users**
2. Click **Add Admin**
3. Fill in email, password, and display name
4. New admin can now login

## 🚀 Deployment

### Deploy Functions (Careful!)

```bash
firebase deploy --only functions
```

**When asked to delete unused functions, type: N**
(Functions are shared with client project)

### Deploy Hosting

```bash
npm run build
firebase deploy --only hosting
```

## 🆘 Troubleshooting

### Can't Login?

- Check if user exists in Firebase Auth
- Check if document exists in `admin_users` collection
- Verify `active` field is `true`
- Check document ID matches Auth UID

### Script Fails?

- Verify `.env` file has all Firebase config
- Check if admin already exists
- Try manual method instead

### Access Denied?

- Ensure you're using the correct email/password
- Check Firestore rules are deployed:
  ```bash
  firebase deploy --only firestore:rules
  ```

## 📚 Documentation

- Full setup: `README.md`
- Admin system: `docs/ADMIN_SYSTEM_DOCUMENTATION.md`
- All features: Check other docs in `/docs` folder
