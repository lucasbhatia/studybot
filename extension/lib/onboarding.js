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
        id: 'extract',
        title: 'Step 1: Extract Content',
        content: 'Click the floating button (bottom-right) on any webpage to extract content. StudyBot will analyze it and create study materials.',
        icon: '📄',
        buttons: ['back', 'next'],
      },
      {
        id: 'generate',
        title: 'Step 2: Generate Materials',
        content: 'StudyBot uses AI to create:\n• Summaries (brief, standard, detailed)\n• Flashcards with auto-flip animation\n• Quizzes to test your knowledge',
        icon: '✨',
        buttons: ['back', 'next'],
      },
      {
        id: 'canvas',
        title: 'Step 3: Canvas LMS (Optional)',
        content: 'Connect your Canvas account to import courses, assignments, and syllabi directly into StudyBot. No Canvas account? You can skip this.',
        icon: '🎓',
        buttons: ['back', 'skip', 'next'],
      },
      {
        id: 'ai-key',
        title: 'Step 4: API Configuration (Optional)',
        content: 'For better AI generation, you can:\n• Bring your own Claude API key\n• Or use the free proxy (5 generations/month)\nYou can always configure these later in settings.',
        icon: '🔑',
        buttons: ['back', 'skip', 'done'],
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
