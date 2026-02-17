# StudyBot Utilities Guide

Quick reference for new utility libraries added in the polish pass.

---

## ErrorBoundary - `extension/lib/error-boundary.js`

Centralized error handling and error UI generation.

### Usage

```javascript
// Wrap async operations
const result = await ErrorBoundary.wrapAsync(async () => {
  return await apiCall();
}, 'API Call');

// Show error UI with retry
ErrorBoundary.showErrorUI(container, error, async () => {
  await retryOperation();
});

// Show loading state
ErrorBoundary.showLoading(container, 'Generating flashcards...');

// Show empty state
ErrorBoundary.showEmptyState(container, '📚', 'No sets yet', 'Create your first study set', {
  label: 'Start',
  onClick: () => createSet()
});

// Safe HTML manipulation (prevents XSS)
ErrorBoundary.safeSetInnerHTML(element, htmlString);

// Safe DOM operations
ErrorBoundary.safeRemove(element);
if (ErrorBoundary.isElementValid(element)) {
  // element is safe to use
}
```

### Key Methods
- `wrapAsync(fn, context, onError)` — Wraps async functions
- `showErrorUI(container, error, onRetry)` — Shows error state
- `showLoading(container, message)` — Shows loading state
- `showEmptyState(container, icon, title, description, action)` — Shows empty state
- `escapeHtml(text)` — Safe HTML escaping
- `safeSetInnerHTML(element, html)` — Safe HTML setting
- `safeRemove(element)` — Safe element removal
- `addEventListener(element, event, handler)` — Safe event binding
- `isElementValid(element)` — Check element validity

---

## UIStateManager - `extension/lib/ui-state.js`

Manages UI states, loading indicators, and transitions.

### Usage

```javascript
// Set button loading state
const button = document.getElementById('generateBtn');
uiStateManager.setButtonLoading(button, true);
// ... async operation ...
uiStateManager.resetButton(button);

// Enable/disable button groups
uiStateManager.setButtonGroupEnabled('.form-buttons', false); // Disable all
uiStateManager.setButtonGroupEnabled('.form-buttons', true);  // Enable all

// Smooth transitions
await uiStateManager.transition(element, 'hidden', 'visible', 300);

// Show/hide with fade
uiStateManager.setVisible(element, true);  // Show with fade-in
uiStateManager.setVisible(element, false); // Hide with fade-out

// Class management
uiStateManager.addClass(element, 'loading');
uiStateManager.removeClass(element, 'loading');
uiStateManager.toggleClass(element, 'loading');

// Utility functions
uiStateManager.debounce(fn, 300);  // Debounce with 300ms delay
uiStateManager.throttle(fn, 300);  // Throttle with 300ms delay

// Focus management
uiStateManager.focusElement(input);

// Scroll management
uiStateManager.scrollIntoView(element);
if (uiStateManager.isInViewport(element)) {
  // Element is visible in viewport
}
```

### Key Methods
- `setButtonLoading(button, isLoading)` — Shows loading state on button
- `resetButton(button)` — Resets button to normal state
- `setButtonGroupEnabled(selector, enabled)` — Enable/disable buttons
- `transition(element, from, to, duration)` — Smooth transition
- `setVisible(element, visible, duration)` — Fade show/hide
- `addClass/removeClass/toggleClass(element, className)` — Class management
- `debounce(fn, delay)` — Debounce function
- `throttle(fn, delay)` — Throttle function
- `focusElement(element)` — Safely focus element
- `scrollIntoView(element)` — Smooth scroll into view
- `isInViewport(element)` — Check if element visible

---

## CacheManager - `extension/lib/cache-manager.js`

In-memory and persistent caching with TTL support.

### Usage

```javascript
// Get or fetch with cache
const courses = await cacheManager.getOrFetch(
  'courses_list',
  () => fetchCoursesFromAPI(),
  24 * 60 * 60 * 1000 // 24 hour TTL
);

// Direct get/set
cacheManager.set('key', data, ttlMs);
const data = cacheManager.get('key');
if (data === null) {
  // Not in cache or expired
}

// Delete specific item
cacheManager.delete('key');

// Clear all cache
cacheManager.clear();

// Cache API responses
cacheManager.cacheAPIResponse('endpoint', response, 1 * 60 * 60 * 1000);
const cached = cacheManager.getCachedAPI('endpoint');

// Cache generated content
const hash = CacheManager.hashContent(content);
cacheManager.cacheGenerated(hash, generatedData);
const cached = cacheManager.getCachedGenerated(hash);

// Get cache statistics
const stats = cacheManager.getStats();
console.log(`Using ${stats.percentageUsed}% of ${stats.maxSizeMB}MB`);

// Cleanup and evict
const expired = cacheManager.cleanupExpired();
cacheManager.evictOldest(); // LRU eviction
```

