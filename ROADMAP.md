# StudyBot - Development Roadmap

**Created:** 2026-02-16  
**Target Launch:** Chrome Web Store (Q2 2026)  
**MVP Status:** Phase 1 scan complete → Ready for Phase 3 build

---

## 📅 Phase Overview

- **Phase 1:** ✅ Full Scan (COMPLETE) → See `PHASE1_SCAN.md`
- **Phase 2:** Create roadmap + Mission Control tasks (THIS DOCUMENT)
- **Phase 3:** Build core features (P0 & P1)
- **Phase 4:** Create Chrome Web Store submission checklist
- **Phase 5:** Create monetization strategy

---

## 🎯 Priority Levels

### P0: Critical Blockers
**Must fix before any release.** These are bugs, missing core features, or security issues.

### P1: Core Features for MVP
**Needed to launch productively.** Without these, the app is incomplete.

### P2: Polish & Performance
**Nice to have.** Makes the app feel professional but not blocking launch.

### P3: Future Roadmap
**Post-launch.** Nice features but requires more infrastructure.

---

---

# ⚠️ P0: CRITICAL BLOCKERS

## P0-1: Fix Quiz Logic (CRITICAL BUG)
**Status:** 🔴 Not Started  
**Time Est:** 4 hours  
**Assignee:** TBD

### Problem
- Quiz answers are randomly generated, not based on flashcard content
- User selections don't affect results
- Quiz is unplayable

### What Needs to Change
```javascript
// CURRENT (BROKEN):
correct: Math.random() > 0.5 ? 'A' : 'B'  // Random!

// NEEDED:
correct: quizOptions.findIndex(opt => opt === correctAnswer)
```

### Tasks
- [ ] Store correct answer when creating quiz question
- [ ] Validate user selection against correct answer
- [ ] Implement scoring (track correct/incorrect)
- [ ] Display results showing which answers were correct
- [ ] Add visual feedback (green for correct, red for incorrect)

### Testing
- [ ] Create 5-question quiz from sample set
- [ ] Verify each answer is validated correctly
- [ ] Score calculation matches expected

### Files to Modify
- `sidepanel/sidepanel.js` - Quiz logic

---

## P0-2: Integrate Claude API for AI Generation
**Status:** 🔴 Not Started  
**Time Est:** 2-3 days  
**Assignee:** TBD  
**Dependencies:** None

### Problem
- AI generation is 100% template-based regex
- Quality is poor (no semantic understanding)
- Can't differentiate complex topics from simple ones
- No way to upgrade to real AI without code changes

### What Needs to Change
Replace `AIGenerator` template logic with Claude API calls:
- Flashcard generation via Claude
- Summary generation via Claude
- Quiz question generation via Claude

### Architecture
```
User extracts content
↓
Content sent to service worker
↓
Service worker calls Claude API (proxy OR user's API key)
↓
Claude returns:
  - Flashcards (JSON array with question/answer)
  - Summaries (3 levels: brief/standard/detailed)
  - Quiz questions (JSON with distractors)
↓
Results stored in Chrome storage
↓
Display in UI
```

### Implementation Plan

#### Step 1: Create API wrapper (NEW FILE)
- `lib/claude-api.js`
- Handles API key configuration (user provides OR uses proxy)
- Rate limiting + error handling
- Fallback to template generator if API fails

#### Step 2: Update AIGenerator
- Keep template-based as fallback
- Add `async generateFlashcardsAI()` method
- Add `async generateSummaryAI()` method
- Add `async generateQuizAI()` method

#### Step 3: Update sidepanel.js
- Show loading state during generation
- Handle API errors gracefully
- Implement retry logic

#### Step 4: Add settings for API key
- Popup settings modal gets new field: "Claude API Key" (or "Use Free Tier")
- Store key in `chrome.storage.sync` (encrypted? TODO: research Chrome storage security)
- Test API key on input (call test endpoint)

### Design Decisions to Make
- **Option A:** User brings own API key (free tier, no backend needed)
- **Option B:** Proxy server handles API calls (better UX, requires backend + costs)
- **Option C:** Hybrid (free tier uses template, paid tier uses API proxy)

**Recommendation:** Start with Option A (user API key), plan for proxy in Phase 5.

### Prompts Needed
**Flashcard Generation:**
```
Extract 5-10 flashcards from this text. Format as JSON:
[
  {"question": "...", "answer": "...", "difficulty": "easy|medium|hard"},
  ...
]

Text:
${content}

Requirements:
- Questions should be clear and unambiguous
- Answers should be concise (1-3 sentences)
- Cover different aspects of the content
- Vary difficulty levels
```

