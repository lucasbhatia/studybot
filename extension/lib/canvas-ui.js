/**
 * Canvas Authentication UI Module
 * Handles university selection and Canvas OAuth sign-in flow
 */

class CanvasAuthUI {
  constructor() {
    this.selectedUniversity = null;
    this.customCanvasUrl = null;
  }

  /**
   * Create university selector dialog
   */
  createUniversitySelector() {
    const container = document.createElement('div');
    container.id = 'canvas-university-selector';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
      <h2 style="font-size: 24px; margin-bottom: 12px; color: #333;">Select Your University</h2>
      <p style="color: #666; margin-bottom: 24px;">Sign in with your university's Canvas LMS</p>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">University</label>
        <select id="university-select" style="
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        ">
          <option value="">-- Select your university --</option>
          ${this.getUniversityOptions()}
          <option value="custom">Custom Canvas URL</option>
        </select>
      </div>

      <div id="custom-url-container" style="display: none; margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">Canvas URL</label>
        <input 
          id="custom-canvas-url" 
          type="url" 
          placeholder="https://canvas.example.com"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
          "
        />
      </div>

      <div id="client-id-container" style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">Canvas Developer Key</label>
        <input 
          id="canvas-client-id" 
          type="text" 
          placeholder="Your Canvas OAuth Client ID"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
          "
        />
        <p style="font-size: 12px; color: #999; margin-top: 6px;">
          <a href="https://canvas.instructure.com/doc/api/file.developer_key_management.html" target="_blank" style="color: #667eea; text-decoration: none;">
            How to get your Developer Key →
          </a>
        </p>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="canvas-proceed-btn" style="
          flex: 1;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Sign In with Canvas</button>
        <button id="canvas-cancel-btn" style="
          flex: 1;
          padding: 12px 24px;
          background: #f3f3f3;
          color: #333;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Cancel</button>
      </div>
    `;

    container.appendChild(modal);

    // Setup event listeners
    const select = modal.querySelector('#university-select');
    const customContainer = modal.querySelector('#custom-url-container');
    const proceedBtn = modal.querySelector('#canvas-proceed-btn');
    const cancelBtn = modal.querySelector('#canvas-cancel-btn');

    select.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customContainer.style.display = 'block';
      } else {
        customContainer.style.display = 'none';
      }
      this.selectedUniversity = e.target.value;
    });

    proceedBtn.addEventListener('click', () => this.handleProceed(modal));
    cancelBtn.addEventListener('click', () => {
      container.remove();
    });

    return container;
  }

  /**
   * Get university select options
   */
  getUniversityOptions() {
    const universities = STUDYBOT_CONFIG.CANVAS_OAUTH.UNIVERSITY_URLS;
    return Object.entries(universities)
      .map(([name, url]) => `<option value="${url}">${name}</option>`)
      .join('');
  }

  /**
   * Handle proceed button click
   */
  async handleProceed(modal) {
    const select = modal.querySelector('#university-select').value;
    const customUrl = modal.querySelector('#custom-canvas-url')?.value;
    const clientId = modal.querySelector('#canvas-client-id').value;

    const canvasUrl = select === 'custom' ? customUrl : select;

    if (!canvasUrl || !clientId) {
      this.showError('Please fill in all required fields');
      return;
    }

    // Save config to storage
    await new Promise((resolve) => {
      chrome.storage.local.set({
        canvas_oauth_config: {
          clientId: clientId,
          canvasUrl: canvasUrl,
        },
      }, resolve);
    });

    // Close modal
    const container = modal.closest('#canvas-university-selector');
    if (container) {
      container.remove();
    }

    // Start Canvas OAuth flow
    const result = await canvasAuth.signIn(canvasUrl, clientId);

    if (!result.success) {
      this.showError(result.error || 'Canvas sign in failed');
    }
  }

  /**
   * Show error toast
   */
  showError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #ef4444;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  /**
   * Create onboarding flow with Canvas option
   */
  createOnboardingFlow() {
    const container = document.createElement('div');
    container.id = 'canvas-onboarding';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    card.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 24px;">📚</div>
      <h1 style="font-size: 28px; margin-bottom: 12px; color: #333;">Welcome to StudyBot</h1>
      <p style="color: #666; margin-bottom: 32px; font-size: 16px;">
        Study smarter with AI-powered tools and collaborate with classmates
      </p>

      <div style="text-align: left; background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 600; margin-right: 12px;">1</span>
          <span style="color: #333; font-weight: 500;">Sign in with Canvas</span>
        </div>
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 600; margin-right: 12px;">2</span>
          <span style="color: #333; font-weight: 500;">Auto-sync your courses</span>
        </div>
        <div>
          <span style="display: inline-block; background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 600; margin-right: 12px;">3</span>
          <span style="color: #333; font-weight: 500;">Connect with classmates</span>
        </div>
      </div>

      <button id="canvas-signin-btn" style="
        width: 100%;
        padding: 14px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        margin-bottom: 12px;
      ">Sign In with Canvas</button>

      <button id="google-signin-btn" style="
        width: 100%;
        padding: 14px;
        background: #f3f3f3;
        color: #333;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
      ">Sign In with Google</button>

      <p style="color: #999; font-size: 12px; margin-top: 16px;">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    `;

    container.appendChild(card);

    // Setup event listeners
    card.querySelector('#canvas-signin-btn').addEventListener('click', () => {
      const selector = this.createUniversitySelector();
      document.body.appendChild(selector);
    });

    card.querySelector('#google-signin-btn').addEventListener('click', async () => {
      const result = await auth.signInWithGoogle();
      if (result.success) {
        container.remove();
        // Redirect to main app
        window.location.href = chrome.runtime.getURL('sidepanel/sidepanel.html');
      }
    });

    return container;
  }

  /**
   * Show Canvas auth success screen
   */
  createSuccessScreen(user) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    card.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 24px; animation: bounce 0.6s;">✨</div>
      <h1 style="font-size: 28px; margin-bottom: 12px; color: #333;">Welcome, ${user.name}!</h1>
      <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
        Your courses are being loaded...
      </p>

      <div style="margin: 32px 0;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>

      <p style="color: #999; font-size: 14px;">
        This will close in a moment
      </p>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    container.appendChild(card);
    return container;
  }
}

// Create global instance
const canvasAuthUI = new CanvasAuthUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasAuthUI;
}
