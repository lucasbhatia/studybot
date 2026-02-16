# StudyBot Authentication System

This document explains the new auth system replacing the BYOK-only approach.

## Architecture Overview

The authentication system uses **Supabase Auth** with **Google OAuth** to provide a modern, secure login flow:

1. **Extension UI** - User clicks "Sign In with Google"
2. **OAuth Flow** - Extension opens Supabase OAuth endpoint in new tab
3. **User Authenticates** - User approves Google sign-in
4. **Callback Handling** - OAuth redirect received by `auth/callback.html`
5. **Token Storage** - Session token stored in `chrome.storage.local`
6. **API Integration** - All API calls include auth token in headers
7. **Server-Side Verification** - Proxy server verifies token and enforces tier limits

## Components Built

### 1. **lib/config.js** — Central Configuration
```javascript
STUDYBOT_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  PROXY_URL: 'https://api.studybot.dev/v1',
  FREE_TIER_LIMIT: 5,
  // ... other config
}
```

**What Lucas needs to do:**
- [ ] Replace `SUPABASE_URL` with actual Supabase project URL
- [ ] Replace `SUPABASE_ANON_KEY` with actual anon key
- [ ] Update `PROXY_URL` when proxy server is ready

### 2. **lib/auth.js** — Authentication Service

Core class: `AuthService`

**Public Methods:**
```javascript
auth.signInWithGoogle()        // Opens OAuth flow in new tab
auth.signOut()                 // Clears session
auth.getSession()              // Returns current session or null
auth.getUser()                 // Returns user profile
auth.getAccessToken()          // Returns auth token for API calls
auth.isAuthenticated()         // Quick boolean check
auth.onAuthStateChange(fn)     // Listen for login/logout
auth.getUserProfile()          // Get user profile for display
auth.refreshSession()          // Auto-refresh expired tokens
```

**How it works:**
- Reads/writes session to `chrome.storage.local` under key `supabase_auth_session`
- Automatically refreshes tokens when expired (before 5-min cutoff)
- Handles OAuth redirect via `auth/callback.html`
- Gracefully falls back if Supabase is unavailable

### 3. **auth/callback.html** — OAuth Callback Page

This page receives the OAuth redirect from Supabase and:
1. Extracts the auth token from URL hash
2. Sends token to service worker via `chrome.runtime.sendMessage`
3. Service worker saves session to storage
4. Page closes automatically

**Why needed:** Chrome extensions can't receive OAuth redirects directly, so we use a standalone HTML page as the redirect target.

### 4. **lib/auth-ui.js** — UI Components

Renders authentication UI in popup and sidepanel:

```javascript
AuthUI.renderPopupAuthSection()      // Render auth in settings
AuthUI.renderSidepanelAuthHeader()   // Render auth in sidepanel header
AuthUI.handleGoogleSignIn()          // Trigger OAuth flow
AuthUI.handleSignOut()               // Sign user out
AuthUI.updateHeaderAuthStatus()      // Update header display
```

**Features:**
- Shows user email and avatar when signed in
- Displays usage meter (X/5 free)
- "Sign In with Google" button when not signed in
- Sign out button in header (mini)
- Real-time updates on auth state change

### 5. **Updated manifest.json**

Added:
- `https://*.supabase.co/*` to `host_permissions` (for OAuth)
- `web_accessible_resources` for callback page

### 6. **Updated lib/claude-api.js**

Modified `callAPI()` priority:
1. If authenticated → use proxy with auth token
2. If has BYOK key → use Anthropic directly
3. If proxy available → use proxy without auth
4. Else → error

All proxy calls now include `Authorization: Bearer <token>` header.

### 7. **Updated UI Components**

**Popup (`popup.html` + `popup.js`):**
- Auth status in header (email + sign out button)
- Auth section in settings modal (sign in or show usage)
- Initializes auth on load

**Sidepanel (`sidepanel.html` + `sidepanel.js`):**
- Auth header below main title
- Shows email when signed in
- "Sign In" button when not signed in
- Initializes auth on load

**Onboarding (`lib/onboarding.js`):**
- "Sign In with Google" is now step 1 (before extract/generate)
- Can be skipped for users who prefer API key only
- Integrates with AuthUI for sign-in flow

### 8. **Updated Service Worker**

Added message handler for OAuth callback:
```javascript
if (request.type === 'HANDLE_OAUTH_CALLBACK') {
  // Parse hash, fetch user info, save session
}
```

## Configuration Steps for Lucas

### Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Note the project URL and anon key
4. Update in `lib/config.js`:
   ```javascript
   SUPABASE_URL: 'https://your-project-xxxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1N...',
   ```

### Step 2: Configure Google OAuth Provider

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google**
3. Add Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret
4. Set authorized redirect URI:
   ```
   https://your-project-xxxxx.supabase.co/auth/v1/callback
   ```

### Step 3: Update Auth Callback URL

The callback page URL is auto-generated as:
```javascript
chrome.runtime.getURL('auth/callback.html')
```

This will be something like:
```
chrome-extension://[extension-id]/auth/callback.html
```