### Key Methods
- `get(key)` — Get from cache
- `set(key, data, ttlMs)` — Set with expiration
- `delete(key)` — Delete item
- `clear()` — Clear all
- `getOrFetch(key, fetchFn, ttlMs)` — Get or fetch with cache
- `cacheAPIResponse(endpoint, response, ttlMs)` — Cache API response
- `getCachedAPI(endpoint)` — Get cached API response
- `cacheGenerated(hash, data, ttlMs)` — Cache generated content
- `getCachedGenerated(hash)` — Get cached generated content
- `getStats()` — Get cache statistics
- `cleanupExpired()` — Remove expired items
- `evictOldest()` — LRU eviction

### Features
- ✅ Auto-expiration via TTL
- ✅ Offline fallback (returns stale cache on fetch fail)
- ✅ Persistent storage (chrome.storage.local)
- ✅ Size limit with LRU eviction
- ✅ Content hashing for deduplication

---

## DebouncerManager - `extension/lib/debouncer.js`

Debounce and throttle utilities to reduce API calls.

### Usage

```javascript
// Debounce - Waits for 300ms without new calls
const debouncedSearch = debouncerManager.debounce((query) => {
  apiSearch(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// Debounce async
const debouncedFetch = debouncerManager.debounceAsync(async (query) => {
  return await apiSearch(query);
}, 300);

const results = await debouncedFetch(query);

// Throttle - Executes at most once per 300ms
const throttledResize = debouncerManager.throttle(() => {
  updateLayout();
}, 300);

window.addEventListener('resize', throttledResize);

// Throttle async
const throttledSave = debouncerManager.throttleAsync(async (data) => {
  await save(data);
}, 1000);

await throttledSave(formData);

// Rate limiting - Max 5 calls per 1 second
const rateLimited = debouncerManager.rateLimit((query) => {
  apiSearch(query);
}, 5, 1000);

// Leading debounce - Execute immediately, then debounce
const leadingDebounce = debouncerManager.debounceLeading(() => {
  click();
}, 300);

button.addEventListener('click', leadingDebounce);

// Search helper
const search = debouncerManager.createSearchDebouncer((query) => {
  return apiSearch(query);
}, 300);

const results = await search('term');

// Form validator
const validate = debouncerManager.createFormValidator((formData) => {
  return validateForm(formData);
}, 500);

const errors = await validate(formData);

// Cancel operations
debouncerManager.cancel('functionName');
debouncerManager.cancelAll();

// Check status
const pending = debouncerManager.getPendingCount();
if (debouncerManager.isPending('functionName')) {
  // Operation pending
}
```

### Key Methods
- `debounce(fn, delay)` — Debounce with delay
- `debounceAsync(fn, delay)` — Debounce async function
- `throttle(fn, delay)` — Throttle with delay
- `throttleAsync(fn, delay)` — Throttle async function
- `rateLimit(fn, maxCalls, timeWindow)` — Rate limiting
- `debounceLeading(fn, delay)` — Execute immediately
- `createSearchDebouncer(fn, delay)` — Search helper
- `createFormValidator(fn, delay)` — Form validator
- `cancel(fnName)` — Cancel pending operation
- `cancelAll()` — Cancel all pending
- `getPendingCount()` — Count pending operations
- `isPending(fnName)` — Check if operation pending

### Use Cases
- Search input: `debounce` (wait for user to finish typing)
- Form validation: `debounce` (validate after user stops typing)
- Window resize: `throttle` (update layout at most N times)
- Auto-save: `throttle` (save at most N times per second)
- API calls: `rateLimit` (max X calls per Y milliseconds)
- Clicks: `debounceLeading` (execute immediately, ignore rapid clicks)

---

## NotificationManager - `extension/lib/notifications.js` (Existing)

Already implemented, used for all user feedback.

```javascript
// Show notification
notificationManager.success('Study set saved!');
notificationManager.error('Failed to save');
notificationManager.info('Loading...');
notificationManager.warning('Unsaved changes');

// Custom duration
notificationManager.show('Message', 'info', 5000); // 5 seconds
```

---

