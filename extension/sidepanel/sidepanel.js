// Side Panel Script - Main Study Interface

const storage = new StorageManager();
const aiGenerator = new AIGenerator();
const shareManager = ShareManager;

// DOM Elements
const setTitle = document.getElementById('setTitle');
const extractBtn = document.getElementById('extractBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Summary elements
const summaryContent = document.getElementById('summaryContent');
const summaryEdit = document.getElementById('summaryEdit');
const summaryEditText = document.getElementById('summaryEditText');
const detailLevel = document.getElementById('detailLevel');
const copySummaryBtn = document.getElementById('copySummaryBtn');
const editSummaryBtn = document.getElementById('editSummaryBtn');
const saveSummaryBtn = document.getElementById('saveSummaryBtn');
const cancelSummaryBtn = document.getElementById('cancelSummaryBtn');

// Flashcard elements
const cardDisplay = document.getElementById('cardDisplay');
const card = document.getElementById('card');
const cardQuestion = document.getElementById('cardQuestion');
const cardAnswer = document.getElementById('cardAnswer');
const cardCounter = document.getElementById('cardCounter');
const prevCardBtn = document.getElementById('prevCardBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const shuffleCardBtn = document.getElementById('shuffleCardBtn');
const cardStatus = document.getElementById('cardStatus');
const markKnownBtn = document.getElementById('markKnownBtn');
const markLearningBtn = document.getElementById('markLearningBtn');
const cardActions = document.getElementById('cardActions');
const editCardBtn = document.getElementById('editCardBtn');
const deleteCardBtn = document.getElementById('deleteCardBtn');
const addCardBtn = document.getElementById('addCardBtn');
const cardEditForm = document.getElementById('cardEditForm');
const editCardQuestion = document.getElementById('editCardQuestion');
const editCardAnswer = document.getElementById('editCardAnswer');
const saveCardBtn = document.getElementById('saveCardBtn');
const cancelCardBtn = document.getElementById('cancelCardBtn');

// Quiz elements
const quizStart = document.getElementById('quizStart');
const quizQuestion = document.getElementById('quizQuestion');
const quizResults = document.getElementById('quizResults');
const startQuizBtn = document.getElementById('startQuizBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const retakeQuizBtn = document.getElementById('retakeQuizBtn');
const questionCounter = document.getElementById('questionCounter');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const progressBar = document.getElementById('progressBar');
const scoreValue = document.getElementById('scoreValue');
const resultsList = document.getElementById('resultsList');

// Footer elements
const shareBtn = document.getElementById('shareBtn');
const exportBtn = document.getElementById('exportBtn');

// State
let currentStudySet = null;
let currentCards = [];
let currentCardIndex = 0;
let cardFlipped = false;
let quizQuestions = [];
let quizCurrentIndex = 0;
let quizAnswers = [];
let editingCardId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await storage.initializeSettings();
  await applyTheme();
  setupEventListeners();
  await loadStudySet();
});

/**
 * Apply theme
 */
async function applyTheme() {
  const darkMode = await storage.getSetting('darkMode');
  if (!darkMode) {
    document.body.classList.add('light-mode');
  }
}

/**
 * Load current study set
 */
async function loadStudySet() {
  let setId = await chrome.storage.local.get('currentStudySetId');
  setId = setId.currentStudySetId;

  if (setId) {
    currentStudySet = await storage.getStudySet(setId);
    
    if (currentStudySet) {
      setTitle.textContent = currentStudySet.title;
      currentCards = [...currentStudySet.flashcards];
      displayCard();
      displaySummary();
    }
  } else {
    showEmptyState();
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab navigation
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Summary tab
  detailLevel.addEventListener('change', displaySummary);
  copySummaryBtn.addEventListener('click', copySummary);
  editSummaryBtn.addEventListener('click', enableSummaryEdit);
  saveSummaryBtn.addEventListener('click', saveSummary);
  cancelSummaryBtn.addEventListener('click', disableSummaryEdit);

  // Flashcard tab
  prevCardBtn.addEventListener('click', previousCard);
  nextCardBtn.addEventListener('click', nextCard);
  shuffleCardBtn.addEventListener('click', shuffleCards);
  markKnownBtn.addEventListener('click', () => markCard('known'));
  markLearningBtn.addEventListener('click', () => markCard('learning'));
  editCardBtn.addEventListener('click', enableCardEdit);
  deleteCardBtn.addEventListener('click', deleteCard);
  addCardBtn.addEventListener('click', showAddCardForm);
  saveCardBtn.addEventListener('click', saveCard);
  cancelCardBtn.addEventListener('click', hideCardEditForm);

  // Card flip
  card.addEventListener('click', flipCard);

  // Quiz tab
  startQuizBtn.addEventListener('click', startQuiz);
  nextQuestionBtn.addEventListener('click', nextQuestion);
  retakeQuizBtn.addEventListener('click', retakeQuiz);

  // Footer
  shareBtn.addEventListener('click', shareStudySet);
  exportBtn.addEventListener('click', exportStudySet);

  // Extract button
  extractBtn.addEventListener('click', extractPageContent);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Special handling for quiz
  if (tabName === 'quiz' && quizQuestions.length === 0) {
    quizStart.classList.add('active');
  }
}

/**
 * Display current flashcard
 */
function displayCard() {
  if (currentCards.length === 0) {
    card.classList.add('hidden');
    cardStatus.classList.add('hidden');
    cardActions.classList.add('hidden');
    cardDisplay.innerHTML = '<div class="placeholder">No flashcards to study</div>';
    return;
  }

  card.classList.remove('hidden');
  card.classList.remove('flipped');
  cardFlipped = false;
  cardStatus.classList.remove('hidden');
  cardActions.classList.remove('hidden');

  const currentCard = currentCards[currentCardIndex];
  cardQuestion.textContent = currentCard.question;
  cardAnswer.textContent = currentCard.answer;
  cardCounter.textContent = `${currentCardIndex + 1} / ${currentCards.length}`;
}

/**
 * Flip card
 */
function flipCard() {
  if (!currentCards || currentCards.length === 0) return;
  
  cardFlipped = !cardFlipped;
  card.classList.toggle('flipped');
}

/**
 * Navigate cards
 */
function previousCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    displayCard();
  }
}

