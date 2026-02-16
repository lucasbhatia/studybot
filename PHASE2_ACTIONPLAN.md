# StudyBot Phase 2 - Action Plan & Testing

**Started:** February 16, 2026, 15:24 EST  
**Current Status:** Initiating comprehensive testing and polish  
**Workspace ID:** `b0abd5a8-c60f-4e6d-bc4d-55f6efb9a0b5`

---

## 📋 Phase 2 Checklist (19 items)

### ✅ COMPLETE (From Phase 1)
- [x] P0-1: Quiz Logic Fixed
- [x] P0-2: Claude API Integration (BYOK + proxy)
- [x] P0-3: Canvas LMS Integration
- [x] P0-4: Toast Notifications
- [x] P0-5: Error Handling
- [x] P1-1: Better Content Extraction
- [x] P1-2: Onboarding Wizard
- [x] P1-3: Usage Tracking UI
- [x] P1-4: Chrome Web Store Compliance (manifest, privacy, ToS)

### 🚀 PHASE 2 TASKS (TO DO THIS SPRINT)

#### Quality & Testing
1. [ ] **Integration Test - Extract & Generate** 
   - Test basic flow: load extension → extract content → generate flashcards
   - Test with real webpage content
   - Verify UI updates and no errors in console

2. [ ] **Integration Test - Quiz**
   - Create study set
   - Start quiz mode
   - Answer questions, verify scoring
   - Check correct answer validation

3. [ ] **Integration Test - Canvas**
   - Configure Canvas token
   - Browse courses
   - Select assignment
   - Create study set from Canvas
   - Verify content extraction

4. [ ] **Error Handling - Edge Cases**
   - [ ] No internet connection
   - [ ] Invalid API key
   - [ ] Expired Canvas token
   - [ ] Empty page content
   - [ ] Very long text (10K+ chars)
   - [ ] Invalid JSON import
   - [ ] Popup at different sizes

5. [ ] **Dark Mode Audit**
   - [ ] Popup in dark mode
   - [ ] Sidepanel in dark mode
   - [ ] Modals in dark mode
   - [ ] All text readable
   - [ ] All icons visible
   - [ ] Buttons clickable

6. [ ] **Performance Testing**
   - [ ] Content extraction speed (<1s)
   - [ ] Extension load time (<2s)
   - [ ] No memory leaks (test with 50+ study sets)
   - [ ] Smooth animations

#### UI Polish
7. [ ] **Icon Audit**
   - [ ] Verify 16px icon exists
   - [ ] Verify 32px icon exists
   - [ ] Verify 48px icon exists
   - [ ] Verify 128px icon exists
   - [ ] Verify 256px icon created (for Chrome Store)
   - [ ] All icons are PNG and properly formatted

8. [ ] **Animations & Transitions**
   - [ ] Flashcard flip smooth
   - [ ] Tab switches smooth
   - [ ] Modals fade in/out
   - [ ] Toasts slide in/out
   - [ ] Loading spinners present and smooth

9. [ ] **Responsive Popup**
   - [ ] Test at 400x600px (default)
   - [ ] Test at 300x500px (small)
   - [ ] Test at 500x700px (large)
   - [ ] Test with long text
   - [ ] Test with many study sets (scrolling)

#### Chrome Web Store Prep
10. [ ] **Manifest Review**
    - [ ] Verify CSP is correct (no eval, no unsafe-inline for script)
    - [ ] Permissions are minimal and justified
    - [ ] host_permissions documented
    - [ ] Version number is correct (1.0.0)

11. [ ] **Content Security Policy Audit**
    - [ ] No eval() usage in code
    - [ ] No dynamic code execution
    - [ ] No unsafe-eval in CSP
    - [ ] All scripts are local (bundled)
    - [ ] No external script loads

12. [ ] **Icon Set Complete**
    - [ ] Create/verify all sizes (16, 32, 48, 128, 256px)
    - [ ] Ensure PNG format
    - [ ] Ensure transparent background
    - [ ] Ensure high quality (not blurry)

13. [ ] **Screenshots Prepared** (1280x800px minimum)
    - [ ] Screenshot 1: Content extraction floating button
    - [ ] Screenshot 2: Study set library in popup
    - [ ] Screenshot 3: Flashcard flip animation
    - [ ] Screenshot 4: Quiz with scoring
    - [ ] Screenshot 5: Canvas integration tab

14. [ ] **Store Listing Copy**
    - [ ] Write 132-char short description
    - [ ] Write 4000-char detailed description
    - [ ] Highlight Canvas LMS integration
    - [ ] Include use cases
    - [ ] Mention privacy

15. [ ] **Privacy & Legal** (Already created, needs review)
    - [ ] Verify Privacy Policy covers all data handling
    - [ ] Verify Terms of Service are comprehensive
    - [ ] Add links to website (host these files)
    - [ ] Ensure GDPR/CCPA compliant

