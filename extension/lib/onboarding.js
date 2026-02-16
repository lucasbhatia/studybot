/**
 * Onboarding Flow Manager
 * First-time user experience wizard
 */

class OnboardingManager {
  constructor() {
    this.currentStep = 0;
    this.completed = false;
    this.steps = [
      {
        id: 'welcome',
        title: 'Welcome to StudyBot',
        subtitle: 'AI-Powered Study Assistant',
        content: 'Turn any webpage into flashcards, summaries, and quizzes.',
        icon: '🎓',
        buttons: ['next'],
      },
      {
        id: 'signin',
        title: 'Step 1: Sign In with Google',
        content: 'Create a StudyBot account to:\n• Get unlimited AI generation\n• Sync across devices\n• Track your usage\n• Access premium features',
        icon: '🔐',
        actionButton: 'googleSignIn',
        buttons: ['back', 'skip', 'done'],
      },
      {
        id: 'extract',
        title: 'Step 2: Extract Content',
        content: 'Click the floating button (bottom-right) on any webpage to extract content. StudyBot will analyze it and create study materials.',
        icon: '📄',
        buttons: ['back', 'next'],
      },
      {
        id: 'generate',
        title: 'Step 3: Generate Materials',
        content: 'StudyBot uses AI to create:\n• Summaries (brief, standard, detailed)\n• Flashcards with auto-flip animation\n• Quizzes to test your knowledge',
        icon: '✨',
        buttons: ['back', 'next'],
      },
      {
        id: 'canvas',
        title: 'Step 4: Connect Canvas (Optional)',
        content: 'Import your courses and assignments from Canvas. If you have a Canvas account, follow the quick setup below. No Canvas? You can skip this.',
        icon: '🎓',
        buttons: ['back', 'skip', 'next'],
        hasForm: true,
      },
      {
        id: 'ready',
        title: 'You\'re All Set!',
        subtitle: 'Ready to study smarter',
        content: 'Your StudyBot is configured and ready to go. Extract content from any webpage or connect Canvas to get started!',
        icon: '🚀',
        buttons: ['done'],
      },
    ];
  }