function nextCard() {
  if (currentCardIndex < currentCards.length - 1) {
    currentCardIndex++;
    displayCard();
  } else if (currentCardIndex === currentCards.length - 1) {
    // Loop back to start
    currentCardIndex = 0;
    displayCard();
  }
}

function shuffleCards() {
  currentCards = currentCards.sort(() => Math.random() - 0.5);
  currentCardIndex = 0;
  displayCard();
}

/**
 * Mark card as known/learning
 */
async function markCard(status) {
  if (!currentStudySet || currentCards.length === 0) return;

  const card = currentCards[currentCardIndex];
  await storage.updateFlashcard(currentStudySet.id, card.id, {
    known: status === 'known'
  });

  // Update local state
  card.known = status === 'known';

  showNotification(
    status === 'known' ? '✓ Marked as known' : '✗ Marked as still learning'
  );

  // Move to next card
  nextCard();
}

/**
 * Delete flashcard
 */
async function deleteCard() {
  if (!currentStudySet || currentCards.length === 0) return;

  if (confirm('Delete this card?')) {
    const cardId = currentCards[currentCardIndex].id;
    await storage.deleteFlashcard(currentStudySet.id, cardId);

    currentCards = currentCards.filter(c => c.id !== cardId);
    if (currentCardIndex >= currentCards.length) {
      currentCardIndex = Math.max(0, currentCards.length - 1);
    }

    displayCard();
    showNotification('Card deleted');
  }
}

/**
 * Enable card edit form
 */
function enableCardEdit() {
  if (currentCards.length === 0) return;

  const card = currentCards[currentCardIndex];
  editingCardId = card.id;
  editCardQuestion.value = card.question;
  editCardAnswer.value = card.answer;
  cardEditForm.classList.remove('hidden');
}

/**
 * Save edited card
 */
async function saveCard() {
  if (!currentStudySet) return;

  const question = editCardQuestion.value.trim();
  const answer = editCardAnswer.value.trim();

  if (!question || !answer) {
    showNotification('Please fill in both fields', 'error');
    return;
  }

  if (editingCardId) {
    // Update existing card
    await storage.updateFlashcard(currentStudySet.id, editingCardId, {
      question,
      answer
    });

    const cardIdx = currentCards.findIndex(c => c.id === editingCardId);
    if (cardIdx !== -1) {
      currentCards[cardIdx].question = question;
      currentCards[cardIdx].answer = answer;
    }

    showNotification('Card updated');
  } else {
    // Add new card
    const newCard = {
      question,
      answer,
      category: 'Custom',
      difficulty: 'medium',
      known: false,
    };

    await storage.addFlashcard(currentStudySet.id, newCard);
    currentCards.push(newCard);
    currentCardIndex = currentCards.length - 1;

    showNotification('Card added');
  }

  hideCardEditForm();
  displayCard();
}

