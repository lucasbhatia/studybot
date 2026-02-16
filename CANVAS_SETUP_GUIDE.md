# Canvas OAuth + Social Platform Setup Guide

This guide walks through setting up Canvas OAuth authentication and the social platform for StudyBot.

---

## Part 1: Canvas Developer Key Setup

### Step 1: Register Developer Key in Canvas

1. **Log in to your Canvas admin panel**
   - Go to `https://<your-university>/admin`
   - Example: `https://uk.instructure.com/admin`

2. **Navigate to Developer Keys**
   - Left sidebar → **Developer Keys** (or search for it)
   - Click **+ Developer Key** → **API Key**

3. **Fill in Application Details**

   | Field | Value |
   |-------|-------|
   | **Key Name** | StudyBot Extension |
   | **Owner Email** | your-email@example.com |
   | **Redirect URI(s)** | `chrome-extension://{YOUR_EXTENSION_ID}/auth/canvas-callback.html` |
   | **Icon URL** | (optional) |

   **Example Redirect URI:**
   ```
   chrome-extension://abcdefg1234567890abcdefg/auth/canvas-callback.html
   ```

   ✅ **To find your Extension ID:**
   1. Install the extension (or load it unpacked in Chrome)
   2. Go to `chrome://extensions`
   3. Copy the ID shown under StudyBot

4. **Set Permissions**
   - Select scopes the app needs:
     - ✅ `url:GET|/api/v1/users/self` (Get user profile)
     - ✅ `url:GET|/api/v1/users/self/profile` (Get profile details)
     - ✅ `url:GET|/api/v1/courses` (Get courses)
     - ✅ `url:GET|/api/v1/courses/:id/users` (Get class members)

5. **Save and Copy Client ID**
   - Click **Save**
   - The key will show a **Client ID** (looks like: `12345678901234567890`)
   - ✅ Copy this and save it
   - ⚠️ **NEVER share this publicly**

---

## Part 2: Configure StudyBot Extension

### Step 1: Update Extension ID

In `extension/manifest.json`, update `host_permissions` with your universities' Canvas URLs:

```json
{
  "permissions": ["storage", "scripting"],
  "host_permissions": [
    "https://uk.instructure.com/*",
    "https://canvas.instructure.com/*",
    "https://canvas.mit.edu/*",
    "https://*.instructure.com/*"
  ],
  "web_accessible_resources": [
    {
      "resources": ["auth/canvas-callback.html"],
      "matches": ["https://*.instructure.com/*"]
    }
  ]
}
```

### Step 2: Add Canvas Developer Key to Config

When users first log in, they'll be prompted to enter their Canvas Developer Key. This is stored locally in `chrome.storage`:

```javascript
// Users enter this during onboarding
chrome.storage.local.set({
  canvas_oauth_config: {
    clientId: "12345678901234567890",      // From Canvas admin
    canvasUrl: "https://uk.instructure.com" // Their university
  }
});
```

---

## Part 3: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **+ New project**
4. Fill in:
   - **Project Name:** StudyBot
   - **Database Password:** (strong password)
   - **Region:** Closest to your users
5. Click **Create new project** (takes ~2 min)

### Step 2: Get Connection Credentials

1. Go to **Settings** → **API**
2. Copy these (add to `extension/lib/config.js`):
   - **Project URL** → `SUPABASE_URL`
   - **Anon Public Key** → `SUPABASE_ANON_KEY`

**Update config.js:**

```javascript
const STUDYBOT_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  // ... rest of config
};
```

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **+ New Query**
3. Copy contents of `supabase/migrations/001_social_platform.sql`
4. Paste into SQL Editor
5. Click **Run** (bottom right)

**Output:**
```
✅ Tables created: users, friendships, study_sets, etc.
✅ Indexes created
✅ RLS policies enabled
✅ Permissions granted
```

### Step 4: Enable Anonymous Login (Optional)

If you want public study sets:

1. Go to **Authentication** → **Providers**
2. Enable **Anonymous Sign-Ins**
3. This allows unauthenticated users to view public sets

---

## Part 4: Test Canvas Login

### Manual Test

1. **Load extension in Chrome**
   ```bash
   # Option 1: Load unpacked in Chrome
   chrome://extensions → Load unpacked → select extension/ folder
   
   # Option 2: If already installed, reload (Ctrl+R)
   ```

2. **Open extension popup or side panel**
   - Click StudyBot icon
   - Should see onboarding screen

3. **Click "Sign In with Canvas"**
   - University selector appears
   - Select university (or enter custom URL)
   - Enter Canvas Developer Key from Step 1
   - Click "Sign In with Canvas"

4. **Canvas login flow**
   - Browser opens Canvas login page
   - Log in with your Canvas credentials
   - Grant StudyBot access
   - Should redirect back to extension with user profile

5. **Check success**
   - User name and avatar should display
   - Courses should load
   - Social tab should be active

### Debugging

**If Canvas login fails:**

1. **Check extension ID matches redirect URI**
   - Go to `chrome://extensions`
   - Copy Extension ID
   - Should match Canvas Developer Key setup

2. **Check Canvas Developer Key**
   - Verify Client ID is correct
   - Verify Redirect URI is exact match
   - Check permissions/scopes are granted

3. **Check Canvas URL**
   - Make sure it's correct (e.g., `uk.instructure.com` not just `instructure.com`)
   - Should include `https://`

4. **Check console for errors**
   - Right-click extension → **Inspect**
   - Go to **Console** tab
   - Look for error messages
   - Common: "No authorization code received"

