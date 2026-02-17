// Popup Script - Study Library UI

const storage = new StorageManager();

// DOM Elements
const studySetsContainer = document.getElementById('studySetsContainer');
const searchInput = document.getElementById('searchInput');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const darkModeToggle = document.getElementById('darkModeToggle');
const detailLevelSelect = document.getElementById('detailLevelSelect');
const notificationsToggle = document.getElementById('notificationsToggle');
const clearDataBtn = document.getElementById('clearDataBtn');
const newSetBtn = document.getElementById('newSetBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const totalSetsEl = document.getElementById('totalSets');
const totalCardsEl = document.getElementById('totalCards');
const studyStreakEl = document.getElementById('studyStreak');
const apiKeyInput = document.getElementById('apiKeyInput');
const testApiKeyBtn = document.getElementById('testApiKeyBtn');
const useProxyToggle = document.getElementById('useProxyToggle');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const usageSection = document.getElementById('usageSection');

let allStudySets = [];
let currentSearchQuery = '';
let claudeAPI = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await storage.initializeSettings();
  claudeAPI = new ClaudeAPIService();
  
  // Initialize auth UI
  await auth.initializeSession();
  AuthUI.updateHeaderAuthStatus();
  AuthUI.renderPopupAuthSection();
  
  // Listen for auth state changes
  auth.onAuthStateChange(() => {
    AuthUI.updateHeaderAuthStatus();
    AuthUI.renderPopupAuthSection();
  });
  
  await loadStudySets();
  await loadSettings();
  await updateStats();
  setupEventListeners();
});

/**
 * Load and display study sets
 */
async function loadStudySets() {
  allStudySets = await storage.getStudySets();
  renderStudySets(allStudySets);
}

/**
 * Render study sets
 */
function renderStudySets(sets) {
  if (sets.length === 0) {
    studySetsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No study sets yet</p>
        <p class="empty-hint">Extract content from a webpage to create your first study set</p>
      </div>
    `;
    return;
  }

  studySetsContainer.innerHTML = sets.map(set => `
    <div class="study-set-card" data-set-id="${set.id}">
      <div class="study-set-title">${escapeHtml(set.title)}</div>
      <div class="study-set-meta">
        <span>${set.flashcards.length} cards</span>
        <span>${formatDate(set.createdAt)}</span>
      </div>
      <div class="study-set-actions">
        <button class="btn-small btn-open" data-set-id="${set.id}">Open</button>
        <button class="btn-small btn-export" data-set-id="${set.id}">Export</button>
        <button class="btn-small btn-delete" data-set-id="${set.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // Attach event listeners
  document.querySelectorAll('.btn-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openStudySet(btn.dataset.setId);
    });
  });

  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportStudySet(btn.dataset.setId);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteStudySet(btn.dataset.setId);
    });
  });

  document.querySelectorAll('.study-set-card').forEach(card => {
    card.addEventListener('click', () => {
      openStudySet(card.dataset.setId);
    });
  });
}

/**
 * Open study set in side panel
 */