/**
 * Show add card form
 */
function showAddCardForm() {
  editingCardId = null;
  editCardQuestion.value = '';
  editCardAnswer.value = '';
  cardEditForm.classList.remove('hidden');
}

/**
 * Hide card edit form
 */
function hideCardEditForm() {
  cardEditForm.classList.add('hidden');
  editingCardId = null;
}

/**
 * Display summary
 */
function displaySummary() {
  if (!currentStudySet) {
    summaryContent.innerHTML = '<p class="placeholder">Extract content to generate a summary</p>';
    return;
  }

  const level = detailLevel.value;
  const summary = currentStudySet.summary[level];

  if (!summary) {
    summaryContent.innerHTML = '<p class="placeholder">No summary available</p>';
    return;
  }

  let html = '';
  if (summary.text) {
    html = `<p>${escapeHtml(summary.text)}</p>`;
  }

  if (summary.keyPoints && summary.keyPoints.length > 0) {
    html += '<h4 style="margin-top: 16px; margin-bottom: 8px;">Key Points:</h4>';
    html += '<ul>';
    summary.keyPoints.forEach(point => {
      html += `<li>${escapeHtml(point)}</li>`;
    });
    html += '</ul>';
  }

  summaryContent.innerHTML = html;
}

/**
 * Copy summary to clipboard
 */
async function copySummary() {
  const level = detailLevel.value;
  const summary = currentStudySet?.summary[level];

  if (summary?.text) {
    const result = await shareManager.copyToClipboard(summary.text);
    if (result.success) {
      showNotification('Copied to clipboard');
    }
  }
}

/**
 * Enable summary editing
 */
function enableSummaryEdit() {
  summaryContent.classList.add('hidden');
  summaryEdit.classList.remove('hidden');

  const level = detailLevel.value;
  const summary = currentStudySet?.summary[level];
  summaryEditText.value = summary?.text || '';
}

/**
 * Disable summary editing
 */
function disableSummaryEdit() {
  summaryContent.classList.remove('hidden');
  summaryEdit.classList.add('hidden');
}

/**
 * Save edited summary
 */
async function saveSummary() {
  const level = detailLevel.value;
  const newText = summaryEditText.value.trim();

  if (newText && currentStudySet) {
    const updated = {
      ...currentStudySet.summary,
      [level]: { text: newText, keyPoints: [] }
    };

    await storage.updateStudySet(currentStudySet.id, { summary: updated });
    currentStudySet.summary = updated;

    disableSummaryEdit();
    displaySummary();
    showNotification('Summary updated');
  }
}

/**
 * Start quiz
 */
function startQuiz() {
  if (!currentStudySet || currentStudySet.flashcards.length === 0) {
    showNotification('No cards to quiz', 'error');
    return;
  }

  // Generate quiz from flashcards
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

  quizQuestions = currentStudySet.flashcards.map(card => ({
    id: card.id,
    question: card.question,
    type: Math.random() > 0.7 ? 'true-false' : 'multiple-choice',
    difficulty: difficulty,
    correct: Math.random() > 0.5 ? 'A' : 'B',
  }));

  quizQuestions = quizQuestions.slice(0, 10);
  quizCurrentIndex = 0;
  quizAnswers = [];

  quizStart.classList.remove('active');
  quizQuestion.classList.add('active');

  displayQuestion();
}

/**
 * Display quiz question
 */