**If Supabase connection fails:**

1. Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in config
2. Verify Supabase project exists at that URL
3. Check if RLS policies might be blocking (should not for new users)

---

## Part 5: Deploy to Chrome Web Store

Once tested locally:

1. **Build package**
   ```bash
   cd extension
   zip -r ../studybot.zip . -x "*.git*" "node_modules/*" "*.env"
   ```

2. **Upload to Chrome Web Store**
   - [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click **+ New Item**
   - Upload `studybot.zip`
   - Fill in store listing

3. **Update Canvas URLs for all universities**
   - Expand `CANVAS_OAUTH.UNIVERSITY_URLS` in config
   - Add all institutions users might use

---

## Part 6: User Onboarding Flow

### What Users See

**Step 1: Welcome Screen**
```
📚 Welcome to StudyBot!
Study smarter with AI-powered tools and collaborate with classmates

1 Sign in with Canvas
2 Auto-sync your courses
3 Connect with classmates

[Sign In with Canvas] [Sign In with Google]
```

**Step 2: University Selection**
```
Select Your University

University: [Dropdown v]
- University of Kansas
- MIT
- Stanford
- ...
- Custom Canvas URL

Canvas URL: [https://...]
Canvas Developer Key: [...]

[Sign In with Canvas] [Cancel]
```

**Step 3: Canvas Login**
```
Redirects to Canvas login page...

StudyBot is requesting access to:
- Your profile
- Your courses
- Classmate information

[Authorize] [Cancel]
```

**Step 4: Success**
```
✨ Welcome, Jane!

Your courses are being loaded...

[Loading spinner]

This window will close in a moment
```

### Multi-University Support

Users from different universities each register their own Canvas Developer Key:
- Jane (University of Kansas) → `uk.instructure.com` + her Developer Key
- Bob (MIT) → `canvas.mit.edu` + his Developer Key
- Both can use same extension, different Canvas instances

---

## Part 7: Social Features Configuration

### Auto-Join Class Groups

After Canvas login:
1. Extension fetches user's courses
2. For each course, creates a `class_group` (if doesn't exist)
3. Auto-adds user to group
4. Group appears in Social tab

Example:
```
My Classes:
- CS 101: Intro to Computer Science
- MATH 200: Calculus II
- PSYCH 101: Intro to Psychology
```

Each becomes a class group where students can share notes and study sets.

### Study Set Sharing

Users can share study sets:
1. **With friends** - Select specific people
2. **With class** - Entire class group sees it
3. **Public** - Anyone with link can view (via share code)

Example share link:
```
https://studybot.dev/s/ABC123
```

---

## Part 8: Monitoring & Analytics

### Key Metrics to Track

1. **Canvas Login Success Rate**
   - % of users who complete Canvas OAuth
   - Helps identify problem universities

2. **Class Group Creation**
   - How many groups created per university
   - Average members per group

3. **Study Set Activity**
   - Sets created per user
   - Sets shared (internal vs class vs public)
   - Likes and comments

4. **Friend Connections**
   - Friend requests sent/accepted
   - Network size per user

### Logging

Add to `extension/lib/social-api.js`:
```javascript
async logActivity(activityType, targetId, metadata = {}) {
  // Already implemented - track user actions
  // Helps understand which features are used most
}
```

---

## Part 9: Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "No authorization code received" | Extension ID doesn't match Canvas Developer Key redirect URI |
| "Token exchange failed" | Canvas Client ID is incorrect or Canvas URL is wrong |
| "User profile not found" | Canvas API scopes not granted in Developer Key |
| "Supabase connection failed" | Check SUPABASE_URL and SUPABASE_ANON_KEY in config |
| "Can't see friends" | RLS policy might be too restrictive - check Supabase dashboard |
| "Study sets not appearing" | Check study_sets table has rows; might need to refresh |

### Debug Mode

Enable verbose logging:

```javascript
// In extension/lib/canvas-auth.js
class CanvasAuth {
  constructor() {
    this.DEBUG = true; // Set to true
  }
  
  handleCallback(code, canvasUrl, clientId) {
    if (this.DEBUG) console.log('Canvas OAuth:', { code, canvasUrl, clientId });
    // ... rest of code
  }
}
```

---

## Quick Reference

### Canvas URLs by Institution

```
University of Kansas:    uk.instructure.com
MIT:                     canvas.mit.edu
Stanford:                canvas.stanford.edu
UC Berkeley:             bcourses.berkeley.edu
University of Michigan:  umich.instructure.com
University of Illinois:  courses.illinois.edu
Georgia Tech:            gatech.instructure.com
Yale:                    yale.instructure.com
Princeton:               canvas.princeton.edu
Harvard:                 canvas.harvard.edu
```

### Files to Update for New Universities

1. `extension/lib/config.js` - Add URL to `UNIVERSITY_URLS`
2. `extension/manifest.json` - Add to `host_permissions`

---

## Next Steps

1. ✅ Register Canvas Developer Key
2. ✅ Update Extension ID in config
3. ✅ Set up Supabase project
4. ✅ Run database migration
5. ✅ Test Canvas login locally
6. ✅ Test social features (friends, sets, groups)
7. ✅ Deploy to Chrome Web Store
8. ✅ Monitor analytics and feedback

---

**Need help?** Check the main [CANVAS_SOCIAL_BUILD.md](./CANVAS_SOCIAL_BUILD.md) for technical details.
