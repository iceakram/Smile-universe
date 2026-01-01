/**
 * Smile Universe - Main Module
 * Core functionality and initialization
 * 
 * Features:
 * - Page load handling
 * - Theme switching
 * - Image lazy loading
 * - Share functionality
 * - Accessibility support
 */

'use strict';

const SmileUniverse = (function() {
  // Configuration
  const CONFIG = {
    loaderMinTime: 1500,
    scrollLockDuration: 2000
  };

  // State
  let state = {
    isLoading: true,
    theme: 'dark'
  };

  // DOM Elements cache
  let elements = {};

  /**
   * Initialize the application
   */
  function init() {
    cacheElements();
    initLoader();
    initTheme();
    initImageLoading();
    initClickEffects();
    initShareButton();
    initKeyboardNavigation();
    
    // Initialize animations module
    if (window.SmileAnimations) {
      window.SmileAnimations.init();
    }
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    elements = {
      html: document.documentElement,
      body: document.body,
      loader: document.getElementById('loader'),
      main: document.getElementById('main'),
      heroImage: document.getElementById('heroImage'),
      themeToggle: document.getElementById('themeToggle'),
      shareButton: document.getElementById('shareButton'),
      artworkFrame: document.querySelector('.artwork__frame'),
      artworkContainer: document.querySelector('.artwork__container')
    };
  }

  /**
   * Handle page loading sequence
   */
  function initLoader() {
    // Lock scroll during intro
    elements.html.classList.add('is-loading');

    // Wait for minimum loader time and page load
    const loaderPromise = new Promise(resolve => 
      setTimeout(resolve, CONFIG.loaderMinTime)
    );
    
    const pageLoadPromise = new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

    Promise.all([loaderPromise, pageLoadPromise]).then(() => {
      hideLoader();
    });
  }

  /**
   * Hide the loader and unlock scroll
   */
  function hideLoader() {
    if (elements.loader) {
      elements.loader.classList.add('is-hidden');
    }
    
    // Unlock scroll after animations start
    setTimeout(() => {
      elements.html.classList.remove('is-loading');
      state.isLoading = false;
    }, CONFIG.scrollLockDuration);
  }

  /**
   * Initialize theme handling
   */
  function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('smile-universe-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    state.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(state.theme);

    // Theme toggle button
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('smile-universe-theme')) {
        state.theme = e.matches ? 'dark' : 'light';
        applyTheme(state.theme);
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('smile-universe-theme', state.theme);
  }

  /**
   * Apply the specified theme
   */
  function applyTheme(theme) {
    elements.html.setAttribute('data-theme', theme);
  }

  /**
   * Initialize lazy loading for hero image
   */
  function initImageLoading() {
    if (!elements.heroImage) return;

    // Check if image is already loaded (cached)
    if (elements.heroImage.complete && elements.heroImage.naturalHeight !== 0) {
      handleImageLoad();
      return;
    }

    // Listen for image load
    elements.heroImage.addEventListener('load', handleImageLoad);
    elements.heroImage.addEventListener('error', handleImageError);
  }

  /**
   * Handle successful image load
   */
  function handleImageLoad() {
    if (elements.heroImage) {
      // Add loaded class with slight delay for animation sync
      setTimeout(() => {
        elements.heroImage.classList.add('is-loaded');
      }, 800);
    }
  }

  /**
   * Handle image load error
   */
  function handleImageError() {
    console.warn('Hero image failed to load. Using fallback.');
    // The picture element will automatically try the fallback JPG
    // Add loaded class anyway to show whatever is available
    if (elements.heroImage) {
      elements.heroImage.classList.add('is-loaded');
    }
  }

  /**
   * Initialize click effects on artwork
   */
  function initClickEffects() {
    if (!elements.artworkContainer) return;

    elements.artworkContainer.addEventListener('click', (e) => {
      const rect = elements.artworkContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (window.SmileAnimations) {
        window.SmileAnimations.createRipple(x, y);
      }
    });
  }

  /**
   * Initialize share button functionality
   */
  function initShareButton() {
    if (!elements.shareButton) return;

    elements.shareButton.addEventListener('click', async () => {
      const url = window.location.href;
      const title = 'Smile Universe';
      const text = 'A digital art installation celebrating the beauty of a smile.';

      // Try native share API first
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (err) {
          // User cancelled or share failed, fall through to clipboard
          if (err.name !== 'AbortError') {
            console.warn('Share failed:', err);
          }
        }
      }

      // Fallback to clipboard
      copyToClipboard(url);
    });
  }

  /**
   * Copy text to clipboard and show toast
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy link');
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  /**
   * Initialize keyboard navigation support
   */
  function initKeyboardNavigation() {
    // Handle Enter key on interactive elements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement) {
        // Theme toggle
        if (document.activeElement === elements.themeToggle) {
          toggleTheme();
        }
        // Share button
        if (document.activeElement === elements.shareButton) {
          elements.shareButton.click();
        }
      }

      // Escape key to close any open dialogs/toasts
      if (e.key === 'Escape') {
        const toast = document.querySelector('.toast.is-visible');
        if (toast) {
          toast.classList.remove('is-visible');
          setTimeout(() => toast.remove(), 300);
        }
      }
    });
  }

  /**
   * Public API
   */
  return {
    init,
    toggleTheme,
    showToast,
    getState: () => ({ ...state })
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', SmileUniverse.init);
} else {
  SmileUniverse.init();
}

// Export for external access if needed
window.SmileUniverse = SmileUniverse;
