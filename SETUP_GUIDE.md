# StudyBot Setup Guide

## Quick Start (2 minutes)

### Step 1: Open Chrome Extension Manager
1. Open Google Chrome
2. Go to `chrome://extensions/`

### Step 2: Enable Developer Mode
- Toggle the **"Developer mode"** switch in the top-right corner

### Step 3: Load the Extension
1. Click **"Load unpacked"**
2. Navigate to: `~/projects/studybot/extension/`
3. Select the **`extension`** folder
4. Click **"Select Folder"**

### Step 4: Verify Installation
- You should see StudyBot appear in the extensions list
- A blue "S" icon should appear in your Chrome toolbar
- The extension status should say "ID: [some-id]"

## Testing the Extension

### Test 1: Open the Study Library
1. Click the blue StudyBot icon in your toolbar
2. You should see a popup with "StudyBot" header
3. Empty state shows: "No study sets yet"
4. Click the gear icon to test Settings

### Test 2: Extract Content
1. Go to any webpage with text (try Wikipedia, a news article, etc.)
2. Look for the floating blue "S" button in the bottom-right corner
3. Click it to extract content
4. The side panel should open automatically
5. You should see a new study set in your library

### Test 3: Create Study Materials
1. After extraction, you'll see three tabs: Summary, Flashcards, Quiz
2. **Summary Tab**:
   - Toggle "Detail Level" between Brief/Standard/Detailed
   - Click copy icon to copy summary
   - Click edit icon to modify summary
3. **Flashcards Tab**:
   - Click a card to flip between Q&A
   - Use Prev/Next/Shuffle buttons
   - Mark cards as Known/Learning
   - Click Edit to modify cards
4. **Quiz Tab**:
   - Select difficulty level
   - Click "Start Quiz"
   - Answer 10 questions
   - View results

### Test 4: Manage Study Sets
1. Click the StudyBot popup icon
2. Try searching for a study set
3. Click "Export JSON" to download
4. Click "Delete" to remove a set
5. Try importing a JSON file with "Import JSON"

### Test 5: Settings
1. Click the gear icon in the popup
2. Toggle Dark Mode / Light Mode
3. Change AI Detail Level
4. Toggle Notifications
5. Settings should persist after reload

## File Locations

- **Main Extension**: `~/projects/studybot/extension/`
- **Manifest**: `~/projects/studybot/extension/manifest.json`
- **Popup**: `~/projects/studybot/extension/popup/`
- **Study Panel**: `~/projects/studybot/extension/sidepanel/`
- **Libraries**: `~/projects/studybot/extension/lib/`
- **Icons**: `~/projects/studybot/extension/icons/`

## Troubleshooting

### Extension Not Showing in Toolbar
1. Check that you enabled Developer Mode
2. Go to `chrome://extensions/`
3. Find StudyBot and verify it's enabled (toggle should be blue)
4. Try unpacking and reloading

### Floating Button Not Appearing
1. The floating button only appears on regular webpages
2. It may not show on Chrome system pages (new tab, settings, etc.)
3. Try loading `example.com` or `wikipedia.org`

### Content Not Extracting
1. Some sites block content scripts due to Content Security Policy
2. Try a different website
3. Check Chrome DevTools console for errors

### Popup Blank or Not Loading
1. Right-click the StudyBot icon
2. Select "Inspect popup"
3. Check the Console tab for JavaScript errors
4. Reload the extension

### Cards Not Flipping
1. Try clicking in the center of the card
2. Check browser console for CSS errors
3. Make sure you're using Chrome (not Edge or Brave with different rendering)

## Development Tips

### Viewing Logs
1. **Service Worker Logs**:
   - Go to `chrome://extensions/`
   - Find StudyBot and click "Details"
   - Scroll down and click "Inspect views: service worker"
   - View console output

2. **Popup Logs**:
   - Right-click extension icon
   - Select "Inspect popup"
   - View console output

3. **Content Script Logs**:
   - On any webpage, right-click → "Inspect"
   - Open Console tab
   - Look for messages from content.js

### Reloading the Extension
1. Go to `chrome://extensions/`
2. Find StudyBot
3. Click the refresh/reload icon
4. Changes to code will be reflected

### Editing Files
- You can edit files in `/extension/` folder
- After editing, reload the extension to see changes
- HTML/CSS changes appear immediately after reload
- JavaScript changes require reload

## Project Structure Overview

```
~/projects/studybot/
├── extension/                  # The actual Chrome extension
│   ├── manifest.json          # Extension configuration
│   ├── popup/                 # Study library UI
│   ├── sidepanel/             # Main study interface
│   ├── content/               # Page content extraction
│   ├── background/            # Background service
│   ├── lib/                   # Shared libraries
│   └── icons/                 # Extension icons
├── README.md                  # Full documentation
├── SETUP_GUIDE.md            # This file
└── TESTING_REPORT.md         # Feature testing checklist
```

## Next Steps

1. ✅ Install the extension
2. ✅ Test all features using the checklist
3. ✅ Report any bugs or issues
4. ⬜ Consider API integration (OpenAI, Claude)
5. ⬜ Plan advanced features (cloud sync, collaborative study)

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review the Testing Report for expected behavior
3. Check Chrome DevTools console for error messages
4. Verify the file structure is intact

## Important Notes

- ⚠️ **First Time**: It may take 5-10 seconds for the extension to fully initialize on first load
- ⚠️ **Storage**: Your study sets are stored locally. Clearing Chrome's storage will delete them.
- ⚠️ **Backups**: Use the Export feature to regularly backup your study sets as JSON files
- 💾 **Sync**: Settings sync across your Chrome profile, but study sets are local to each device
- 🔒 **Privacy**: All data stays on your device. No data is sent to external services.

---

**Ready to study? Let's go! 📚✨**
