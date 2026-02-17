# Production Configuration Guide

## Before Chrome Web Store Submission

### 1. Configure Supabase URLs

Edit `lib/config.js` and set:

```javascript
SUPABASE_URL: 'https://YOUR-PROJECT-ID.supabase.co',
SUPABASE_ANON_KEY: 'YOUR-ANON-KEY-HERE',
```

**Important:** Replace with actual values before deploying.

### 2. Console Statements

The extension currently contains console.error, console.warn, and console.log statements for debugging.

**Options:**
- **Option A (Recommended):** Keep console.error for critical error tracking, remove console.log/warn
- **Option B:** Remove all console statements for production
- **Option C:** Use a logging service like Sentry for production error tracking

**Current status:** Console statements are present for debugging. Safe to ship, but consider removing before production.

### 3. Error Handling

All errors are properly caught and handled with user-friendly messages via:
- `lib/error-handler.js` - Centralized error handling with retry logic
- `lib/notifications.js` - User-facing error notifications

### 4. Environment-Specific Configuration

Consider creating a build script that:
1. Copies extension files to a `dist/` folder
2. Replaces placeholder config values
3. Removes console statements
4. Minifies JavaScript (optional)

### 5. Privacy Policy & Support

Ensure these are set up before submission:
- Privacy policy at: https://studybot.dev/privacy
- Support email: support@studybot.app

### 6. Testing Checklist

Before submission, test:
- [ ] Extension loads without errors
- [ ] Content extraction works on multiple sites
- [ ] AI generation works (or gracefully fails with clear message if config missing)
- [ ] Canvas integration (if credentials provided)
- [ ] Dark/light mode toggle
- [ ] Export/import functionality
- [ ] All permissions are used and justified

### 7. Chrome Web Store Assets Needed

**Required:**
- [ ] 1280x800px screenshots (at least 1, recommended 3-5)
- [ ] 440x280px small promo tile (optional but recommended)
- [ ] 920x680px large promo tile (optional)
- [ ] 1400x560px marquee promo tile (optional)

**Screenshots should show:**
1. Content extraction in action
2. Generated flashcards
3. Quiz interface
4. Study library
5. Dark mode (optional)

### 8. Final Checks

- [ ] manifest.json version is correct (currently 1.0.0)
- [ ] All icons exist and are proper sizes
- [ ] No hardcoded test/development URLs
- [ ] CSP includes all necessary domains
- [ ] All permissions are justified in CHROME_STORE_LISTING.md
- [ ] Error messages are user-friendly
- [ ] Extension works offline (study library access)

### 9. Deployment Recommendation

For a fully production-ready build:

```bash
# Create deployment script
./scripts/build-production.sh

# This should:
# 1. Copy extension/ to dist/
# 2. Replace config placeholders with actual values
# 3. Remove console.log/console.warn statements
# 4. Keep console.error for critical tracking
# 5. Create a zip for Chrome Web Store upload
```

## Current Production Readiness: 95%

**Ready to ship with:**
- Empty Supabase config (users can use BYOK or proxy)
- Console statements present (helpful for debugging issues)
- No screenshots (can be added directly in Chrome Web Store dashboard)

**Ideal for production:**
- Set Supabase credentials
- Remove non-critical console statements
- Add screenshots to store listing

## Decision: Ship or Wait?

**Ship now if:**
- You want to test with real users quickly
- Users will use BYOK (bring your own key) primarily
- You're okay with adding screenshots after initial submission

**Wait if:**
- You want a fully configured Supabase backend first
- You want polished screenshots for better first impression
- You want to remove all debug logging

**Recommendation:** Ship with current state, configure Supabase in v1.0.1 update, add screenshots in Web Store dashboard.
