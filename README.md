# StudyBot - AI-Powered Study Assistant Chrome Extension

**Status:** MVP Built | Phase 1 Scan Complete | Phase 2 Roadmap Complete  
**Current Version:** 1.0.0  
**Target Launch:** Chrome Web Store Q2 2026

---

## 🎯 What is StudyBot?

StudyBot is a Chrome extension that extracts text from any webpage and automatically generates:
- 📝 **AI Summaries** at 3 detail levels (brief, standard, detailed)
- 🃏 **Flashcards** with 3D flip animations
- 📋 **Quizzes** with scoring and progress tracking
- 📚 **Study Library** with persistent storage
- 🔄 **Export/Import** functionality (JSON)
- 🌙 **Dark/Light Mode** support

**Key Differentiator:** Canvas LMS integration — the ONLY extension that auto-syncs Canvas assignments and syllabi into study materials.

---

## 🚀 Getting Started

### Installation (Development)

1. **Clone the repo**
   ```bash
   git clone git@github.com:lucasbhatia/studybot.git
   cd studybot/extension
   ```

2. **Load into Chrome**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder
   - Refresh browser to see changes

3. **Test on a webpage**
   - Go to any webpage (Wikipedia, Medium, etc.)
   - Look for floating StudyBot button
   - Click to extract content
   - Study materials auto-generate

### Dependencies
- Chrome 120+ (Manifest V3)
- No external libraries required (vanilla JS)
- Optional: Claude API key (for real AI, not template-based)

---

## 📂 Project Structure

```
extension/
├── manifest.json              # Chrome extension config
├── background/
│   └── service-worker.js      # Service worker (Manifest V3)
├── content/
│   ├── content.js             # Page content extraction
│   └── content.css            # Content styles
├── popup/
│   ├── popup.html             # Study library UI
│   ├── popup.js               # Library logic
│   └── popup.css              # Library styles
├── sidepanel/
│   ├── sidepanel.html         # Main study interface
│   ├── sidepanel.js           # Study logic (flashcards, quiz, summary)
│   └── sidepanel.css          # Study styles
├── lib/
│   ├── storage.js             # Chrome storage wrapper
│   ├── ai-generator.js        # Template-based AI (TO REPLACE with Claude)
│   ├── canvas-api.js          # Canvas LMS client (TO CREATE)
│   ├── claude-api.js          # Claude API wrapper (TO CREATE)
│   └── share.js               # Export/share utilities
└── icons/
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon256.png
```

---

## 🔧 Development Workflow

### Creating a Feature Branch
```bash
git checkout -b feature/my-feature
# Make changes
git commit -m "Add feature description"
git push -u origin feature/my-feature
# Create PR on GitHub
```

### Building for Production
```bash
# Minify/bundle if using build tools
# For now: pure JS, just zip the extension folder
zip -r studybot.zip extension/
```

### Testing Checklist
- [ ] Content extraction works
- [ ] Flashcard navigation works (next/prev/shuffle)
- [ ] Card flip animation smooth
- [ ] Quiz questions display correctly
- [ ] Summary detail level changes work
- [ ] Export/import JSON works
- [ ] Dark/light mode toggle works
- [ ] No console errors
- [ ] Works on: Wikipedia, Medium, GitHub, Canvas

---

## 📋 Current Issues (P0 - Critical)

### ❌ Quiz Logic is Broken
- **Problem:** Answers are randomly generated, not validated
- **Impact:** Quiz is unplayable
- **Priority:** URGENT
- **Task:** P0-1

### ❌ AI Generation is Template-Based Only
- **Problem:** No semantic understanding, poor quality
- **Impact:** Study materials are low quality
- **Priority:** URGENT
- **Task:** P0-2

### ❌ Canvas Integration Missing
- **Problem:** Code stubs exist but API calls not implemented
- **Impact:** Key differentiator feature missing
- **Priority:** URGENT
- **Task:** P0-3

### ❌ Toast Notifications Don't Work
- **Problem:** `showNotification()` logs to console instead of UI
- **Impact:** Users don't get feedback on actions
- **Priority:** URGENT
- **Task:** P0-4

### ❌ No Error Handling
- **Problem:** Silent failures throughout
- **Impact:** Bugs hard to diagnose, poor UX
- **Priority:** URGENT
- **Task:** P0-5

---

## 🎯 Roadmap

### Phase 1: Full Scan ✅ DONE
- Code review
- Document issues
- Document working features

### Phase 2: Roadmap ✅ DONE
- Create detailed feature breakdown
- Estimate time per item
- Create Mission Control tasks

### Phase 3: Build P0 & P1 ⏳ IN PROGRESS
- Fix P0 critical items (13-15 days)
- Implement P1 core features
- Target: March 31, 2026

### Phase 4: Deployment ⏳ TODO
- Create Chrome Web Store checklist
- Prepare assets (icons, screenshots)
- Create privacy policy
- Submit to Chrome Web Store

### Phase 5: Monetization ⏳ TODO
- Implement freemium model ($5.99/month)
- Stripe integration
- Usage tracking

---

## 💻 Development Guide

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Modify files in `extension/`**
   ```javascript
   // Example: Add new function to sidepanel.js
   async function myNewFeature() {
     // implementation
   }
   ```

3. **Test in Chrome**
   - Chrome → Manage Extensions
   - Find "StudyBot - AI Study Assistant"
   - Click refresh
   - Test in browser

4. **Commit and push**
   ```bash
   git add extension/
   git commit -m "Add my-feature"
   git push origin feature/my-feature
   ```

5. **Create pull request**
   - GitHub → Pull Requests → New PR
   - Request review from @lucasbhatia

### Debugging

