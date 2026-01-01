/**
 * Smile Universe - Animations Module
 * Handles all animation-related functionality
 * 
 * Uses:
 * - Intersection Observer for scroll-based animations
 * - CSS animations for performance
 * - RequestAnimationFrame for smooth updates
 */

'use strict';

const SmileAnimations = (function() {
  // Configuration
  const CONFIG = {
    parallaxStrength: 0.03,
    cursorLerpFactor: 0.15,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // State
  let state = {
    mouseX: 0,
    mouseY: 0,
    cursorX: 0,
    cursorY: 0,
    isHoveringArtwork: false,
    rafId: null
  };

  // DOM Elements cache
  let elements = {};

  /**
   * Initialize all animations
   */
  function init() {
    cacheElements();
    
    if (CONFIG.reducedMotion) {
      // Skip most animations for reduced motion preference
      handleReducedMotion();
      return;
    }

    initCursor();
    initParallax();
    initIntersectionObserver();
    initScrollEffects();
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    elements = {
      cursor: document.getElementById('cursor'),
      cursorDot: document.querySelector('.cursor__dot'),
      cursorRing: document.querySelector('.cursor__ring'),
      artwork: document.getElementById('artwork'),
      artworkFrame: document.querySelector('.artwork__frame'),
      heroImage: document.getElementById('heroImage'),
      aboutContent: document.querySelector('.about__content'),
      scrollIndicator: document.getElementById('scrollIndicator')
    };
  }

  /**
   * Handle reduced motion preferences
   */
  function handleReducedMotion() {
    // Hide cursor elements
    if (elements.cursor) {
      elements.cursor.style.display = 'none';
    }
    
    // Mark image as loaded immediately
    if (elements.heroImage) {
      elements.heroImage.classList.add('is-loaded');
    }
    
    // Show about content immediately
    if (elements.aboutContent) {
      elements.aboutContent.classList.add('is-visible');
    }
  }

  /**
   * Initialize custom cursor
   */
  function initCursor() {
    if (!elements.cursor) return;

    // Track mouse position
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Handle cursor interactions
    document.addEventListener('mousedown', () => elements.cursor.classList.add('is-clicking'));
    document.addEventListener('mouseup', () => elements.cursor.classList.remove('is-clicking'));
    
    // Track hover on interactive elements
    const hoverTargets = document.querySelectorAll('button, a, .artwork__frame');
    hoverTargets.forEach(target => {
      target.addEventListener('mouseenter', () => elements.cursor.classList.add('is-hovering'));
      target.addEventListener('mouseleave', () => elements.cursor.classList.remove('is-hovering'));
    });

    // Start cursor animation loop
    animateCursor();
  }

  /**
   * Handle mouse movement
   */
  function handleMouseMove(e) {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  }

  /**
   * Animate cursor with smooth interpolation
   */
  function animateCursor() {
    // Linear interpolation for smooth following
    state.cursorX += (state.mouseX - state.cursorX) * CONFIG.cursorLerpFactor;
    state.cursorY += (state.mouseY - state.cursorY) * CONFIG.cursorLerpFactor;

    if (elements.cursor) {
      elements.cursor.style.transform = `translate(${state.cursorX}px, ${state.cursorY}px)`;
    }

    state.rafId = requestAnimationFrame(animateCursor);
  }

  /**
   * Initialize parallax effect on artwork
   */
  function initParallax() {
    if (!elements.artworkFrame) return;

    elements.artworkFrame.addEventListener('mousemove', handleParallax, { passive: true });
    elements.artworkFrame.addEventListener('mouseleave', resetParallax);
    elements.artworkFrame.addEventListener('mouseenter', () => {
      state.isHoveringArtwork = true;
    });
  }

  /**
   * Handle parallax movement
   */
  function handleParallax(e) {
    const rect = elements.artworkFrame.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * CONFIG.parallaxStrength;
    const deltaY = (e.clientY - centerY) * CONFIG.parallaxStrength;

    // Apply transform with GPU acceleration
    elements.artworkFrame.style.transform = `
      perspective(1000px)
      rotateY(${deltaX}deg)
      rotateX(${-deltaY}deg)
      scale(1.02)
    `;
  }

  /**
   * Reset parallax to original position
   */
  function resetParallax() {
    state.isHoveringArtwork = false;
    if (elements.artworkFrame) {
      elements.artworkFrame.style.transform = '';
    }
  }

  /**
   * Initialize Intersection Observer for scroll animations
   */
  function initIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optionally unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements that should animate on scroll
    const animatedElements = document.querySelectorAll('.about__content');
    animatedElements.forEach(el => observer.observe(el));
  }

  /**
   * Initialize scroll-based effects
   */
  function initScrollEffects() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Handle scroll events
   */
  function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Fade out scroll indicator
    if (elements.scrollIndicator) {
      const opacity = Math.max(0, 1 - (scrollY / (windowHeight * 0.3)));
      elements.scrollIndicator.style.opacity = opacity;
    }
  }

  /**
   * Trigger click ripple effect on artwork
   */
  function createRipple(x, y) {
    const container = document.querySelector('.artwork__container');
    if (!container) return;

    const ripple = document.createElement('div');
    ripple.className = 'artwork__ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    container.appendChild(ripple);
    
    // Remove ripple after animation
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  /**
   * Public API
   */
  return {
    init,
    createRipple,
    getConfig: () => ({ ...CONFIG }),
    isReducedMotion: () => CONFIG.reducedMotion
  };
})();

// Export for use in main.js
window.SmileAnimations = SmileAnimations;
