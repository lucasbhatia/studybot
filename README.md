# StudyBot 📚 — AI Study Assistant Chrome Extension

> Transform any webpage into interactive study materials instantly.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore/category/extensions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)]()

---

## 🚀 Features

### ✨ Smart Content Extraction
- Extract text from any webpage with one click
- Preserves document structure (headings, lists, tables, code blocks)
- Works on Wikipedia, Medium, News sites, Academic papers, and more

### 🧠 AI-Powered Study Materials
- **Flashcards** — Auto-generated with semantic understanding
- **Summaries** — Choose your detail level (brief, standard, detailed)
- **Quizzes** — Multiple-choice with instant feedback and scoring
- **API Options** — Use your own Claude API key or our free proxy (5/month)

### 🎓 Canvas LMS Integration ⭐
- Connect directly to Canvas at your university
- Browse courses, modules, and assignments
- **One-click study set creation** from assignments
- Perfect for university students

### 📚 Study Library
- Save and organize unlimited study sets
- Full-text search across materials
- View stats: total sets, flashcards, study streak
- Export as JSON for backup and sharing

### 🎯 Interactive Study Tools
- **Flashcards** with smooth flip animations
- **Shuffle** for random practice
- **Quiz Mode** with answer validation and scoring
- **Dark/Light Mode** for comfortable studying

---

## 📦 Installation

