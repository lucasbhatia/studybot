# StudyBot - Chrome Web Store Submission Checklist

**Target Launch:** Q2 2026  
**Checklist Status:** Pre-submission (not ready yet)

---

## 📋 Pre-Submission Requirements

### Account & Registration
- [ ] Create Chrome Developer account ($5 one-time)
- [ ] Accept Chrome Web Store developer agreement
- [ ] Set up payment method (if selling)
- [ ] Verify email address
- [ ] Add contact email for support inquiries

### Extension Assets

#### Icons (Required)
- [ ] **128x128px** icon (primary icon)
- [ ] **16x16px** icon (browser toolbar)
- [ ] **32x32px** icon (Windows taskbar, etc.)
- [ ] **48x48px** icon (settings page, etc.)
- [ ] **256x256px** icon (Chrome Web Store)
- [ ] All icons must be PNG or JPG
- [ ] Must be original artwork (no AI-generated images without disclosure)

#### Screenshots (Required - 2-5 recommended)
- [ ] **1280x800px** minimum resolution
- [ ] Show key features:
  1. Content extraction floating button
  2. Study set library / popup view
  3. Flashcard flip animation
  4. Quiz mode with scoring
  5. Summary at different detail levels
- [ ] Can include text overlays explaining features
- [ ] PNG or JPG format

#### Promotional Tile (Optional but recommended)
- [ ] **1400x560px** for Chrome Web Store banner
- [ ] Eye-catching design
- [ ] Show the extension in action

#### Small Tile (Optional)
- [ ] **440x280px** for category pages

### Listing Content

#### Extension Name
- [ ] "StudyBot - AI Study Assistant" (max 45 characters)
- [ ] Concise and descriptive
- [ ] No keyword stuffing

#### Short Description (required)
- [ ] Max 132 characters
- [ ] Example: "AI-powered flashcards, quizzes, and summaries from any webpage"

#### Detailed Description (required)
- [ ] Max 4,000 characters
- [ ] Highlight features:
  - Extract text from any webpage
  - AI-generated flashcards, quizzes, summaries
  - 3D flip flashcard animations
  - Study library with persistence
  - Export/import study sets
  - Dark/light mode
  - **Canvas LMS integration (unique selling point)**
  - Spaced repetition (if implemented)
- [ ] Mention Canvas integration prominently
- [ ] Include use cases (students, learners, professionals)
- [ ] Mention privacy and data handling

#### Category
- [ ] Select: "Productivity" or "Education"

#### Language
- [ ] English (primary)
- [ ] Others if available

### Privacy & Compliance

#### Privacy Policy (CRITICAL - Required)
- [ ] Must be published on a website (not in manifest)
- [ ] Must clearly state:
  - What data is collected (usage stats, study content)
  - How data is stored (Chrome storage, Supabase)
  - Whether data is shared with third parties (Claude API, Canvas API)
  - User rights (deletion, export, GDPR compliance)
  - Contact information for privacy questions
- [ ] Link in extension popup/settings
- [ ] URL format: `https://yoursite.com/privacy`

**Example Privacy Policy Template:**
```markdown
# Privacy Policy - StudyBot

## Data Collection
- Study sets and flashcards (stored locally in Chrome storage)
- Quiz results and study streaks
- User settings (dark mode, detail level preference)
- Usage analytics (number of generations, active hours)

## Data Storage
- Primary: Chrome local/sync storage (encrypted)
- Optional: Supabase (if user enables Cloud Sync)
- Optional: Canvas LMS (if user connects Canvas)

## API Calls
- Claude API: Summaries, flashcards, quizzes (API key required)
- Canvas API: Course content (token required, if enabled)
- All API calls encrypted via HTTPS

## User Rights
- Export all data: Download all study sets as JSON
- Delete all data: One-click deletion of all sets
- No data tracking without consent

## Contact
support@studybot.app
```

#### Terms of Service (Recommended)
- [ ] Published on website
- [ ] Covers:
  - Acceptable use (no illegal content, no cheating on exams)
  - Liability disclaimer
  - Intellectual property (user owns study sets, StudyBot owns extension code)
  - Warranty disclaimer
  - Termination conditions