## ErrorHandler - `extension/lib/error-handler.js` (Existing)

Centralized error logging and retry logic.

```javascript
// Log error
ErrorHandler.logError('Context', error, true); // Notify user

// Retry with exponential backoff
try {
  await ErrorHandler.retryAsync(
    () => apiCall(),
    'API Call',
    3, // max retries
    1000 // base delay (ms)
  );
} catch (error) {
  // Failed after 3 retries
}

// Validate response
const response = ErrorHandler.validateResponse(data, 'API');

// Safe JSON parse
const data = ErrorHandler.safeJsonParse(jsonString);

// Chrome storage get/set
const data = await ErrorHandler.chromeStorageGet('key');
await ErrorHandler.chromeStorageSet({ key: value });

// Chrome message sending
const response = await ErrorHandler.chromeTabsSendMessage(tabId, message);

// Field validation
ErrorHandler.validateRequired(obj, ['field1', 'field2']);
ErrorHandler.validateTypes(obj, { field1: 'string', field2: 'number' });
```

---

## Integration Example

Complete example using all utilities together:

```javascript
// In sidepanel.js when generating study materials
async function generateStudyMaterials(content) {
  const button = document.getElementById('generateBtn');
  const container = document.getElementById('results');

  try {
    // Show loading state
    uiStateManager.setButtonLoading(button, true);
    ErrorBoundary.showLoading(container, 'Analyzing content...');

    // Check cache first
    const hash = CacheManager.hashContent(content);
    let materials = cacheManager.getCachedGenerated(hash);

    if (!materials) {
      // Debounce API calls
      const debouncedGenerate = debouncerManager.debounceAsync(
        () => aiGenerator.generateStudyMaterials(content),
        300
      );

      // With retry logic
      materials = await ErrorHandler.retryAsync(
        () => debouncedGenerate(),
        'Generate Materials',
        3
      );

      // Cache for offline
      cacheManager.cacheGenerated(hash, materials, 7 * 24 * 60 * 60 * 1000);
    }

    // Display results
    uiStateManager.resetButton(button);
    displayMaterials(container, materials);
    notificationManager.success('Materials generated!');

  } catch (error) {
    // Error handling with retry
    ErrorBoundary.showErrorUI(container, error, async () => {
      await generateStudyMaterials(content); // Retry
    });
    
    uiStateManager.resetButton(button);
    console.error('Generation failed:', error);
  }
}
```

---

## CSS Classes for Loading States

Use these pre-defined CSS classes:

```css
.spinner                /* Animated loading spinner */
.loading-indicator      /* Loading message with spinner */
.skeleton              /* Shimmer animation for skeleton */
.skeleton-card         /* Full card skeleton */
.error-message         /* Error message styling */
.success-message       /* Success message styling */
.info-message          /* Info message styling */
.transition-fade       /* Smooth fade transition */
.transition-slide      /* Smooth slide transition */
.fade-in               /* Fade in animation */
.slide-in              /* Slide in animation */
.loading-overlay       /* Full-screen loading overlay */
.loading-spinner       /* Loading spinner component */
```

---

## Best Practices

1. **Always debounce** search inputs and frequent API calls
2. **Cache API responses** with appropriate TTLs
3. **Use ErrorBoundary** for user-facing errors
4. **Set button loading** to provide UI feedback
5. **Use transitions** for smooth state changes
6. **Check cache first** before making API calls
7. **Handle offline** with cache fallbacks
8. **Validate inputs** before API calls
9. **Retry failed** API calls with exponential backoff
10. **Log errors** for debugging but don't expose to users

---

## Performance Impact

- **ErrorBoundary** — Negligible (<1KB)
- **UIStateManager** — Negligible (<1KB)
- **CacheManager** — ~5KB memory per 1MB cached data
- **DebouncerManager** — <1KB (tracks timers in memory)
- **Combined** — Well within limits, significant perf benefit

---

## Troubleshooting

### Debounce not working?
- Check that you're calling the debounced function, not the original
- Verify the delay is appropriate (300ms typical)

### Cache not persisting?
- Check `chrome.storage.local` is available
- Verify TTL hasn't expired
- Call `cacheManager.save()` after `set()`

### Error UI not showing?
- Ensure container element exists
- Check that error is an Error instance
- Verify CSS is loaded

### Loading state stuck?
- Call `resetButton()` or `setVisible()` in finally block
- Use try-finally pattern

---

## Questions?

Refer to function JSDoc blocks in each utility file for detailed documentation.