**Summary Generation:**
```
Create a ${level} summary of this text.

Level ${level}:
- brief: 1-2 sentences, key concept only
- standard: 3-5 sentences, main points
- detailed: full explanation with examples

Also provide 3-5 key points as bullet list.

Format as JSON:
{
  "text": "...",
  "keyPoints": ["...", "...", ...]
}

Text:
${content}
```

**Quiz Generation:**
```
Create 5 quiz questions from this text. Format as JSON:
[
  {
    "question": "...",
    "type": "multiple-choice" or "true-false",
    "options": ["A", "B", "C", "D"],  // For MC, only ["True", "False"] for TF
    "correctAnswer": 0,  // Index in options array
    "difficulty": "easy|medium|hard"
  },
  ...
]

Text:
${content}

Requirements:
- Mix multiple choice and true/false
- Distractors should be plausible but wrong
- Vary difficulty
- Cover important concepts
```

### Files to Create
- `lib/claude-api.js` - API wrapper
- Update `lib/ai-generator.js` - Add async methods

### Files to Modify
- `sidepanel/sidepanel.js` - Use API instead of sync generation
- `popup/popup.js` - Settings for API key
- `popup/popup.html` - API key input field

### Testing
- [ ] Can input Claude API key
- [ ] Key is saved to storage
- [ ] Extract content → triggers Claude API call
- [ ] Flashcards generated from Claude
- [ ] Summaries generated from Claude
- [ ] Quiz questions generated from Claude
- [ ] Fallback to template if API fails
- [ ] Error message shown if API key invalid
- [ ] Streaming response (if using Anthropic SDK)

---

## P0-3: Implement Canvas LMS Integration
**Status:** 🔴 Not Started  
**Time Est:** 3-4 days  
**Assignee:** TBD  
**Dependencies:** Claude API integration (P0-2)

### Problem
- Canvas integration is advertised as key moat
- Code stubs exist but nothing works
- No way to authenticate with Canvas
- No way to pull course content, assignments, syllabi
- This is the biggest competitive advantage

### What Needs to Change
Add full Canvas API integration:
1. Canvas authentication (OAuth or token)
2. Canvas API client (list courses, modules, assignments)
3. Content extraction (parse Canvas HTML)
4. Auto-study set creation from Canvas content

### Architecture
```
User provides Canvas instance URL + API token (or OAuth)
↓
Service worker authenticates with Canvas API
↓
Sidebar shows Canvas courses
↓
User selects course → Load modules
↓
User selects assignment → Extract content
↓
Generate study materials (via Claude API)
↓
Save as study set
↓
User can quiz on Canvas content!
```

### Implementation Plan

#### Step 1: Create Canvas API wrapper (NEW FILE)
- `lib/canvas-api.js`
- Methods:
  - `authenticateToken(url, token)` - Test credentials
  - `authenticateOAuth()` - OAuth flow (for later)
  - `getCourses()` - List all courses
  - `getModules(courseId)` - List modules in course
  - `getAssignments(courseId)` - List assignments
  - `getContent(courseId, moduleId)` - Get module content
  - `getAssignmentDescription(assignmentId)` - Get assignment details
  - `getCourseSyllabus(courseId)` - Get syllabus

#### Step 2: Add Canvas authentication UI
- Popup settings gets new section: "Canvas Integration"
- Input fields:
  - Canvas URL (e.g., `https://uk.instructure.com`)
  - API Token (can be generated from Canvas settings)
  - "Test Connection" button
- Store credentials in `chrome.storage.sync`

#### Step 3: Create Canvas sidebar
- New UI component in sidepanel
- Show: Courses → Modules → Content
- Allow extracting any Canvas content as study set
- Show loading states

#### Step 4: Content extraction from Canvas
- Parse Canvas assignment HTML
- Extract text, images, attachments
- Call Claude API to generate study materials
- Save with `sourceUrl` pointing to Canvas

### Canvas API Setup
**Given:**
- Canvas URL: `https://uk.instructure.com`
- API Token: `1139~hX8xvhcxe3wzfytktEu8z7zrhPPZDtvzk2GUCMzNxuXJLmLvHBTnEAAazA8vcX4T`

