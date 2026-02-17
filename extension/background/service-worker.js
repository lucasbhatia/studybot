// StudyBot Service Worker (Manifest V3)
// Handles OAuth callbacks, message routing, and background tasks

/**
 * Handle OAuth callback from Supabase
 * Called from auth/callback.html when user completes Google sign-in
 */
async function handleOAuthCallback(hash) {
  try {
    // We need to load auth.js to process the callback
    // Since service worker doesn't have DOM, we'll parse and store directly
    const params = new URLSearchParams(hash.substring(1));
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = parseInt(params.get('expires_in'), 10);
    const tokenType = params.get('token_type');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      throw new Error(errorDescription || error);
    }

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get user info from the token (using Supabase URL from config)
    const supabaseUrl = STUDYBOT_CONFIG?.SUPABASE_URL || '';
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    const user = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then(r => r.json());

    if (!user.id) {
      throw new Error('Failed to fetch user information');
    }

    // Create session object
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType,
      expires_at: expiresAt,
      expires_in: expiresIn,
      user,
    };

    // Save to chrome storage
    await new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          supabase_auth_session: session,
          supabase_user: user,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });

    return { success: true, session, user };
  } catch (error) {
    console.error('OAuth callback handling failed:', error);
    return { success: false, error: error.message };
  }
}

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
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  } else if (info.menuItemId === 'studybot-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractSelectedText',
      text: info.selectionText,
    });
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  }
});

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle OAuth callback from auth/callback.html
  if (request.type === 'HANDLE_OAUTH_CALLBACK') {
    handleOAuthCallback(request.hash).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }

  if (request.action === 'extractedContent') {
    // Store extracted content temporarily so sidepanel can access it even if opened after extraction
    chrome.storage.local.set({
      pendingExtractedContent: {
        content: request.content,
        url: request.url,
        title: request.title,
        wasTruncated: request.wasTruncated,
        isSelection: request.isSelection,
        timestamp: Date.now(),
      }
    }, () => {
      // Notify any listening sidepanels/popups
      try {
        chrome.runtime.sendMessage({
          action: 'extractedContentStored',
          data: request
        });
      } catch (e) {
        // Receiver may not exist yet, that's okay
      }
    });
    sendResponse({ received: true });
  } else if (request.action === 'openSidePanel') {
    if (chrome.sidePanel && chrome.sidePanel.open && sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
    sendResponse({ success: true });
  } else if (request.action === 'getPageContent') {
    sendResponse({ received: true });
  }
  return true; // Keep channel open for async responses
});

// Listen for tab changes
chrome.tabs.onActivated.addListener(() => {
  // Tab context tracking for future features
});