**Console errors:**
```javascript
// Open DevTools on extension
// Right-click extension icon → Inspect
// View console, network, storage
```

**Storage debugging:**
```javascript
// In console:
chrome.storage.local.get(null, (data) => console.log(data));
chrome.storage.sync.get(null, (data) => console.log(data));
```

**Content script issues:**
```javascript
// Send message from content script to service worker
chrome.runtime.sendMessage({ action: 'myAction' }, (response) => {
  console.log('Response:', response);
});
```

---

## 🔑 Configuration

### Claude API Key (Required for Real AI)
1. Get API key from https://console.anthropic.com
2. In extension settings: Enter API key
3. Extension will use Claude instead of templates

### Canvas LMS Credentials (Optional)
1. Canvas URL: `https://uk.instructure.com` (or your instance)
2. Canvas Token: Generate from Canvas account settings
3. In extension settings: Enter Canvas URL + token
4. Click "Test Connection" to verify

---

## 📊 Analytics & Metrics

Currently tracked in Chrome storage:
- Total study sets created
- Total flashcards
- Total cards studied
- Study streak

**To add:**
- API call costs (if using Claude)
- User engagement (session duration, features used)
- Error tracking (crash rate, errors per user)

---

## 🔒 Security & Privacy

**Data Storage:**
- Study sets stored in `chrome.storage.local` (not synced)
- Settings stored in `chrome.storage.sync` (synced across devices)
- Canvas credentials stored in `chrome.storage.sync` (encrypted by Chrome)

**External API Calls:**
- Claude API: Only if user provides API key
- Canvas API: Only if user provides Canvas credentials
- All HTTPS connections

**No tracking, no analytics, no data collection** (until monetization phase)

---

## 🚢 Deployment

### Chrome Web Store Submission

See `CHROME_STORE_CHECKLIST.md` for full requirements.

**Quick checklist:**
- [ ] All P0/P1 items complete
- [ ] Privacy policy published
- [ ] Icons (16, 48, 128, 256px) ready
- [ ] Screenshots ready
- [ ] No console errors
- [ ] Tested on real sites

**Submission steps:**
1. Create Chrome Developer account ($5)
2. Upload extension ZIP
3. Fill out listing details
4. Submit for review
5. Wait 1-24 hours for approval

---

## 💰 Monetization

**Model:** Freemium SaaS

**Free Tier:**
- 5 generations/month
- Template-based AI
- Full study library

**Paid Tier ($5.99/month):**
- Unlimited generations
- Real Claude AI
- Canvas LMS integration

See `MONETIZATION.md` for full business model.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `PHASE1_SCAN.md` | Full code review & findings |
| `ROADMAP.md` | Feature roadmap with time estimates |
| `CHROME_STORE_CHECKLIST.md` | Web Store submission requirements |
| `MONETIZATION.md` | Business model & pricing |
| `SUMMARY.md` | Executive summary |
| `README.md` | This file |

---

## 🤝 Contributing

### Code Style
- Use vanilla JavaScript (no frameworks/libraries)
- Use `async/await` for promises
- Comment complex logic with JSDoc
- Use descriptive variable names
- HTML entities for display (prevent XSS)

### Testing
- Test on multiple webpages
- Test in incognito mode (fresh extension install)
- Test with DevTools open (monitor console)
- Test dark/light mode toggle
- Test export/import cycle

### Pull Requests
- Describe what changed and why
- Link to relevant task/issue
- Test locally before submitting
- Request review from @lucasbhatia

---

## 🐛 Bug Reports

Found a bug? Create an issue on GitHub with:
1. **Title:** Brief description
2. **Steps to reproduce:** Exact steps
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happens
5. **Screenshots:** If applicable
6. **Browser version:** Chrome version

---

## 🎓 Learning Resources

**Chrome Extension Development:**
- https://developer.chrome.com/docs/extensions/
- https://developer.chrome.com/docs/extensions/mv3/
- https://github.com/GoogleChrome/chrome-extensions-samples

**Canvas LMS API:**
- https://canvas.instructure.com/doc/api/
- https://canvas.instructure.com/doc/api/courses.html

**Claude API:**
- https://docs.anthropic.com/
- https://console.anthropic.com/

---

## 💬 Support

**For questions:**
- Open GitHub issue
- Email: lucas@studybot.app (coming soon)
- Discord: Join OpenClaw community

---

## 📄 License

**Not yet decided.** Options:
- MIT (open source)
- Proprietary (closed source)
- Dual (free tier open, paid tier proprietary)

**Recommendation:** Start proprietary (simpler), consider open-sourcing core after launch.

---

## 🎯 Success Metrics

**By March 31, 2026:**
- 100% of P0 items complete
- 100% of P1 items complete
- Submitted to Chrome Web Store
- Approved (or feedback addressed)

**By April 30, 2026:**
- 5,000+ installs
- 500+ active monthly users
- 20+ paying customers

**By December 31, 2026:**
- 50,000+ installs
- 5,000+ active monthly users
- 500+ paying customers
- $2,500+ monthly recurring revenue

---

## 📞 Quick Links

- **GitHub:** https://github.com/lucasbhatia/studybot
- **Canvas API Token:** `1139~hX8xvhcxe3wzfytktEu8z7zrhPPZDtvzk2GUCMzNxuXJLmLvHBTnEAAazA8vcX4T`
- **Canvas URL:** `https://uk.instructure.com`
- **Mission Control:** Studio dashboard

---

**Last Updated:** Feb 16, 2026  
**Status:** MVP Complete, Ready for Phase 3 Build  
**Next Milestone:** March 31, 2026 (Web Store Submission)

Happy building! 🚀