### From Chrome Web Store (Recommended)
1. Visit [StudyBot on Chrome Web Store](#)
2. Click "Add to Chrome"
3. Confirm permission request
4. Start extracting content!

### From Source (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/lucasbhatia/studybot.git
   cd studybot
   ```

2. Install in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Extension appears in your toolbar

---

## 🎯 Quick Start

### 1. Extract Content
- Click the **StudyBot** button on any webpage
- Content is automatically extracted and analyzed

### 2. Choose Study Materials
- **Flashcards** — Generate cards from key concepts
- **Summary** — Get an AI-powered overview
- **Quiz** — Test your knowledge

### 3. Study & Learn
- Use interactive flashcards to learn
- Take quizzes for self-assessment
- Track your progress

### 4. (Optional) Connect Canvas
- Go to Canvas tab in the sidepanel
- Enter your Canvas URL and API token
- Browse courses and create study sets from assignments

---

## ⚙️ Setup Guide

### Option 1: Use Your Own Claude API Key (Unlimited)
1. Get your API key from https://console.anthropic.com/account/keys
2. Open StudyBot settings
3. Paste your API key in the "Claude API Key" field
4. Click "Test" to verify
5. Now you have unlimited generations!

### Option 2: Use Our Free Proxy (5/month)
- No setup required
- Click extract and generate
- Free tier: 5 generations per calendar month
- Resets on the 1st of each month

### Option 3: Canvas Integration (Optional)
1. Go to your Canvas instance
2. Get your API token from Account Settings
3. Copy your Canvas URL (e.g., `https://uk.instructure.com`)
4. In StudyBot, go to "Canvas" tab
5. Enter URL and token
6. Browse your courses and assignments!

---

## 📖 How It Works

### Content Extraction
```
Webpage → Content Script → Extract Text, Headings, Lists, Tables
           ↓
      StorageManager → Store in chrome.storage
           ↓
      Display in Sidepanel
```

### AI Generation
```
User clicks "Generate"
           ↓
      ┌─────────────────────┐
      │ Check API Config    │
      └─────────────────────┘
           ↓
      ┌─────────────────────────────────────────┐
      │ Try Claude API (BYOK or Proxy)          │
      │ - Generate Flashcards (10 max)          │
      │ - Generate Summary (3 detail levels)    │
      │ - Generate Quiz (5-10 questions)        │
      └─────────────────────────────────────────┘
           ↓
      ┌─────────────────────┐
      │ Success? Show UI    │ ← Yes
      │ Fail? Fallback      │ → No
      │      to Templates   │
      └─────────────────────┘
```

### Canvas Integration
```
User enters Canvas token
           ↓
CanvasAPIClient authenticates
           ↓
Fetch courses, modules, assignments
           ↓
Display in UI
           ↓
User selects assignment
           ↓
Extract assignment content
           ↓
Generate study materials (via Claude)
           ↓
Create study set
```

---

## 🎨 UI/UX Features

### Dark Mode
- Automatic detection of system preferences
- Manual toggle in settings
- Consistent colors across all views

### Responsive Design
- Works at any popup size
- Scrollable content for long texts
- Touch-friendly buttons

### Animations
- Smooth flashcard flip (3D transform)
- Tab transitions
- Modal fade in/out
- Toast notifications

---

## 🔐 Privacy & Security

### Data Storage
- **Local-first architecture:** All study sets stored on your device (chrome.storage)
- **No data selling:** We never sell or share your data
- **No AI training:** Your study materials are NOT used to train models
- **Optional cloud:** Canvas integration only if you enable it
- **Encrypted:** Chrome automatically encrypts storage

### What We Access
- **Your content:** Only when you extract it (for AI generation)
- **Canvas API:** Only if you connect Canvas (optional)
- **Claude API:** Only if you provide your key (optional)
- **Nothing else**

### User Rights
- **Export:** Download all study sets as JSON
- **Delete:** Remove all data with one click
- **Opt-out:** Don't use Canvas or Claude API features
- **GDPR compliant:** You have full control of your data

👉 See [Privacy Policy](PRIVACY_POLICY.md) and [Terms of Service](TERMS_OF_SERVICE.md)

---

## 🛠️ Architecture

```
extension/
├── content/
│   ├── content.js         # Content script (webpage injection)
│   └── content.css        # Floating button styles
│
├── popup/
│   ├── popup.html         # Study library UI
│   ├── popup.js           # Library logic
│   └── popup.css          # Library styles
│
├── sidepanel/
│   ├── sidepanel.html     # Study panel UI
│   ├── sidepanel.js       # Study logic (flashcards, quiz, etc)
│   └── sidepanel.css      # Study panel styles
│
├── background/
│   └── service-worker.js  # Background service worker
│
├── lib/
│   ├── claude-api.js      # Claude API wrapper
│   ├── canvas-api.js      # Canvas LMS API client
│   ├── ai-generator.js    # Study material generation
│   ├── storage.js         # Data persistence
│   ├── notifications.js   # Toast notifications
│   ├── error-handler.js   # Error management
│   ├── usage-tracker.js   # Freemium limits
│   ├── onboarding.js      # First-time UX
│   └── share.js           # Share functionality
│
├── icons/
│   ├── icon16.png         # Chrome toolbar
│   ├── icon32.png         # Windows taskbar
│   ├── icon48.png         # Settings page
│   ├── icon128.png        # App shelf
│   └── icon256.png        # Chrome Web Store
│
└── manifest.json          # Extension configuration
```

---

## 📊 Data Flow

### Study Set Creation
```
┌─────────────────────┐
│ Extract Content     │
│ (via content.js)    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Check Usage Limit   │
│ (freemium 5/mo)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Generate Materials  │
│ (Claude or template)│
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Save Study Set      │
│ (chrome.storage)    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Display in Popup    │
└─────────────────────┘
```

### Quiz Flow
```
┌────────────────────┐
│ Load Study Set     │
│ (from storage)     │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Generate Questions │
│ (from flashcards)  │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Display Q1         │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ User Selects Option│
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Validate Answer    │
│ Update Score       │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Show Feedback      │
└─────────┬──────────┘
          ↓
┌────────────────────┐
│ Next Question?     │
│ Yes ↓ / No → Done  │
└────────────────────┘
```

---

## 🧪 Testing

### Manual Testing Scenarios

**Scenario 1: Basic Extraction**
1. Open Wikipedia article
2. Click StudyBot button
3. Verify content extracts
4. Generate flashcards
5. Check UI displays them

**Scenario 2: Quiz Mode**
1. Create study set
2. Click "Quiz"
3. Answer 5 questions
4. Verify scoring is correct
5. Check feedback

**Scenario 3: Canvas Integration**
1. Add Canvas token in settings
2. View courses
3. Click course → assignments
4. Create study set from assignment
5. Verify content extracted

**Scenario 4: Dark Mode**
1. Toggle dark mode in settings
2. Check popup looks good
3. Check sidepanel looks good
4. Verify all text readable

**Scenario 5: Error Handling**
1. Try to extract from blank page → error shown
2. Use invalid API key → error shown
3. Disconnect internet → error shown
4. Import invalid JSON → error shown

---

## 🐛 Known Issues

None at this time. Please report issues on [GitHub Issues](https://github.com/lucasbhatia/studybot/issues).

---

## 🚀 Roadmap (Phase 2 & 3)

### Phase 2 (Current)
- [x] Integration testing
- [x] UI polish
- [x] Chrome Web Store assets
- [ ] Final verification
- [ ] Chrome Web Store submission

### Phase 3 (Future)
- [ ] Spaced repetition algorithm (SM-2)
- [ ] Dark mode improvements
- [ ] Performance optimization
- [ ] Web dashboard
- [ ] Mobile app (iOS/Android)
- [ ] Google Classroom integration
- [ ] Blackboard integration
- [ ] Voice-based quizzing

---

## 📈 Metrics & Performance

### Performance Targets
- **Extension load time:** < 2 seconds
- **Content extraction:** < 1 second
- **AI generation:** 3-5 seconds (varies by content)
- **Memory usage:** < 50 MB
- **Popup width:** 300-600px (responsive)

### Usage Limits (Free Tier)
- **5 generations per month** via proxy
- Resets on 1st of each month
- Unlimited with your own API key

---

## 💡 Tips & Tricks

### Get the Most Out of StudyBot

1. **Use your own Claude API key** for unlimited generations
2. **Connect Canvas** for seamless university integration
3. **Export study sets** regularly for backup
4. **Use detail levels** (brief/standard/detailed) for customized summaries
5. **Shuffle flashcards** to avoid memorizing order
6. **Take quizzes** multiple times to test retention

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
git clone https://github.com/lucasbhatia/studybot.git
cd studybot
# Load unpacked extension into Chrome from extension/ folder
# Make changes and reload extension (Ctrl+R in extensions page)
```

### Code Style
- Use ES6+ syntax
- Add comments for complex logic
- Follow existing naming conventions
- Test your changes before committing

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

### Getting Help
- 📧 Email: support@studybot.app
- 🐛 Report bugs: [GitHub Issues](https://github.com/lucasbhatia/studybot/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/lucasbhatia/studybot/discussions)

### Frequently Asked Questions

**Q: Is my data safe?**  
A: Yes! All data is stored locally on your device. We never access or sell your study materials.

**Q: Can I use this offline?**  
A: The extension works offline for studying. AI generation requires internet (to call Claude API).

**Q: How do I get more than 5 generations per month?**  
A: Add your own Claude API key in settings for unlimited generations.

**Q: Does this work with Blackboard/Google Classroom?**  
A: Currently Canvas only. Other LMS integrations coming in Phase 3.

**Q: Can I export my study sets?**  
A: Yes! Click "Export" on any study set to download as JSON. Import anytime.

---

## 🌟 Star Us!

If StudyBot has been helpful, please consider giving us a ⭐ on GitHub!

---

## 📱 Platform Support

- ✅ Chrome (Recommended)
- ✅ Chromium-based browsers (Edge, Brave, Opera)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

---

## 🎯 Vision

StudyBot aims to make learning more efficient and accessible for everyone. By combining AI technology with modern study techniques, we're helping students:
- **Save time** on material preparation
- **Learn better** with interactive tools
- **Study smarter** with AI-generated questions
- **Integrate seamlessly** with their university systems

---

**Built with ❤️ by [Lucas Bhatia](https://github.com/lucasbhatia)**

---

## Changelog

### [1.0.0] - 2026-02-16
- ✨ Initial launch
- 🧠 AI-powered flashcards, summaries, quizzes
- 🎓 Canvas LMS integration
- 📚 Study library with persistence
- 🌙 Dark/light mode support
- 🔐 Privacy-first architecture

---

**Last Updated:** February 16, 2026  
**Status:** 🟢 Production Ready

