# App Settings System Documentation

## Overview

The App Settings system allows administrators to manage content that will be displayed to customers in the mobile app, including:

- Terms and Conditions
- Privacy Policy
- About Us
- Contact Information
- Social Media Links

## Admin Interface

### Accessing Settings

Navigate to **App Settings** in the admin dashboard sidebar under the "Configuration" section.

### Features

- **Tabbed Interface**: Organized into Legal, About, Contact, and Social Media tabs
- **Toggle Controls**: Enable/disable each setting individually
- **Version Control**: Track versions for legal documents
- **Preview Function**: Preview content before publishing
- **Bulk Save**: Save all settings at once or save individually

### Settings Categories

#### 1. Legal Tab

- **Terms and Conditions**
  - Title, Version, Content
  - Enable/disable toggle
  - Version tracking for compliance
- **Privacy Policy**
  - Title, Version, Content
  - Enable/disable toggle
  - Version tracking for compliance

#### 2. About Tab

- **About Us**
  - Title, Content
  - Company story, mission, values
  - Enable/disable toggle

#### 3. Contact Tab

- **Contact Information**
  - Email address
  - Phone number
  - Physical address
  - Enable/disable toggle

#### 4. Social Media Tab

- **Social Media Links**
  - Facebook URL
  - Instagram URL
  - Twitter URL
  - LinkedIn URL
  - TikTok URL
  - Enable/disable toggle

## Client-Side Integration

### For React Native Apps

```javascript
import {
  getPublicAppSettings,
  getTermsAndConditions,
  getPrivacyPolicy,
  getAboutUs,
  getContactInfo,
  getSocialMediaLinks,
  isSettingEnabled,
} from "./path/to/clientSettings";

// Get all public settings
const settings = await getPublicAppSettings();

// Get specific settings
const terms = await getTermsAndConditions();
const privacy = await getPrivacyPolicy();
const about = await getAboutUs();
const contact = await getContactInfo();
const social = await getSocialMediaLinks();

// Check if a setting is enabled
const hasTerms = await isSettingEnabled("termsAndConditions");
```

### Example Usage in React Native

```jsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Linking } from "react-native";
import { getTermsAndConditions } from "../services/clientSettings";

const TermsScreen = () => {
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      const termsData = await getTermsAndConditions();
      setTerms(termsData);
    } catch (error) {
      console.error("Error loading terms:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!terms) {
    return <Text>Terms and conditions are not available.</Text>;
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{terms.title}</Text>
      <Text style={{ fontSize: 12, color: "gray" }}>
        Version {terms.version}
      </Text>
      <Text style={{ marginTop: 16, lineHeight: 20 }}>{terms.content}</Text>
    </ScrollView>
  );
};
```

### Contact Information Integration

```jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import {
  getContactInfo,
  getSocialMediaLinks,
} from "../services/clientSettings";

const ContactScreen = () => {
  const [contact, setContact] = useState(null);
  const [social, setSocial] = useState(null);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const [contactData, socialData] = await Promise.all([
        getContactInfo(),
        getSocialMediaLinks(),
      ]);
      setContact(contactData);
      setSocial(socialData);
    } catch (error) {
      console.error("Error loading contact info:", error);
    }
  };

  const handleEmailPress = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handlePhonePress = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleSocialPress = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      {contact && (
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Contact Us</Text>

          <TouchableOpacity onPress={handleEmailPress}>
            <Text style={{ color: "blue" }}>{contact.email}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePhonePress}>
            <Text style={{ color: "blue" }}>{contact.phone}</Text>
          </TouchableOpacity>

          <Text>{contact.address}</Text>
        </View>
      )}

      {social && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Follow Us</Text>

          {social.facebook && (
            <TouchableOpacity
              onPress={() => handleSocialPress(social.facebook)}
            >
              <Text style={{ color: "blue" }}>Facebook</Text>
            </TouchableOpacity>
          )}

          {social.instagram && (
            <TouchableOpacity
              onPress={() => handleSocialPress(social.instagram)}
            >
              <Text style={{ color: "blue" }}>Instagram</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
```

## Database Structure

Settings are stored in the `appSettings` collection in Firestore:

```
appSettings/
├── termsAndConditions/
│   ├── title: "Terms and Conditions"
│   ├── content: "..."
│   ├── version: "1.0"
│   ├── enabled: true
│   ├── updatedAt: timestamp
│   └── lastModified: "2025-07-26T..."
├── privacyPolicy/
│   ├── title: "Privacy Policy"
│   ├── content: "..."
│   ├── version: "1.0"
│   ├── enabled: true
│   ├── updatedAt: timestamp
│   └── lastModified: "2025-07-26T..."
├── aboutUs/
│   ├── title: "About Us"
│   ├── content: "..."
│   ├── enabled: true
│   ├── updatedAt: timestamp
│   └── lastModified: "2025-07-26T..."
├── contactInfo/
│   ├── title: "Contact Information"
│   ├── email: "contact@example.com"
│   ├── phone: "+1 (555) 123-4567"
│   ├── address: "123 Main St..."
│   ├── enabled: true
│   ├── updatedAt: timestamp
│   └── lastModified: "2025-07-26T..."
└── socialMedia/
    ├── title: "Social Media Links"
    ├── facebook: "https://facebook.com/..."
    ├── instagram: "https://instagram.com/..."
    ├── twitter: "https://twitter.com/..."
    ├── linkedin: "https://linkedin.com/..."
    ├── tiktok: "https://tiktok.com/@..."
    ├── enabled: true
    ├── updatedAt: timestamp
    └── lastModified: "2025-07-26T..."
```

## Security Rules

Add these Firestore security rules to allow read access for client apps:

```javascript
// Allow read access to public settings
match /appSettings/{document} {
  allow read: if true; // Public read access
  allow write: if request.auth != null; // Only authenticated admin users can write
}
```

## Best Practices

### For Administrators

1. **Always preview content** before saving
2. **Keep versions updated** for legal documents
3. **Use clear, concise titles** and content
4. **Test social media links** to ensure they work
5. **Regularly review and update** content

### For Developers

1. **Handle loading states** gracefully
2. **Cache settings locally** to improve performance
3. **Implement error handling** for network issues
4. **Check if settings are enabled** before displaying
5. **Use metadata** to implement cache invalidation

### Performance Optimization

- Cache settings data locally
- Use the `lastModified` timestamp to check for updates
- Implement background refresh of settings
- Consider using offline storage for critical content

## Troubleshooting

### Common Issues

1. **Settings not appearing**: Check if they are enabled in admin panel
2. **Outdated content**: Clear app cache or implement cache invalidation
3. **Network errors**: Implement retry logic and offline fallbacks
4. **Permission errors**: Verify Firestore security rules

### Support

For technical support or feature requests, please contact the development team.