  /**
   * Check if onboarding has been completed
   */
  async hasCompleted() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['onboarding_completed'], (result) => {
        resolve(result.onboarding_completed === true);
      });
    });
  }

  /**
   * Mark onboarding as completed
   */
  async markCompleted() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ onboarding_completed: true }, () => {
        resolve(true);
      });
    });
  }

  /**
   * Reset onboarding
   */
  async reset() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ onboarding_completed: false }, () => {
        resolve(true);
      });
    });
  }

  /**
   * Get current step
   */
  getCurrentStep() {
    return this.steps[this.currentStep];
  }

  /**
   * Go to next step
   */
  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      return true;
    }
    return false;
  }

  /**
   * Go to previous step
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  /**
   * Go to specific step
   */
  goToStep(stepId) {
    const index = this.steps.findIndex((s) => s.id === stepId);
    if (index >= 0) {
      this.currentStep = index;
      return true;
    }
    return false;
  }

  /**
   * Create Canvas token setup form
   */
  createCanvasSetupForm() {
    const form = document.createElement('div');
    form.style.cssText = `
      background: #F3F4F6;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 13px;
    `;

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-bottom: 12px;
      line-height: 1.5;
      color: #374151;
    `;
    instructions.innerHTML = `
      <strong style="display: block; margin-bottom: 8px;">🔑 Generate Your Canvas Token:</strong>
      <ol style="margin: 0 0 0 16px; padding: 0;">
        <li style="margin-bottom: 4px;">Go to Canvas → Click your profile icon (top left)</li>
        <li style="margin-bottom: 4px;">Click <strong>Settings</strong></li>
        <li style="margin-bottom: 4px;">Scroll to <strong>Approved Integrations</strong></li>
        <li style="margin-bottom: 4px;">Click <strong>+ New Access Token</strong></li>
        <li style="margin-bottom: 4px;">Purpose: <em>StudyBot</em> | Leave Expiry blank</li>
        <li>Click <strong>Generate Token</strong> → Copy it</li>
      </ol>
    `;

    // Canvas URL field
    const urlLabel = document.createElement('label');
    urlLabel.style.cssText = `
      display: block;
      margin-top: 12px;
      margin-bottom: 4px;
      font-weight: 500;
      color: #1f2937;
    `;
    urlLabel.textContent = 'Canvas URL';

    const urlSelect = document.createElement('select');
    urlSelect.id = 'canvas-url-select';
    urlSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 8px;
    `;
    urlSelect.innerHTML = `
      <option value="" selected disabled>Select your university or enter custom URL</option>
      <option value="https://canvas.instructure.com">canvas.instructure.com (US)</option>
      <option value="https://uk.instructure.com">uk.instructure.com (UK)</option>
      <option value="https://au.instructure.com">au.instructure.com (Australia)</option>
      <option value="custom">Custom Canvas URL</option>
    `;

    // Custom URL input (hidden by default)
    const customUrlInput = document.createElement('input');
    customUrlInput.id = 'canvas-url-custom';
    customUrlInput.type = 'text';
    customUrlInput.placeholder = 'https://your-university.instructure.com';
    customUrlInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      font-size: 13px;
      display: none;
      margin-bottom: 8px;
    `;

    urlSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customUrlInput.style.display = 'block';
        customUrlInput.focus();
      } else {
        customUrlInput.style.display = 'none';
      }
    });

    // Token field
    const tokenLabel = document.createElement('label');
    tokenLabel.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #1f2937;
    `;
    tokenLabel.textContent = 'Canvas Token';

    const tokenInput = document.createElement('input');
    tokenInput.id = 'canvas-token-input';
    tokenInput.type = 'password';
    tokenInput.placeholder = 'Paste your Canvas token here';
    tokenInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #D1D5DB;
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 8px;
      font-family: monospace;
    `;

    // Status message
    const status = document.createElement('div');
    status.id = 'canvas-status';
    status.style.cssText = `
      display: none;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 8px;
      text-align: center;
      font-weight: 500;
    `;

    // Connect button
    const connectBtn = document.createElement('button');
    connectBtn.id = 'canvas-connect-btn';
    connectBtn.textContent = 'Connect Canvas';
    connectBtn.style.cssText = `
      width: 100%;
      padding: 8px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.2s;
    `;
    connectBtn.onmouseover = () => (connectBtn.style.background = '#2563EB');
    connectBtn.onmouseout = () => (connectBtn.style.background = '#3B82F6');
    connectBtn.onclick = async (e) => {
      e.preventDefault();
      await this.handleCanvasConnect(urlSelect, customUrlInput, tokenInput, connectBtn, status);
    };

    // Assemble
    form.appendChild(instructions);
    form.appendChild(urlLabel);
    form.appendChild(urlSelect);
    form.appendChild(customUrlInput);
    form.appendChild(tokenLabel);
    form.appendChild(tokenInput);
    form.appendChild(connectBtn);
    form.appendChild(status);

    return form;
  }

  /**
   * Handle Canvas token connection in onboarding
   */
  async handleCanvasConnect(urlSelect, customUrlInput, tokenInput, connectBtn, statusEl) {
    const url = urlSelect.value === 'custom' ? customUrlInput.value : urlSelect.value;
    const token = tokenInput.value;

    if (!url || !token) {
      this.showCanvasStatus(statusEl, 'Please enter Canvas URL and token', 'error');
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';
    this.showCanvasStatus(statusEl, 'Validating token...', 'loading');

    try {
      // Use canvas token service to validate and connect
      if (typeof canvasToken === 'undefined') {
        throw new Error('Canvas token service not loaded');
      }

      const result = await canvasToken.connect(url, token);

      if (result.success) {
        this.showCanvasStatus(
          statusEl,
          `✓ Connected as ${result.profile.name}!`,
          'success'
        );
        connectBtn.textContent = 'Connected ✓';
        tokenInput.disabled = true;
        urlSelect.disabled = true;
        customUrlInput.disabled = true;
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      this.showCanvasStatus(
        statusEl,
        `✗ ${error.message}`,
        'error'
      );
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect Canvas';
    }
  }

  /**
   * Show Canvas status message
   */
  showCanvasStatus(statusEl, message, type) {
    statusEl.style.display = 'block';
    statusEl.textContent = message;

    if (type === 'success') {
      statusEl.style.background = '#DCFCE7';
      statusEl.style.color = '#166534';
    } else if (type === 'error') {
      statusEl.style.background = '#FEE2E2';
      statusEl.style.color = '#991B1B';
    } else if (type === 'loading') {
      statusEl.style.background = '#DBEAFE';
      statusEl.style.color = '#1E40AF';
    }
  }

  /**
   * Create onboarding UI
   */
  createUI() {
    const container = document.createElement('div');
    container.id = 'onboarding-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.className = 'onboarding-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    const step = this.getCurrentStep();

    // Icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 64px;
      margin-bottom: 24px;
    `;
    icon.textContent = step.icon;

    // Title
    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #1f2937;
    `;
    title.textContent = step.title;

    // Subtitle (if exists)
    let subtitle = null;
    if (step.subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #6b7280;
      `;
      subtitleEl.textContent = step.subtitle;
      subtitle = subtitleEl;
    }

    // Content
    const content = document.createElement('p');
    content.style.cssText = `
      margin: 16px 0 24px 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
      white-space: pre-wrap;
    `;
    content.textContent = step.content;

    // Canvas setup form (if needed)
    let canvasFormElement = null;
    if (step.hasForm && step.id === 'canvas') {
      canvasFormElement = this.createCanvasSetupForm();
    }

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 32px;
    `;

    // Handle action buttons (e.g., Google Sign In)
    if (step.actionButton === 'googleSignIn') {
      const actionBtn = document.createElement('button');
      actionBtn.style.cssText = `
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        background: #3B82F6;
        color: white;
        width: 100%;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;
      actionBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Sign In with Google</span>
      `;
      actionBtn.onmouseover = () => (actionBtn.style.background = '#2563EB');
      actionBtn.onmouseout = () => (actionBtn.style.background = '#3B82F6');
      actionBtn.onclick = () => {
        if (typeof AuthUI !== 'undefined') {
          AuthUI.handleGoogleSignIn().then(() => {
            this.handleNext();
          });
        }
      };
      buttonContainer.appendChild(actionBtn);
    }

    step.buttons.forEach((buttonType) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      `;

      if (buttonType === 'next' || buttonType === 'done') {
        btn.textContent = buttonType === 'next' ? 'Next' : 'Done';
        btn.style.cssText += `
          background: #3B82F6;
          color: white;
        `;
        btn.onmouseover = () => (btn.style.background = '#2563EB');
        btn.onmouseout = () => (btn.style.background = '#3B82F6');
        btn.onclick = () => this.handleNext();
      } else if (buttonType === 'back') {
        btn.textContent = 'Back';
        btn.style.cssText += `
          background: #E5E7EB;
          color: #374151;
        `;
        btn.onmouseover = () => (btn.style.background = '#D1D5DB');
        btn.onmouseout = () => (btn.style.background = '#E5E7EB');
        btn.onclick = () => this.handlePrev();
      } else if (buttonType === 'skip') {
        btn.textContent = 'Skip';
        btn.style.cssText += `
          background: transparent;
          color: #6B7280;
          border: 1px solid #D1D5DB;
        `;
        btn.onmouseover = () => (btn.style.background = '#F9FAFB');
        btn.onmouseout = () => (btn.style.background = 'transparent');
        btn.onclick = () => this.handleNext();
      }

      buttonContainer.appendChild(btn);
    });

    // Progress bar
    const progress = document.createElement('div');
    progress.style.cssText = `
      height: 4px;
      background: #E5E7EB;
      border-radius: 2px;
      margin-bottom: 32px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      background: #3B82F6;
      width: ${((this.currentStep + 1) / this.steps.length) * 100}%;
      transition: width 0.3s;
    `;
    progress.appendChild(progressFill);

    // Assemble
    modal.appendChild(progress);
    modal.appendChild(icon);
    modal.appendChild(title);
    if (subtitle) modal.appendChild(subtitle);
    modal.appendChild(content);
    if (canvasFormElement) modal.appendChild(canvasFormElement);
    modal.appendChild(buttonContainer);

    container.appendChild(modal);
    document.body.appendChild(container);

    // Add CSS for animations
    if (!document.getElementById('onboarding-styles')) {
      const style = document.createElement('style');
      style.id = 'onboarding-styles';
      style.textContent = `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .onboarding-modal {
          animation: slideUp 0.3s ease;
        }
      `;
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (document.head) {
            document.head.appendChild(style);
          }
        });
      }
    }

    return container;
  }

  /**
   * Show onboarding modal
   */
  async show() {
    const completed = await this.hasCompleted();
    if (completed) return;

    this.createUI();
  }

  /**
   * Hide onboarding modal
   */
  hide() {
    const container = document.getElementById('onboarding-container');
    if (container) {
      container.style.animation = 'fadeIn 0.3s ease reverse';
      setTimeout(() => container.remove(), 300);
    }
  }

  /**
   * Handle next button
   */
  handleNext() {
    if (this.nextStep()) {
      this.hide();
      this.createUI();
    } else {
      // Completed
      this.markCompleted();
      this.hide();
      if (typeof onOnboardingComplete === 'function') {
        onOnboardingComplete();
      }
    }
  }

  /**
   * Handle back button
   */
  handlePrev() {
    if (this.prevStep()) {
      this.hide();
      this.createUI();
    }
  }
}

// Create global instance
const onboarding = new OnboardingManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OnboardingManager;
}