function openStudySet(setId) {
  // Store the set ID to be opened and notify side panel
  chrome.storage.local.set({ 'currentStudySetId': setId }, () => {
    // Get current tab and open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  });
}

/**
 * Delete study set
 */
async function deleteStudySet(setId) {
  if (confirm('Are you sure you want to delete this study set?')) {
    await storage.deleteStudySet(setId);
    await loadStudySets();
    await updateStats();
    showNotification('Study set deleted', 'success');
  }
}

/**
 * Export study set as JSON
 */
async function exportStudySet(setId) {
  const exported = await storage.exportStudySet(setId);
  if (exported) {
    // Create download link
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(exported.data);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = exported.filename;
    link.click();
    showNotification('Study set exported', 'success');
  }
}

/**
 * Search study sets - debounced for performance
 */
const debouncedSearch = debouncerManager.debounce((query) => {
  currentSearchQuery = query.toLowerCase();
  
  const filtered = allStudySets.filter(set =>
    set.title.toLowerCase().includes(currentSearchQuery) ||
    set.content.toLowerCase().includes(currentSearchQuery)
  );
  
  renderStudySets(filtered);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

/**
 * Load settings
 */
async function loadSettings() {
  const settings = await storage.getSettings();
  
  darkModeToggle.checked = settings.darkMode;
  detailLevelSelect.value = settings.aiDetailLevel;
  notificationsToggle.checked = settings.notifications;
  
  // Load API key settings
  const config = await claudeAPI.getConfig();
  if (config.apiKey) {
    apiKeyInput.value = config.apiKey.substring(0, 10) + '...' + config.apiKey.substring(config.apiKey.length - 4);
    apiKeyInput.disabled = true;
  }
  useProxyToggle.checked = config.useProxy !== false;
  
  // Show usage meter if using proxy
  if (config.useProxy) {
    updateUsageMeter();
  }
  
  applyTheme(settings.darkMode);
}

/**
 * Apply theme
 */
function applyTheme(isDarkMode) {
  if (isDarkMode) {
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
  }
}

/**
 * Update stats
 */
async function updateStats() {
  const sets = await storage.getStudySets();
  const stats = await storage.getStats();
  
  let totalCards = 0;
  sets.forEach(set => {
    totalCards += set.flashcards.length;
  });
  
  totalSetsEl.textContent = sets.length;
  totalCardsEl.textContent = totalCards;
  studyStreakEl.textContent = stats.currentStreak || 0;
}

/**
 * Settings Modal
 */
settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.add('hidden');
  }
});

/**
 * Dark mode toggle
 */
darkModeToggle.addEventListener('change', async (e) => {
  await storage.updateSetting('darkMode', e.target.checked);
  applyTheme(e.target.checked);
});

/**
 * Setup API key and proxy event listeners
 */
function setupEventListeners() {
  testApiKeyBtn.addEventListener('click', testApiKey);
  useProxyToggle.addEventListener('change', async (e) => {
    chrome.storage.sync.set({ use_proxy: e.target.checked });
    if (e.target.checked) {
      updateUsageMeter();
    } else {
      usageSection.style.display = 'none';
    }
  });
}

/**
 * Test Claude API key
 */
async function testApiKey() {
  const key = apiKeyInput.value.trim();
  
  if (!key) {
    showApiKeyStatus('Please enter an API key', 'error');
    return;
  }

  testApiKeyBtn.disabled = true;
  testApiKeyBtn.textContent = 'Testing...';
  showApiKeyStatus('Testing API key...', 'info');

  try {
    const result = await claudeAPI.testApiKey(key);
    
    if (result.success) {
      await claudeAPI.saveApiKey(key);
      showApiKeyStatus('✓ API key valid and saved', 'success');
      apiKeyInput.disabled = true;
    } else {
      showApiKeyStatus('✗ ' + (result.error || 'Invalid API key'), 'error');
    }
  } catch (error) {
    showApiKeyStatus('✗ Error testing key: ' + error.message, 'error');
  } finally {
    testApiKeyBtn.disabled = false;
    testApiKeyBtn.textContent = 'Test';
  }
}

/**
 * Show API key status message
 */
function showApiKeyStatus(message, type) {
  apiKeyStatus.textContent = message;
  apiKeyStatus.style.display = 'block';
  apiKeyStatus.style.color = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3';
}

/**
 * Update usage meter for proxy
 */
async function updateUsageMeter() {
  try {
    const usage = await usageTracker.getUsage();
    
    const percentage = Math.min(usage.percentage, 100);
    const usageBar = document.getElementById('usageBar');
    const usageText = document.getElementById('usageText');
    
    if (usageBar && usageText) {
      usageBar.style.width = percentage + '%';
      usageText.textContent = `${usage.count}/${usage.limit}`;
      
      // Change color based on usage
      if (usage.percentage >= 100) {
        usageBar.style.background = 'var(--danger)'; // Red at limit
      } else if (usage.percentage >= 80) {
        usageBar.style.background = 'var(--warning)'; // Orange when near limit
      } else {
        usageBar.style.background = 'var(--primary)'; // Blue normally
      }
    }
    
    usageSection.style.display = 'block';
  } catch (error) {
    // Silent fail - just don't show usage meter
    usageSection.style.display = 'none';
  }
}

/**
 * Detail level change
 */
detailLevelSelect.addEventListener('change', async (e) => {
  await storage.updateSetting('aiDetailLevel', e.target.value);
});

/**
 * Notifications toggle
 */
notificationsToggle.addEventListener('change', async (e) => {
  await storage.updateSetting('notifications', e.target.checked);
});

/**
 * Clear all data
 */
clearDataBtn.addEventListener('click', async () => {
  if (confirm('Are you sure? This will delete ALL study sets and data. This cannot be undone.')) {
    await storage.clearAllData();
    await storage.initializeSettings();
    await loadStudySets();
    await updateStats();
    settingsModal.classList.add('hidden');
    showNotification('All data cleared', 'success');
  }
});

/**
 * New set button
 */
newSetBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.sidePanel.open({ tabId: tabs[0].id });
    }
  });
});

/**
 * Import button
 */
importBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onerror = () => {
      throw new Error('Failed to read file');
    };
    reader.onload = async (event) => {
      try {
        const jsonData = event.target.result;
        const imported = await storage.importStudySet(jsonData);
        
        if (imported) {
          await loadStudySets();
          await updateStats();
          showNotification('Study set imported successfully', 'success');
        } else {
          showNotification('Failed to import study set', 'error');
        }
      } catch (error) {
        ErrorHandler.logError('Import', error, true);
      }
    };
    
    reader.readAsText(file);
  } catch (error) {
    ErrorHandler.logError('File selection', error, true);
  } finally {
    fileInput.value = ''; // Reset file input
  }
});

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Utility: Format date
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  notificationManager.show(message, type);
}
