# Admin Initialization Checklist ✓

## Before First Login - ONE TIME SETUP

### Prerequisites

- [ ] Node.js installed
- [ ] Firebase project created
- [ ] `.env` file configured with Firebase credentials

### Initialize Super Admin (Required!)

#### Option 1: Run Script (Recommended)

```bash
npm run init-admin
```

#### Option 2: Manual Setup

1. Firebase Console → Authentication → Add user
2. Copy the UID
3. Firestore → Create collection `admin_users`
4. Create document with UID as ID
5. Add required fields (see README.md)

### Verify Setup

- [ ] Admin exists in Firebase Authentication
- [ ] Admin document exists in `admin_users` collection
- [ ] Document has field: `active: true`
- [ ] Document has field: `permissions: ["full_access"]`
- [ ] Document has field: `role: "admin"`

### Test Login

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to login page
- [ ] Login with admin credentials
- [ ] Access granted to dashboard

## Current Admin Document Structure

```javascript
{
  active: true,                    // MUST be true
  createdAt: Timestamp,
  displayName: "Super Admin",
  email: "nepho17@hotmail.com",
  lastLogin: Timestamp or null,
  permissions: ["full_access"],    // Array with string
  role: "admin",                   // String
  updatedAt: Timestamp
}
```

## Quick Commands

```bash
# Install dependencies
npm install

# Initialize first admin
npm run init-admin

# Start development
npm run dev

# Deploy functions (answer N to deletion prompt)
npm run deploy:functions

# Build for production
npm run build
```

## Troubleshooting

**"User not found" error**
→ Admin user not in Authentication

**"Access denied" error**  
→ Admin document missing in `admin_users` collection OR `active: false`

**"Script fails" error**
→ Check `.env` file OR use manual method

**"Already exists" warning**
→ Admin already created, just login

## Important Notes

- ⚠️ Collection name is `admin_users` (with underscore)
- ⚠️ Document ID must match Firebase Auth UID
- ⚠️ Field `active` must be boolean `true`
- ⚠️ Permissions array must contain string `"full_access"`
- ⚠️ When deploying functions, always answer "N" to deletion prompts

## Support

See full documentation:

- `README.md` - Complete setup guide
- `QUICK_START.md` - Quick reference
- `docs/ADMIN_SYSTEM_DOCUMENTATION.md` - Detailed admin system docs