- [ ] Link in extension

#### Permissions Justification (CRITICAL)
- [ ] Document why each permission is needed:

**Current manifest permissions:**
```json
{
  "permissions": [
    "storage"           // Why: Save study sets locally
    "scripting"         // Why: Extract text from webpage
    "sidePanel"         // Why: Display study interface
    "contextMenus"      // Why: Right-click "Extract" menu
    "tabs"              // Why: Get current tab info
  ],
  "host_permissions": [
    "https://*/*",      // Why: Extract from any webpage
    "https://uk.instructure.com/*"  // Why: Canvas LMS integration
  ]
}
```

**Before submission, update manifest to:**
```json
{
  "host_permissions_reason": "Extract content from any webpage for study material generation. Canvas LMS integration for course content.",
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Technical Requirements

#### Manifest Validation
- [ ] No eval() or dynamic code execution
- [ ] No external scripts loaded (all bundled)
- [ ] No unsafe-eval in CSP
- [ ] All code must be reviewable (no minified code without source maps)
- [ ] Manifest v3 compliant (already done ✓)

#### Security
- [ ] No key material (API keys) hardcoded
- [ ] User provides their own Claude API key (or uses proxy)
- [ ] User provides their own Canvas API token
- [ ] HTTPS enforced for all external calls
- [ ] No localStorage (use chrome.storage)
- [ ] XSS protection verified (HTML escaping in place ✓)

#### Performance
- [ ] Extension loads in < 2 seconds
- [ ] No memory leaks (test with 100+ study sets)
- [ ] Permissions are minimal & justified
- [ ] No background processes consuming CPU

#### Functionality Test Checklist
- [ ] Floating button appears on all webpages
- [ ] Content extraction works correctly
- [ ] AI generation produces usable results
- [ ] Flashcard flip animation is smooth
- [ ] Quiz scoring is accurate
- [ ] Export/import JSON works
- [ ] Settings save and persist
- [ ] Dark/light mode toggle works
- [ ] No console errors in devtools
- [ ] Works on major websites (Wikipedia, Medium, GitHub, Canvas)

### Review Considerations

#### Common Rejection Reasons (Avoid These)
- [ ] ❌ Using eval() or dynamic code execution
- [ ] ❌ Hardcoded API keys
- [ ] ❌ Privacy policy doesn't exist or is insufficient
- [ ] ❌ Unclear permissions with no justification
- [ ] ❌ Misleading description (e.g., saying "free forever" if it's freemium)
- [ ] ❌ Doesn't match screenshots or description
- [ ] ❌ Poor user experience (crashes, doesn't work)
- [ ] ❌ Violates Chrome Web Store policies (no hate speech, gambling, etc.)
- [ ] ❌ Excessive permissions (requesting <all_urls> without justification)

#### Things Google Reviewers Check
1. **Does it work?** Install and test basic functionality
2. **Is it safe?** Check for malware, phishing, exploitation
3. **Does it match description?** Screenshots and features align
4. **Are permissions justified?** Every permission has a clear use
5. **Privacy compliant?** GDPR, privacy policy, data handling

---

## 📝 Submission Steps

### Step 1: Prepare Files
```bash
# 1. Build final version
npm run build  # or whatever your build command is

# 2. Create zip file with all extension files
zip -r studybot.zip \
  manifest.json \
  popup/ \
  sidepanel/ \
  background/ \
  content/ \
  lib/ \
  icons/

