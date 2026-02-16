// StudyBot Service Worker (Manifest V3)

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  // Create context menus
  chrome.contextMenus.create({
    id: 'studybot-extract',
    title: 'Generate study materials',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'studybot-selection',
    title: 'StudyBot: Create from selection',
    contexts: ['selection']
  });

  // Initialize storage
  chrome.storage.sync.get(['studybot_settings'], (result) => {
    if (!result.studybot_settings) {
      chrome.storage.sync.set({
        studybot_settings: {
          darkMode: true,
          aiDetailLevel: 'standard',
          notifications: true,
          initialized: true,
        },
      });
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'studybot-extract') {
    // Open side panel for current tab
    chrome.sidePanel.open({ tabId: tab.id });
  } else if (info.menuItemId === 'studybot-selection') {
    // Extract selected text and open side panel
    const selectedText = info.selectionText;
    
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractSelectedText',
      text: selectedText,
    });
    
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    sendResponse({ success: true });
  } else if (request.action === 'getPageContent') {
    // Will be handled by content script
    sendResponse({ received: true });
  }
});

// Listen for tab changes to update side panel context
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Tab context tracking for future features
});

// Periodic sync for future features (like spaced repetition)
if ('periodicSync' in ServiceWorkerRegistration.prototype) {
  chrome.alarms.create('studybot-sync', { periodInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'studybot-sync') {
    // Future: sync stats, spaced repetition, etc.
  }
});
