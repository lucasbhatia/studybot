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
        title: 'Step 4: Canvas LMS (Optional)',
        content: 'Connect your Canvas account to import courses, assignments, and syllabi directly into StudyBot. No Canvas account? You can skip this.',
        icon: '🎓',
        buttons: ['back', 'skip', 'next'],
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