**Canvas API Endpoints Needed:**
```
GET https://uk.instructure.com/api/v1/courses
GET https://uk.instructure.com/api/v1/courses/:id/modules
GET https://uk.instructure.com/api/v1/courses/:id/modules/:id/items
GET https://uk.instructure.com/api/v1/courses/:id/assignments
GET https://uk.instructure.com/api/v1/courses/:id/assignments/:id
```

### Design Decisions
- **OAuth vs Token:** Start with token (simpler), add OAuth later
- **UI Location:** New tab in sidepanel or settings popup?
  - Recommendation: New tab "Canvas" in sidepanel (easier UX)

### Files to Create
- `lib/canvas-api.js` - Canvas API client
- `sidepanel/canvas-panel.js` - Canvas UI component (optional)

### Files to Modify
- `sidepanel/sidepanel.html` - Add Canvas tab
- `sidepanel/sidepanel.js` - Canvas logic
- `popup/popup.html` - Canvas settings
- `popup/popup.js` - Canvas credential handling
- `manifest.json` - Add `https://*.instructure.com` to host_permissions

### Testing
- [ ] Can input Canvas URL and token
- [ ] "Test Connection" validates credentials
- [ ] Can list Canvas courses
- [ ] Can list modules in course
- [ ] Can extract assignment content
- [ ] Extracted content creates study set
- [ ] Quiz on Canvas content works
- [ ] Credentials securely stored

---

## P0-4: Implement Toast Notifications (UX Critical)
**Status:** 🔴 Not Started  
**Time Est:** 2 hours  
**Assignee:** TBD

### Problem
- `showNotification()` logs to console instead of showing UI
- Users don't know if actions succeeded or failed
- No error feedback

### What Needs to Change
- Create toast notification component
- Show on all important actions (create, delete, import, export, error)
- Auto-hide after 3 seconds
- Different styles for success/error/info

### Implementation
**File:** `lib/notifications.js` (NEW)
```javascript
class NotificationManager {
  static show(message, type = 'info', duration = 3000) {
    // Create toast element
    // Append to DOM
    // Auto-hide
  }
  static success(message) { ... }
  static error(message) { ... }
  static info(message) { ... }
}
```

### Files to Modify
- `sidepanel/sidepanel.js` - Replace `showNotification()` calls
- `popup/popup.js` - Replace `showNotification()` calls
- Add CSS for toast styles

### Testing
- [ ] Success toast appears when card added
- [ ] Error toast appears when import fails
- [ ] Toast auto-hides after 3 seconds
- [ ] Multiple toasts queue properly

---

## P0-5: Add Proper Error Handling Throughout
**Status:** 🔴 Not Started  
**Time Est:** 6 hours  
**Assignee:** TBD  
**Dependencies:** Toast Notifications (P0-4)

### Problem
- Silent failures everywhere
- No error logging
- No user feedback on failures
- API errors will crash silently

### What Needs to Change
- Wrap all async operations in try/catch
- Log errors to console + error tracking service (later)
- Show user-friendly error messages
- Add retry logic for network errors

### Implementation Plan
**File:** `lib/error-handler.js` (NEW)

```javascript
class ErrorHandler {
  static async wrapAsync(fn, context = 'Operation') {
    try {
      return await fn();
    } catch (error) {
      console.error(`[${context}]`, error);
      NotificationManager.error(`${context} failed: ${error.message}`);
      throw error;
    }
  }
  
  static async retryAsync(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
}
```

### Areas Needing Error Handling
- [ ] Content extraction (page parsing errors)
- [ ] Claude API calls (network, rate limit, invalid key)
- [ ] Canvas API calls (auth, network)
- [ ] Chrome storage operations
- [ ] Import/export JSON parsing
- [ ] Message passing between scripts

### Testing
- [ ] Extract from page with no content → error toast
- [ ] Claude API with invalid key → error toast with retry
- [ ] Canvas auth with invalid token → error toast
- [ ] Network timeout → retry 3x then error
- [ ] Malformed JSON import → error toast

---

---

# 🎯 P1: CORE FEATURES FOR MVP

## P1-1: Improve Content Extraction
**Status:** 🔴 Not Started  
**Time Est:** 2 days  
**Assignee:** TBD

### Problem
- Current extraction is basic text-only
- Loses structure (headings, lists, tables)
- No support for special content (code, formulas)
- Floating button CSS not loading

### Changes Needed
- [ ] Extract with HTML structure preserved
- [ ] Handle code blocks separately
- [ ] Handle tables and lists
- [ ] Extract alt-text from images
- [ ] Fix floating button styles
- [ ] Improve heuristics for main content
- [ ] Add extraction indicator (progress)