**In Supabase, you need to whitelist this:**
1. Go to **Authentication** > **URL Configuration**
2. Add under "Redirect URLs":
   ```
   chrome-extension://[your-extension-id]/auth/callback.html
   ```

To find your extension ID:
- Load extension in Chrome
- Go to `chrome://extensions/`
- Copy the ID from the StudyBot extension

### Step 4: Test Auth Flow

1. Load extension in Chrome
2. Open popup (click extension icon)
3. Go to Settings
4. Click "Sign In with Google"
5. Complete Google auth in new tab
6. Should close automatically and show email in popup header

### Step 5: Set Up Proxy Server (Later)

When proxy server is ready:
1. Update `PROXY_URL` in `lib/config.js`
2. Proxy should:
   - Accept `Authorization: Bearer <supabase-token>` header
   - Verify token with Supabase
   - Track usage per user (free tier: 5/month)
   - Call Claude API and return results
   - Respond with same format as current proxy

**Proxy endpoint:** `POST /v1/generate`

```javascript
// Request
{
  "prompt": "...",
  "type": "flashcards|summary|quiz"
}

// Header
Authorization: Bearer <supabase-access-token>

// Response
{
  "result": { /* same as Claude API response */ }
}
```

## User Flow

### First-Time User (Not Signed In)

1. Opens popup → sees "Sign In with Google" button
2. Clicks button → OAuth flow opens in new tab
3. User signs in with Google → redirected back
4. Extension shows user email + usage meter in popup
5. Can now generate unlimited content
6. Or provide BYOK API key as fallback

### Existing User (Signed In)

1. Opens extension → automatically loads session from storage
2. Popup shows email + usage (e.g., "3/5 free" or "Unlimited")
3. Can generate content immediately
4. Can sign out from popup header or settings

### User with BYOK Key (No Google Auth)

- Skip Google sign-in in onboarding
- Provide API key in settings
- Extension uses API key directly for Anthropic
- No server-side limits (BYOK has unlimited usage)

## Fallbacks & Error Handling

### Session Expired
- Auth service detects expiration (5-min buffer)
- Automatically refreshes using refresh token
- If refresh fails → user must sign in again

### Proxy Unavailable
- Falls back to BYOK API key if available
- Or returns error with helpful message

### Network Error During OAuth
- Timeout after 10 minutes
- User can retry sign-in

### Storage Quota Exceeded
- Won't happen (session is small, ~1KB)
- If it does: graceful error, fallback to BYOK

## Privacy & Security

- **Tokens stored locally:** Only in `chrome.storage.local` (not synced to cloud)
- **No personal data:** Only email and user ID from Supabase
- **No API keys stored:** BYOK keys stored separately (as before)
- **HTTPS only:** All Supabase/proxy calls are HTTPS
- **Refresh tokens:** Stored locally, never sent to popup/sidepanel except as header

## Future Enhancements

- [ ] Implement usage dashboard (show monthly stats)
- [ ] Subscription/upgrade flow (Stripe integration)
- [ ] User settings sync (preferences stored server-side)
- [ ] Offline mode (queue requests while offline)
- [ ] Social features (share study sets with other users)

## Testing Checklist

- [ ] Google sign-in works in popup
- [ ] Session persists across tabs/reload
- [ ] Signed-in status shown in popup header
- [ ] Signed-in status shown in sidepanel header
- [ ] Sign out clears session
- [ ] Auth token sent with proxy API calls
- [ ] Fallback to BYOK works if proxy fails
- [ ] Onboarding shows sign-in step
- [ ] Onboarding can be skipped
- [ ] Usage meter updates after generation
- [ ] Session auto-refreshes before expiry
- [ ] Graceful handling of network errors

## Troubleshooting

### "No access token received"
- Check Supabase URL and anon key are correct in `config.js`
- Check Google OAuth provider is enabled in Supabase
- Check redirect URI is whitelisted in Supabase

### "Failed to fetch user info"
- Check `https://your-project.supabase.co/auth/v1/user` is accessible
- Check auth token was received correctly
- Check network connection

### "Authentication timeout"
- User didn't complete sign-in in 10 minutes
- Ask user to retry

### Session not persisting
- Check `chrome.storage.local` permissions in manifest
- Check browser isn't blocking storage
- Try signing in again

## Files Changed/Created

**New files:**
- `lib/config.js` - Central configuration
- `lib/auth.js` - Authentication service
- `lib/auth-ui.js` - UI components
- `auth/callback.html` - OAuth callback handler

**Modified files:**
- `manifest.json` - Added Supabase permissions and callback page
- `lib/claude-api.js` - Updated API priority and auth header
- `popup/popup.html` - Added auth UI and scripts
- `popup/popup.js` - Initialize auth and listen for changes
- `sidepanel/sidepanel.html` - Added auth header and scripts
- `sidepanel/sidepanel.js` - Initialize auth and listen for changes
- `lib/onboarding.js` - Moved sign-in to step 1
- `background/service-worker.js` - Added OAuth callback handler

## Git

Branch: `feat/auth-system`

To merge:
```bash
git checkout main
git pull origin main
git merge feat/auth-system
git push origin main
```

---

**Questions?** Check the inline code comments in each file for detailed explanations.