#### Canvas Integration Polish
16. [ ] **Canvas Real Data Testing**
    - [ ] Test with UK Canvas URL (https://uk.instructure.com)
    - [ ] Test with multiple courses
    - [ ] Test with assignments
    - [ ] Test with modules
    - [ ] Test with large file lists
    - [ ] Handle edge cases (no assignments, locked content)

17. [ ] **One-Click Study Set Flow**
    - [ ] Click Canvas assignment
    - [ ] Content auto-extracts
    - [ ] Study set generated
    - [ ] No manual steps required
    - [ ] Success toast shows

#### GitHub Push
18. [ ] **Initialize Repo** (if not done)
    - [ ] Create `.gitignore` (no node_modules, no keys, no build artifacts)
    - [ ] Create clean Git history
    - [ ] Initialize remote: `gh repo create lucasbhatia/studybot`
    - [ ] Push main branch

19. [ ] **Write Killer README.md**
    - [ ] Feature overview with emojis
    - [ ] Installation instructions
    - [ ] Setup guide (Canvas, Claude API)
    - [ ] Screenshots embedded
    - [ ] Chrome Web Store link
    - [ ] Contributing guidelines
    - [ ] License

---

## 🎯 Success Criteria

### Must Have (Blocking)
- [x] All P0 items complete and tested
- [x] All P1 items complete and tested
- [ ] Zero console errors on basic flow
- [ ] Dark mode looks consistent
- [ ] Canvas integration works with real data
- [ ] All 19 Phase 2 tasks completed

### Should Have (High Priority)
- [ ] 5+ screenshots for Chrome Store
- [ ] Store listing copy is compelling
- [ ] Icons all 5 sizes ready
- [ ] README is detailed and helpful
- [ ] Git history is clean

### Nice to Have
- [ ] Promotional assets (video, website preview)
- [ ] Performance optimized (< 2s load)
- [ ] Spaced repetition algorithm (P3 item)

---

## 📊 Progress Tracking

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Integration Tests | 🚫 NOT STARTED | P0 | Begin tomorrow |
| Dark Mode Audit | 🚫 NOT STARTED | P1 | Check every screen |
| Icon Creation | 🚫 NOT STARTED | P1 | Need 256px for Store |
| Screenshots | 🚫 NOT STARTED | P1 | 5 required for listing |
| Store Copy | 🚫 NOT STARTED | P1 | 132 + 4000 chars |
| Canvas Testing | 🚫 NOT STARTED | P1 | With real data |
| GitHub Push | 🚫 NOT STARTED | P0 | Clean .gitignore |
| README | 🚫 NOT STARTED | P0 | Killer copy |

**Completion Target:** 95% by March 1, 2026

---

## 🔍 Testing Strategy

### Test Environment
- Chrome stable latest version
- macOS (host machine)
- Real network connection
- Canvas token for UK Canvas instance

### Test Scenarios

#### Scenario 1: Basic End-to-End
1. Load extension
2. Navigate to Wikipedia article
3. Click extract button
4. Generate flashcards (should use Claude or proxy)
5. Verify flashcards display in sidepanel
6. Create study set
7. Verify set appears in popup
8. Take quiz
9. Verify scoring is correct

#### Scenario 2: API Key Management
1. Add Claude API key in settings
2. Test key (button click)
3. Generate flashcards (should use user key)
4. Change key to invalid
5. Verify error message
6. Clear key
7. Generate again (should use proxy or templates)

#### Scenario 3: Canvas Integration
1. Go to Canvas settings
2. Enter Canvas URL + token
3. Verify courses load
4. Click course → view assignments
5. Create study set from assignment
6. Verify content extracted correctly
7. Edit study set
8. Save and verify

#### Scenario 4: Edge Cases
1. Extract from blank page → should show helpful message
2. Extract with no internet → should show error
3. Import invalid JSON → should show error
4. Create study set with 100+ cards → verify performance
5. Dark mode toggle → verify all text readable

---

## 📝 Notes

- **Focus on quality over speed** — if something breaks, STOP and fix it
- **Test on real content** — don't use fake data
- **Document everything** — capture screenshots for Chrome Store
- **Check console** — zero errors before launch
- **Verify permissions** — justify every permission in manifest
- **Test Canvas** — this is the differentiator

---

## 🚀 Next Steps

1. **TODAY:** Read existing BUILD_COMPLETE.md & ROADMAP.md
2. **TODAY:** Set up test environment and install extension in dev
3. **TOMORROW:** Start integration testing (Scenario 1)
4. **THIS WEEK:** Complete all testing and fix bugs
5. **NEXT WEEK:** Polish UI, create screenshots, write copy
6. **WEEK AFTER:** Push to GitHub, prepare for Chrome Store

---

**Status:** Ready to begin Phase 2 testing  
**Assigned to:** StudyBot Dev Agent  
**Last Updated:** February 16, 2026 15:24 EST