### Files to Modify
- `content/content.js` - Better DOM parsing
- `content/content.css` - Add floating button styles
- `lib/content-parser.js` - (NEW) - Dedicated parser

---

## P1-2: Implement Onboarding Flow
**Status:** 🔴 Not Started  
**Time Est:** 1 day  
**Assignee:** TBD

### What's Needed
- First-time user welcome screen
- Step-by-step tutorial (extract → generate → quiz)
- Canvas token setup dialog
- Skip button to go to main UI

### Pages
1. **Welcome** - "AI-powered study assistant"
2. **Extract** - "Click the floating button to extract content"
3. **Generate** - "We'll create summaries, flashcards, quizzes"
4. **Canvas** - "Connect Canvas LMS for course content" (optional)
5. **Ready** - "You're all set! Let's study"

### Files
- `sidepanel/onboarding.js` (NEW)
- `sidepanel/onboarding.html` (NEW)
- `sidepanel/onboarding.css` (NEW)

---

## P1-3: Implement Freemium Usage Limits
**Status:** 🔴 Not Started  
**Time Est:** 2 days  
**Assignee:** TBD  
**Dependencies:** Claude API (P0-2), Freemium model defined (Phase 5)

### What's Needed
- Track API usage (summarize + flashcard + quiz = 1 "generation")
- Free tier: 5 generations/month
- Paid tier: unlimited (via Stripe)
- Show usage in UI
- Block generation when limit reached
- Show upgrade prompt

### Implementation
- Track in `chrome.storage.local`:
  - `usage_count` - number of generations this month
  - `usage_reset_date` - when it resets
- Check limit before calling API
- Show meter in popup/sidepanel

---

## P1-4: Chrome Web Store Compliance
**Status:** 🔴 Not Started  
**Time Est:** 1 day  
**Assignee:** TBD

### Changes Needed
- [ ] Add Content Security Policy to manifest
- [ ] Restrict host permissions (remove `<all_urls>`)
- [ ] Add `host_permissions_reason`
- [ ] Remove unused permissions (webRequest)
- [ ] Create privacy policy (required for Web Store)
- [ ] Create terms of service
- [ ] Icon assets in correct sizes
- [ ] Screenshots for Web Store listing

### Manifest Updates
```json
{
  "manifest_version": 3,
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "host_permissions": [
    "https://*/* ",
    "https://uk.instructure.com/*"
  ],
  "host_permissions_reason": "Extract text from webpages and fetch Canvas LMS course content"
}
```

### Privacy Policy Template
See `PRIVACY_POLICY.md` (to be created in Phase 4)

---

## P1-5: Implement Quiz Options Properly
**Status:** 🔴 Not Started  
**Time Est:** 4 hours  
**Assignee:** TBD  
**Dependencies:** Claude API (P0-2)

### Problem
- Quiz options are static ("Option A", "Option B", etc.)
- Distractors don't relate to content

### Changes
- Use Claude API to generate realistic distractors
- For true/false → just True/False
- For MC → generate 3 plausible wrong answers
- Shuffle options so correct isn't always in same position

### Implementation
```javascript
const mcQuestion = {
  question: "What is photosynthesis?",
  type: "multiple-choice",
  correctAnswer: "Process where plants convert light to energy",
  // Call Claude to generate distractors:
  distractors: [
    "Process where animals convert food to energy",
    "Process where bacteria break down organic matter",
    "Process where fungi absorb nutrients"
  ],
  // Shuffle options
  options: [/* shuffled: correct + 3 distractors */]
};
```

---

## P1-6: Add Keyboard Shortcuts
**Status:** 🔴 Not Started  
**Time Est:** 1 day  
**Assignee:** TBD

### Shortcuts
- `Ctrl+Shift+E` (Cmd+Shift+E on Mac) - Extract from page
- `Ctrl+Shift+S` (Cmd+Shift+S) - Open sidepanel
- Arrow keys in flashcard - Next/Previous card
- Space - Flip card
- `Enter` in quiz - Select answer / next question

### Files
- `background/service-worker.js` - Register shortcuts
- `sidepanel/sidepanel.js` - Handle arrow keys, space

---

---

# 🎨 P2: POLISH & PERFORMANCE

## P2-1: Implement 3D Flashcard Flip Animation
**Status:** 🔴 Not Started  
**Time Est:** 4 hours  
**Assignee:** TBD

### Current
- CSS flip using `transform: rotateY()`
- Works but not truly 3D