function displayQuestion() {
  if (quizCurrentIndex >= quizQuestions.length) {
    displayQuizResults();
    return;
  }

  const q = quizQuestions[quizCurrentIndex];
  questionText.textContent = q.question;
  questionCounter.textContent = `${quizCurrentIndex + 1} / ${quizQuestions.length}`;

  // Update progress bar
  const progress = (quizCurrentIndex / quizQuestions.length) * 100;
  progressBar.style.width = progress + '%';

  // Generate options
  const options = q.type === 'true-false'
    ? ['True', 'False']
    : ['Option A', 'Option B', 'Option C', 'Option D'];

  optionsContainer.innerHTML = options.map((opt, idx) => `
    <div class="option" data-index="${idx}">
      ${escapeHtml(opt)}
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', () => selectOption(opt));
  });

  nextQuestionBtn.disabled = true;
}

/**
 * Select quiz option
 */
function selectOption(element) {
  const index = element.dataset.index;
  const q = quizQuestions[quizCurrentIndex];

  // Simulate correct answer
  const isCorrect = Math.random() > 0.5;

  quizAnswers.push({
    questionIndex: quizCurrentIndex,
    selected: index,
    correct: isCorrect,
  });

  // Show feedback
  document.querySelectorAll('.option').forEach(opt => {
    opt.classList.remove('selected');
  });

  element.classList.add('selected');
  element.classList.add(isCorrect ? 'correct' : 'incorrect');

  nextQuestionBtn.disabled = false;
}

/**
 * Next quiz question
 */
function nextQuestion() {
  quizCurrentIndex++;
  displayQuestion();
}

/**
 * Display quiz results
 */
function displayQuizResults() {
  quizQuestion.classList.remove('active');
  quizResults.classList.add('active');

  const correct = quizAnswers.filter(a => a.correct).length;
  const total = quizQuestions.length;

  scoreValue.textContent = `${correct}/${total}`;

  resultsList.innerHTML = quizAnswers.map((answer, idx) => `
    <div class="result-item ${answer.correct ? 'correct' : 'incorrect'}">
      <strong>Q${idx + 1}:</strong> ${escapeHtml(quizQuestions[idx].question)}
      <div style="margin-top: 4px; font-size: 12px;">
        ${answer.correct ? '✓ Correct' : '✗ Incorrect'}
      </div>
    </div>
  `).join('');
}

/**
 * Retake quiz
 */
function retakeQuiz() {
  quizResults.classList.remove('active');
  quizStart.classList.add('active');
  quizQuestions = [];
  quizAnswers = [];
}

/**
 * Share study set
 */
async function shareStudySet() {
  if (!currentStudySet) {
    showNotification('No study set loaded', 'error');
    return;
  }

  const link = shareManager.generateShareLink(currentStudySet);
  const message = shareManager.generateShareMessage(currentStudySet);

  const result = await shareManager.copyToClipboard(link.url);

  if (result.success) {
    showNotification('Share link copied!');
  }
}

/**
 * Export study set
 */
async function exportStudySet() {
  if (!currentStudySet) {
    showNotification('No study set loaded', 'error');
    return;
  }

  const exported = await storage.exportStudySet(currentStudySet.id);
  if (exported) {
    const dataUrl = shareManager.createDownloadUrl(exported.data, exported.filename);
    shareManager.triggerDownload(dataUrl.url, dataUrl.filename);
    showNotification('Study set exported');
  }
}

/**
 * Extract page content
 */
async function extractPageContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getPageInfo'
      }, (response) => {
        if (response) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'captureContent'
          });
        }
      });
    }
  });
}

/**
 * Listen for extracted content from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractedContent') {
    handleExtractedContent(request);
    sendResponse({ received: true });
  }
});

/**
 * Handle extracted content
 */
async function handleExtractedContent(data) {
  const content = data.content;
  const title = data.title || 'Untitled';

  // Generate study materials
  const materials = aiGenerator.generateStudyMaterials(content, title);

  // Save to storage
  const set = await storage.saveStudySet({
    title: title,
    sourceUrl: data.url,
    content: content,
    ...materials
  });

  currentStudySet = set;
  currentCards = set.flashcards;
  currentCardIndex = 0;
  cardFlipped = false;

  setTitle.textContent = set.title;
  displayCard();
  displaySummary();
  switchTab('summary');

  showNotification('Study set created!');
}

/**
 * Show empty state
 */
function showEmptyState() {
  const container = document.getElementById('app');
  container.innerHTML = `
    <div style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: var(--secondary);">
      <div>
        <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
        <p>No study set loaded</p>
        <p style="font-size: 12px; margin-top: 8px;">Click the extract button or select a set from the popup</p>
      </div>
    </div>
  `;
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
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
 * Show notification
 */
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
}
