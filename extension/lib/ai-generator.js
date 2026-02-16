// AI Generator - Tries Claude API first, falls back to templates
// Supports both user API keys (BYOK) and proxy server

class AIGenerator {
  constructor() {
    this.claudeAPI = new ClaudeAPIService();
    this.definitionPatterns = [
      /^(.+?)\s+is\s+(.+?)$/i,
      /^(.+?)\s+refers?\s+to\s+(.+?)$/i,
      /^(.+?)\s*:\s+(.+?)$/i,
      /^(.+?)\s*–\s+(.+?)$/,
    ];
  }

  /**
   * Generate complete study materials from text
   * Tries Claude API first, falls back to template-based generation
   */
  async generateStudyMaterials(text, contentTitle = 'Untitled') {
    const cleanText = this.sanitizeText(text);

    // Try Claude API first
    try {
      console.log('Attempting to generate with Claude API...');
      const result = await this.claudeAPI.generateStudyMaterials(cleanText, contentTitle);
      
      if (result.success) {
        console.log('Claude API generation successful');
        return {
          summary: {
            brief: result.summary.text.substring(0, 200),
            standard: result.summary.text,
            detailed: result.summary.text,
          },
          flashcards: result.flashcards || [],
          quiz: this.formatQuizFromAPI(result.quiz || []),
          metadata: {
            title: contentTitle,
            characterCount: cleanText.length,
            generatedAt: new Date().toISOString(),
            source: 'claude-api',
          },
        };
      }
    } catch (error) {
      console.warn('Claude API generation failed, falling back to templates:', error.message);
    }

    // Fallback to template-based generation
    const sentences = this.extractSentences(cleanText);
    const paragraphs = this.extractParagraphs(cleanText);
    
    return {
      summary: {
        brief: this.generateSummary(sentences, 'brief'),
        standard: this.generateSummary(sentences, 'standard'),
        detailed: this.generateSummary(sentences, 'detailed'),
      },
      flashcards: this.generateFlashcards(cleanText, paragraphs),
      quiz: this.generateQuiz(sentences, 'medium'),
      metadata: {
        title: contentTitle,
        characterCount: cleanText.length,
        sentenceCount: sentences.length,
        generatedAt: new Date().toISOString(),
        source: 'template-fallback',
      },
    };
  }

