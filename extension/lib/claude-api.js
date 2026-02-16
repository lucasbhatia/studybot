/**
 * Claude API Service
 * Handles API calls to Claude via proxy or user's BYOK API key
 * 
 * Priority order:
 * 1. User's own API key (BYOK - Bring Your Own Key)
 * 2. StudyBot proxy server (default, requires free tier limit tracking)
 * 3. Fallback to template-based generation (no API available)
 */

class ClaudeAPIService {
  constructor() {
    this.proxyUrl = 'https://api.studybot.dev/v1/generate'; // Placeholder
    this.anthropicUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 1024;
  }

  /**
   * Get API configuration from storage
   */
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['anthropic_api_key', 'use_proxy'], (result) => {
        resolve({
          apiKey: result.anthropic_api_key || null,
          useProxy: result.use_proxy !== false, // Default to proxy
        });
      });
    });
  }

  /**
   * Save API key to storage
   */
  async saveApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ anthropic_api_key: apiKey }, () => {
        resolve(true);
      });
    });
  }

  /**
   * Test API key validity
   */
  async testApiKey(apiKey) {
    try {
      const response = await fetch(this.anthropicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: 'Say "ok" if you can read this.',
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API test failed:', error);
        return { success: false, error: error.error?.message || 'API key invalid' };
      }

      return { success: true };
    } catch (error) {
      console.error('API test error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(content, title = 'Content') {
    const prompt = `Extract 5-10 flashcards from this text. Format as valid JSON array (no markdown, just raw JSON):
[
  {"question": "...", "answer": "...", "difficulty": "easy|medium|hard"},
  ...
]

Requirements:
- Questions should be clear and unambiguous
- Answers should be concise (1-3 sentences max)
- Cover different aspects of the content
- Vary difficulty levels from easy to hard
- Only return the JSON array, no other text

Content title: "${title}"

Content to extract from:
${content}`;

    return this.callAPI(prompt, 'flashcards');
  }

  /**
   * Generate summary from content
   */
  async generateSummary(content, level = 'standard', title = 'Content') {
    const levelGuide = {
      brief: '1-2 sentences, key concept only',
      standard: '3-5 sentences, main points',
      detailed: 'Full explanation with examples and context',
    };

    const prompt = `Create a ${level} summary of this text.

Level: ${level}
${levelGuide[level] || levelGuide.standard}

Also provide 3-5 key points as a bullet list.

Format as valid JSON (no markdown, just raw JSON):
{
  "text": "...",
  "keyPoints": ["...", "...", ...]
}

Content title: "${title}"

Content:
${content}`;

    return this.callAPI(prompt, 'summary');
  }

  /**
   * Generate quiz questions from content
   */
  async generateQuiz(content, title = 'Content') {
    const prompt = `Create 5 quiz questions from this text. Format as valid JSON array (no markdown, just raw JSON):
[
  {
    "question": "...",
    "type": "multiple-choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "difficulty": "easy|medium|hard"
  },
  {
    "question": "...",
    "type": "true-false",
    "options": ["True", "False"],
    "correctAnswer": 0,
    "difficulty": "easy|medium|hard"
  },
  ...
]

Requirements:
- Mix multiple choice and true/false questions
- For multiple choice: provide 4 options, correctAnswer is index (0-3)
- For true/false: options are always ["True", "False"], correctAnswer is 0 or 1
- Distractors should be plausible but clearly wrong
- Vary difficulty from easy to hard
- Cover the most important concepts
- Only return the JSON array, no other text

Content title: "${title}"

Content to create quiz from:
${content}`;

    return this.callAPI(prompt, 'quiz');
  }

  /**
   * Call Claude API with fallback handling
   */
  async callAPI(prompt, type = 'general') {
    const config = await this.getConfig();

    // Try user's API key first (BYOK)
    if (config.apiKey && !config.useProxy) {
      try {
        return await this.callAnthropicAPI(prompt, config.apiKey);
      } catch (error) {
        console.error('BYOK API call failed:', error);
        // Fall through to proxy
      }
    }

    // Try proxy if available
    if (config.useProxy) {
      try {
        return await this.callProxyAPI(prompt, type);
      } catch (error) {
        console.error('Proxy API call failed:', error);
        // Fall through to template fallback
      }
    }

    // Fallback: return error
    throw new Error('No API available. Please configure API key or enable proxy.');
  }

  /**
   * Call Anthropic API directly with user's key
   */
  async callAnthropicAPI(prompt, apiKey) {
    const response = await fetch(this.anthropicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response
    try {
      return JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse API response as JSON');
    }
  }

  /**
   * Call StudyBot proxy API
   */
  async callProxyAPI(prompt, type) {
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        type,
      }),
    });

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || data;
  }

  /**
   * Generate all study materials at once
   */
  async generateStudyMaterials(content, title = 'Untitled') {
    try {
      const [flashcards, summary, quiz] = await Promise.all([
        this.generateFlashcards(content, title),
        this.generateSummary(content, 'standard', title),
        this.generateQuiz(content, title),
      ]);

      return {
        success: true,
        flashcards: this.validateFlashcards(flashcards),
        summary: this.validateSummary(summary),
        quiz: this.validateQuiz(quiz),
      };
    } catch (error) {
      console.error('Study materials generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate flashcard format
   */
  validateFlashcards(data) {
    if (!Array.isArray(data)) {
      throw new Error('Flashcards must be an array');
    }

    return data
      .filter(
        (card) =>
          card.question && card.answer && typeof card.question === 'string' && typeof card.answer === 'string'
      )
      .slice(0, 50) // Max 50 cards
      .map((card) => ({
        id: this.generateId(),
        question: card.question.substring(0, 500),
        answer: card.answer.substring(0, 1000),
        difficulty: card.difficulty || 'medium',
        known: false,
      }));
  }

  /**
   * Validate summary format
   */
  validateSummary(data) {
    if (typeof data === 'string') {
      return { text: data, keyPoints: [] };
    }

    if (!data || !data.text) {
      throw new Error('Summary must have a text field');
    }

    return {
      text: data.text.substring(0, 2000),
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.slice(0, 10) : [],
    };
  }

  /**
   * Validate quiz format
   */
  validateQuiz(data) {
    if (!Array.isArray(data)) {
      throw new Error('Quiz must be an array');
    }

    return data
      .filter((q) => q.question && q.type && Array.isArray(q.options))
      .slice(0, 10) // Max 10 questions
      .map((q) => ({
        id: this.generateId(),
        question: q.question.substring(0, 500),
        type: q.type === 'true-false' ? 'true-false' : 'multiple-choice',
        options: q.options.slice(0, 4),
        correctAnswerIndex: q.correctAnswer || 0,
        difficulty: q.difficulty || 'medium',
      }));
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeAPIService;
}