### Needed
- Real 3D perspective transforms
- Smooth animation
- Satisfying UX

### Implementation
```css
.card {
  perspective: 1000px;
}

.card-inner {
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

---

## P2-2: Add Spaced Repetition
**Status:** 🔴 Not Started  
**Time Est:** 2 days  
**Assignee:** TBD

### What's Needed
- Track card mastery level (new, learning, review, mastered)
- Schedule cards based on forgetting curve
- Show next review date
- Prioritize cards due for review

### Algorithm
- New → show immediately
- After 1st correct → 3 days
- After 2nd correct → 7 days
- After 3rd correct → 30 days
- If marked "still learning" → review tomorrow

---

## P2-3: Add Dark Mode Improvements
**Status:** 🔴 Not Started  
**Time Est:** 1 day  
**Assignee:** TBD

### Current
- Basic theme toggle
- Some colors hardcoded

### Needed
- Follow system theme preference
- Better color contrast
- Smooth theme transitions
- Persist preference

---

## P2-4: Performance Optimization
**Status:** 🔴 Not Started  
**Time Est:** 2 days  
**Assignee:** TBD

### Optimizations
- [ ] Lazy load study sets (pagination)
- [ ] Cache generated summaries
- [ ] Debounce search
- [ ] Compress storage (remove unused fields)
- [ ] Optimize DOM rendering (virtual list?)

### Metrics to Improve
- Time to first interaction
- Memory usage with 100+ study sets
- Extraction time for large pages

---

## P2-5: Add Data Backup & Restore
**Status:** 🔴 Not Started  
**Time Est:** 1 day  
**Assignee:** TBD

### What's Needed
- Export all study sets at once
- Restore from backup file
- Auto-backup to user's cloud (optional)

---

---

# 🚀 P3: FUTURE ROADMAP (Post-Launch)

## P3-1: Web Dashboard
**Status:** 🔴 Not Planned (Phase 6+)  
**Time Est:** 5 days  
**Features**
- View all study sets from browser
- Manage account & settings
- View analytics & study streak
- Share study sets with others

## P3-2: Collaboration Features
**Status:** 🔴 Not Planned  
**Features**
- Share study sets with classmates
- Collaborative study sessions
- Comment on flashcards

## P3-3: Mobile App
**Status:** 🔴 Not Planned  
**Features**
- iOS / Android app
- Sync with browser extension
- Offline study

## P3-4: Advanced AI Features
**Status:** 🔴 Not Planned  
**Features**
- Personalized difficulty adjustment
- Learning path recommendations
- Voice-based quizzing

## P3-5: Integration with Other Platforms
**Status:** 🔴 Not Planned  
**Platforms**
- Google Classroom
- Blackboard
- Moodle
- Schoology

---

---

# 📊 Timeline Summary

| Phase | Priority | Items | Estimated Time | Status |
|-------|----------|-------|-----------------|--------|
| **P0** | CRITICAL | 5 items | 8-9 days | 🔴 Not Started |
| **P1** | CORE | 6 items | 5-6 days | 🔴 Not Started |
| **P2** | POLISH | 5 items | 5-7 days | 🔴 Not Started |
| **P3** | FUTURE | 5 items | TBD | 🔴 Not Planned |

**Total MVP effort (P0 + P1):** 13-15 days  
**Target completion:** ~March 1-5, 2026 (if full-time)

---

# 🎯 Key Success Metrics

**At Launch:**
- ✅ 100% of P0 items completed
- ✅ 100% of P1 items completed
- ✅ No user-facing errors
- ✅ Canvas integration working
- ✅ Claude API integration working
- ✅ Privacy policy + ToS in place
- ✅ 4-5 star ratings on Chrome Web Store

**Post-Launch (Month 1):**
- 1000+ active installs
- 90%+ user retention
- <2% error rate
- Canvas users: 20%+ of user base

**Post-Launch (Month 3):**
- 10,000+ active installs
- 50% of users create Canvas study sets
- 100 paid subscriptions
- <1% error rate

---

# 📋 Next Immediate Actions

**Before Phase 3 begins:**

1. ✅ Review `PHASE1_SCAN.md` (findings)
2. ✅ Confirm roadmap prioritization with Lucas
3. ✅ Create Mission Control tasks for P0 & P1 items
4. 🔄 Create GitHub repo `lucasbhatia/studybot`
5. 🔄 Set up feature branches for each task
6. 🔄 Start Phase 3 build with P0 items

---

**End of Roadmap Document**
