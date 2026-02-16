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

let allStudySets = [];
let currentSearchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await storage.initializeSettings();
  await loadStudySets();
  await loadSettings();
  await updateStats();
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
 * Search study sets
 */
searchInput.addEventListener('input', (e) => {
  currentSearchQuery = e.target.value.toLowerCase();
  
  const filtered = allStudySets.filter(set =>
    set.title.toLowerCase().includes(currentSearchQuery) ||
    set.content.toLowerCase().includes(currentSearchQuery)
  );
  
  renderStudySets(filtered);
});

/**
 * Load settings
 */
async function loadSettings() {
  const settings = await storage.getSettings();
  
  darkModeToggle.checked = settings.darkMode;
  detailLevelSelect.value = settings.aiDetailLevel;
  notificationsToggle.checked = settings.notifications;
  
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

  const reader = new FileReader();
  reader.onload = async (event) => {
    const jsonData = event.target.result;
    const imported = await storage.importStudySet(jsonData);
    
    if (imported) {
      await loadStudySets();
      await updateStats();
      showNotification('Study set imported successfully', 'success');
    } else {
      showNotification('Failed to import study set', 'error');
    }
  };
  
  reader.readAsText(file);
  fileInput.value = ''; // Reset file input
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
  // For now, just log. In a real app, we'd show a toast
  console.log(`[${type.toUpperCase()}] ${message}`);
}
