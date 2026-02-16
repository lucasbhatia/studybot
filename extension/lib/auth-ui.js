/**
 * Authentication UI Helper
 * Renders auth UI in popup and sidepanel
 */

class AuthUI {
  /**
   * Render authentication section in popup settings
   */
  static renderPopupAuthSection() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    if (auth.isAuthenticated()) {
      return AuthUI.renderAuthenticatedUI(authSection);
    } else {
      return AuthUI.renderUnauthenticatedUI(authSection);
    }
  }

  /**
   * Render UI for authenticated user
   */
  static async renderAuthenticatedUI(container) {
    container.innerHTML = '';

    try {
      const profile = await auth.getUserProfile();
      const usage = await usageTracker.getUsage();

      // Create authenticated UI
      const authUI = document.createElement('div');
      authUI.style.cssText = `
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 6px;
      `;

      authUI.innerHTML = `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            ${
              profile.avatar
                ? `<img src="${profile.avatar}" alt="${profile.email}" style="width: 32px; height: 32px; border-radius: 50%;">`
                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${profile.email[0].toUpperCase()}</div>`
            }
            <div>
              <div style="font-weight: 500; font-size: 12px;">${profile.name}</div>
              <div style="font-size: 11px; color: var(--secondary);">${profile.email}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px; padding: 10px; background: var(--bg-tertiary); border-radius: 4px;">
          <div style="font-size: 11px; color: var(--secondary); margin-bottom: 6px;">Monthly Usage (Free Tier)</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
              <div id="usageBarPopup" style="height: 100%; width: ${usage.percentage}%; background: var(--accent); transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 11px; font-weight: 500; min-width: 40px; text-align: right;">${usage.count}/${usage.limit}</div>
          </div>
        </div>

        <button id="signOutBtn" class="btn btn-sm btn-secondary" style="width: 100%;">Sign Out</button>
      `;

      container.appendChild(authUI);

      // Sign out button
      document.getElementById('signOutBtn')?.addEventListener('click', async () => {
        await AuthUI.handleSignOut();
      });
    } catch (error) {
      console.error('Error rendering authenticated UI:', error);
      container.innerHTML = `<p style="color: red; font-size: 11px;">Error loading profile</p>`;
    }
  }

  /**
   * Render UI for unauthenticated user
   */
  static async renderUnauthenticatedUI(container) {
    container.innerHTML = '';

    const unAuthUI = document.createElement('div');
    unAuthUI.style.cssText = `
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
    `;

    unAuthUI.innerHTML = `
      <p style="font-size: 12px; color: var(--secondary); margin-bottom: 12px;">
        Sign in with Google to get unlimited AI generation and sync across devices.
      </p>
      <button id="googleSignInBtn" class="btn btn-primary" style="width: 100%; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Sign In with Google</span>
      </button>
      <p style="font-size: 10px; color: var(--secondary); text-align: center; margin-bottom: 8px;">or</p>
      <p style="font-size: 11px; color: var(--secondary); text-align: center;">
        Configure API key below for unlimited generations
      </p>
    `;

    container.appendChild(unAuthUI);

    // Google sign-in button
    document.getElementById('googleSignInBtn')?.addEventListener('click', () => {
      AuthUI.handleGoogleSignIn();
    });
  }

  /**
   * Handle Google sign-in
   */
  static async handleGoogleSignIn() {
    try {
      const result = await auth.signInWithGoogle();

      if (result.success) {
        // Show success message and refresh UI
        const notification = document.createElement('div');
        notification.textContent = '✓ Signed in successfully!';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 1000;
        `;
        document.body.appendChild(notification);

        // Refresh UI
        setTimeout(() => {
          AuthUI.renderPopupAuthSection();
          AuthUI.updateHeaderAuthStatus();
          notification.remove();
        }, 1500);
      } else {
        throw new Error(result.error || 'Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert(`Sign in failed: ${error.message}`);
    }
  }

  /**
   * Handle sign out
   */
  static async handleSignOut() {
    try {
      const result = await auth.signOut();

      if (result.success) {
        // Refresh UI
        AuthUI.renderPopupAuthSection();
        AuthUI.updateHeaderAuthStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      alert(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Update header auth status
   */
  static updateHeaderAuthStatus() {
    const userEmail = document.getElementById('userEmail');
    const signOutBtnHeader = document.getElementById('signOutBtnHeader');
    const signOutBtnHeader2 = document.getElementById('signOutBtnHeader');

    if (auth.isAuthenticated()) {
      auth.getUser().then((user) => {
        if (userEmail) {
          userEmail.textContent = user?.email || 'Signed in';
          userEmail.style.display = 'block';
        }
        if (signOutBtnHeader) {
          signOutBtnHeader.style.display = 'block';
          signOutBtnHeader.addEventListener('click', () => AuthUI.handleSignOut());
        }
      });
    } else {
      if (userEmail) userEmail.style.display = 'none';
      if (signOutBtnHeader) signOutBtnHeader.style.display = 'none';
    }
  }

  /**
   * Render header for sidepanel
   */
  static renderSidepanelAuthHeader() {
    const headerContent = document.querySelector('.header-content');
    if (!headerContent) return;

    const authHeader = document.createElement('div');
    authHeader.id = 'sidepanelAuthHeader';
    authHeader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 40px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
    `;

    if (auth.isAuthenticated()) {
      auth.getUser().then((user) => {
        authHeader.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--secondary);">Signed in as</span>
            <span style="font-weight: 500;">${user?.email || 'User'}</span>
          </div>
          <button id="sidepanelSignOutBtn" class="btn-icon-sm" title="Sign Out" style="padding: 4px;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        `;

        document.getElementById('sidepanelSignOutBtn')?.addEventListener('click', () => {
          AuthUI.handleSignOut();
        });
      });
    } else {
      authHeader.innerHTML = `
        <span style="color: var(--secondary);">Not signed in</span>
        <button id="sidepanelSignInBtn" class="btn btn-sm btn-primary">Sign In</button>
      `;

      document.getElementById('sidepanelSignInBtn')?.addEventListener('click', () => {
        AuthUI.handleGoogleSignIn();
      });
    }

    // Insert after header-content or create new header section
    const existingHeader = document.getElementById('sidepanelAuthHeader');
    if (existingHeader) {
      existingHeader.remove();
    }
    headerContent.parentElement?.insertBefore(authHeader, headerContent.nextSibling);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthUI;
}