# 3. Verify file structure
unzip -l studybot.zip
```

### Step 2: Developer Dashboard Upload
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `studybot.zip`
4. Review warning messages (likely just about file size or permissions)
5. Fix any critical issues, re-upload

### Step 3: Fill Out Listing
1. Fill in all required fields:
   - Name
   - Short description
   - Detailed description
   - Category
   - Language
2. Upload icons (16, 48, 128, 256px)
3. Upload 2-5 screenshots
4. Add links:
   - Privacy policy URL
   - Terms of service URL (if applicable)
   - Support email
5. Set pricing:
   - Free with in-app purchases
   - Paid ($4.99/month recommended)
   - Free

### Step 4: Review & Publish
1. Check "I confirm I've reviewed..." checkbox
2. Click "Submit for Review"
3. Wait 1-3 hours to 24 hours (Google reviews automatically)
4. Check email for approval or rejection

### Step 5: Handle Review Feedback
- If rejected: Review error message, fix issue, re-submit
- If approved: Celebrate! 🎉
- Monitor for crashes and bad reviews in first week

---

## 🚀 Post-Launch Checklist

### First Week
- [ ] Monitor installation numbers
- [ ] Check for 1-star reviews and fix critical issues
- [ ] Verify no crash reports
- [ ] Test on different browsers (Chrome stable, beta, dev)

### First Month
- [ ] Reach 100+ active users
- [ ] Respond to user feedback
- [ ] Fix any bugs reported
- [ ] Plan first feature update (Canvas integration, better AI, etc.)

### Ongoing
- [ ] Update extension every 2-4 weeks with new features
- [ ] Monitor Chrome Web Store for new requirements
- [ ] Keep dependencies up to date
- [ ] Respond to user reviews and support emails

---

## 🎯 Launch Readiness Scorecard

| Item | Status | Notes |
|------|--------|-------|
| **Manifest V3** | ✅ Done | Already compliant |
| **Icons (all sizes)** | ⏳ TODO | Need 16, 32, 48, 128, 256 PNG |
| **Screenshots (2-5)** | ⏳ TODO | 1280x800px, show key features |
| **Privacy Policy** | ⏳ TODO | Published on website |
| **Terms of Service** | ⏳ TODO | Published on website |
| **Permissions Justified** | ⏳ TODO | Add host_permissions_reason |
| **CSP Headers** | ⏳ TODO | Add to manifest |
| **No Hardcoded Keys** | ⏳ TODO | API keys configured via UI |
| **No Eval() Usage** | ✅ Check | Needs verification |
| **XSS Protection** | ✅ Done | HTML escaping in place |
| **Error Handling** | ⏳ TODO | Toast notifications, retry logic |
| **Tested on Real Sites** | ⏳ TODO | Wikipedia, Medium, GitHub, Canvas |
| **Freemium Model** | ⏳ TODO | Define free vs paid limits |
| **Analytics Stripped** | ⏳ TODO | No tracking code before launch |

**Current Status:** 4/13 items done → **31% Ready**

**Target: 100% by April 1, 2026**

---

## 💰 Pricing Strategy

### Option 1: Completely Free (Unlikely)
- All features free forever
- No revenue
- Good for portfolio

### Option 2: Freemium (Recommended)
- **Free tier:** 
  - 5 generations/month
  - Basic templates only
  - Standard summary detail level
  - No Canvas integration
  - Ads optional
- **Paid tier ($4.99-7.99/month):**
  - Unlimited generations
  - Claude API access
  - All summary detail levels
  - Canvas LMS integration
  - No ads
  - Early access to new features

### Option 3: Premium Only
- Extension costs $2.99 one-time
- No recurring billing (simpler for users, less revenue)
- Not recommended for SaaS model

### Option 4: Trial + Paid
- 7-day free trial (all features)
- Then locked behind paywall
- High conversion, low trial abuse

**Recommendation:** Option 2 (Freemium)
- Lowest barrier to entry
- Converts 5-10% of users to paid
- Sustainable revenue model
- Easy to implement

---

## 🔗 Resources

- [Chrome Web Store Developer Docs](https://developer.chrome.com/docs/webstore/)
- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Review Guidelines](https://developer.chrome.com/docs/webstore/review-guidelines/)
- [Privacy Policy Best Practices](https://developer.chrome.com/docs/webstore/privacy/)

---

**Estimated Time to Readiness:** 10-15 hours  
**Estimated Review Wait Time:** 1-3 hours (usually instant)  
**First Version Launch Goal:** March 15, 2026

---

**End of Chrome Store Checklist**