  /**
   * Format quiz from Claude API response
   */
  formatQuizFromAPI(questions) {
    return questions.map((q) => ({
      id: this.generateId(),
      question: q.question,
      type: q.type || 'multiple-choice',
      correctAnswerIndex: q.correctAnswerIndex || 0,
      difficulty: q.difficulty || 'medium',
      options: q.options || [],
    }));
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate summaries at different detail levels
   */
  generateSummary(sentences, detailLevel = 'standard') {
    const topicSentences = this.extractTopicSentences(sentences);
    let count;
    
    switch (detailLevel) {
      case 'brief':
        count = Math.ceil(topicSentences.length * 0.3);
        break;
      case 'detailed':
        count = Math.ceil(topicSentences.length * 0.7);
        break;
      case 'standard':
      default:
        count = Math.ceil(topicSentences.length * 0.5);
    }
    
    const selected = topicSentences.slice(0, count);
    return this.formatSummary(selected);
  }

  /**
   * Generate flashcards from content
   */
  generateFlashcards(text, paragraphs) {
    const cards = [];
    
    // Extract definition-based cards
    const definitions = this.extractDefinitions(text);
    definitions.forEach(def => {
      cards.push({
        id: this.generateId(),
        question: `What is ${def.term}?`,
        answer: def.definition,
        category: 'Definitions',
        difficulty: 'easy',
        known: false,
      });
    });
    
    // Extract concept cards from bolded text
    const concepts = this.extractConcepts(text);
    concepts.forEach(concept => {
      if (cards.length < 50) { // Limit to 50 cards
        cards.push({
          id: this.generateId(),
          question: `Explain: ${concept}`,
          answer: this.generateConceptAnswer(text, concept),
          category: 'Concepts',
          difficulty: 'medium',
          known: false,
        });
      }
    });
    
    // Generate fill-in-the-blank cards
    const blanks = this.generateFillInTheBlank(paragraphs);
    blanks.forEach(blank => {
      if (cards.length < 50) {
        cards.push({
          id: this.generateId(),
          question: blank.question,
          answer: blank.answer,
          category: 'Fill-in-the-Blank',
          difficulty: 'medium',
          known: false,
        });
      }
    });
    
    return cards.slice(0, 50); // Limit total cards
  }

  /**
   * Generate quiz questions
   */
  generateQuiz(sentences, difficulty = 'medium') {
    const questions = [];
    
    // Generate multiple choice questions
    sentences.forEach((sentence, index) => {
      if (questions.length >= 10) return; // Limit to 10 questions
      
      if (sentence.length > 20) { // Only use substantial sentences
        const mcQuestion = this.generateMultipleChoice(sentence, sentences);
        if (mcQuestion) {
          questions.push(mcQuestion);
        }
      }
      
      // Add some true/false questions
      if (questions.length < 8 && index % 3 === 0) {
        const tfQuestion = this.generateTrueFalse(sentence);
        if (tfQuestion) {
          questions.push(tfQuestion);
        }
      }
    });
    
    return questions.slice(0, 10);
  }

  /**
   * Extract key definitions using patterns
   */
  extractDefinitions(text) {
    const definitions = [];
    const sentences = this.extractSentences(text);
    
    sentences.forEach(sentence => {
      for (const pattern of this.definitionPatterns) {
        const match = sentence.match(pattern);
        if (match && match[1] && match[2]) {
          const term = match[1].trim().replace(/^[a-z]/, c => c.toUpperCase());
          const def = match[2].trim().replace(/\.$/, '');
          
          if (term.length > 2 && term.length < 50 && def.length > 10) {
            definitions.push({ term, definition: def });
          }
        }
      }
    });
    
    // Remove duplicates
    return definitions.filter((item, index, self) =>
      index === self.findIndex(t => t.term.toLowerCase() === item.term.toLowerCase())
    );
  }

  /**
   * Extract important concepts (simulate bolded text extraction)
   */
  extractConcepts(text) {
    const concepts = [];
    
    // Look for capitalized phrases and common keywords
    const words = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g) || [];
    const stopWords = new Set(['The', 'And', 'This', 'That', 'With', 'From', 'For']);
    
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        concepts.push(word);
      }
    });
    
    // Return unique concepts
    return [...new Set(concepts)].slice(0, 20);
  }

  /**
   * Generate concept explanation
   */
  generateConceptAnswer(text, concept) {
    const sentences = this.extractSentences(text);
    const relevant = sentences.filter(s =>
      s.toLowerCase().includes(concept.toLowerCase())
    );
    
    if (relevant.length > 0) {
      return relevant[0].replace(/\.$/, '') + '.';
    }
    
    return `${concept} is an important concept in this material.`;
  }

  /**
   * Generate fill-in-the-blank questions
   */
  generateFillInTheBlank(paragraphs) {
    const blanks = [];
    
    paragraphs.forEach(paragraph => {
      const sentences = paragraph.split(/[.!?]+/);
      sentences.forEach(sentence => {
        const words = sentence.trim().split(/\s+/);
        if (words.length > 5) {
          // Find a good word to blank out (not too common)
          const importantWordIdx = words.findIndex((w, i) => 
            w.length > 4 && i > 1 && i < words.length - 1
          );
          
          if (importantWordIdx > -1) {
            const blankedWord = words[importantWordIdx];
            const question = words
              .map((w, i) => i === importantWordIdx ? '______' : w)
              .join(' ');
            
            blanks.push({
              question: question + '?',
              answer: blankedWord,
            });
          }
        }
      });
    });
    
    return blanks.slice(0, 15);
  }

  /**
   * Generate multiple choice question
   */
  generateMultipleChoice(sentence, allSentences) {
    // Extract a key phrase as the question stem
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    if (words.length < 5) return null;
    
    // Use middle words as distractor source
    const correctAnswer = words[Math.floor(words.length / 2)];
    const otherWords = words.filter(w => w !== correctAnswer);
    
    // Get distractor options from other sentences
    const distractors = new Set();
    allSentences.forEach(sent => {
      sent.split(/\s+/).forEach(word => {
        if (word.length > 3 && word !== correctAnswer && distractors.size < 3) {
          distractors.add(word);
        }
      });
    });
    
    if (distractors.size < 3) return null;
    
    const options = [correctAnswer, ...Array.from(distractors).slice(0, 3)];
    
    return {
      id: this.generateId(),
      type: 'multiple-choice',
      question: `From the text: ${sentence.slice(0, 80)}...`,
      options: this.shuffleArray(options),
      correctAnswer: correctAnswer,
      difficulty: 'medium',
    };
  }

  /**
   * Generate true/false question
   */
  generateTrueFalse(sentence) {
    // Create a true statement
    const cleanSentence = sentence.replace(/^[^a-zA-Z]+/, '').trim();
    if (cleanSentence.length < 15) return null;
    
    return {
      id: this.generateId(),
      type: 'true-false',
      question: cleanSentence,
      options: ['True', 'False'],
      correctAnswer: Math.random() > 0.5 ? 'True' : 'False',
      difficulty: 'easy',
    };
  }

  /**
   * Extract topic sentences (likely first sentence of paragraphs)
   */
  extractTopicSentences(sentences) {
    return sentences.filter(s => s.length > 30 && s.length < 300);
  }

  /**
   * Extract sentences from text
   */
  extractSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 100); // Limit to 100 sentences
  }

  /**
   * Extract paragraphs from text
   */
  extractParagraphs(text) {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);
  }

  /**
   * Format summary with key concepts highlighted
   */
  formatSummary(sentences) {
    const summary = sentences.join(' ');
    return {
      text: summary,
      keyPoints: this.extractKeyPoints(summary),
    };
  }

  /**
   * Extract key points from summary
   */
  extractKeyPoints(text) {
    const points = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences.map(s => s.trim()).slice(0, 5);
  }

  /**
   * Sanitize text for processing
   */
  sanitizeText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.!?:;,'-]/g, '')
      .trim();
  }

  /**
   * Utility: Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Utility: Shuffle array
   */
  shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIGenerator;
}
