// Stagewise Toolbar Initialization for Development
// This module initializes the stagewise toolbar for AI-powered editing capabilities

/**
 * Initialize stagewise toolbar for development mode
 * The toolbar will only be loaded when:
 * 1. Running in development mode (localhost or dev server)
 * 2. Not in production environment
 */
async function initStagewise() {
  // Check if we're in development mode
  const isDevelopment = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.port !== '' ||
    window.location.protocol === 'http:';

  // Only load stagewise in development
  if (!isDevelopment) {
    console.log('🚀 Stagewise: Skipping in production mode');
    return;
  }

  try {
    // For vanilla JS projects, we need to dynamically load the stagewise script
    // Check if stagewise is already loaded
    if (window.stagewise) {
      console.log('🎯 Stagewise already loaded');
      return;
    }

    // Create and load the stagewise script
    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import { initToolbar } from '/node_modules/@stagewise/toolbar/dist/index.js';
      
      try {
        initToolbar({
          plugins: []
        });
        console.log('🎯 Stagewise toolbar initialized successfully!');
        console.log('💡 You can now select elements and leave comments for AI editing');
        
        // Mark as loaded
        window.stagewise = { loaded: true };
      } catch (error) {
        console.warn('⚠️ Stagewise toolbar initialization failed:', error.message);
      }
    `;
    
    document.head.appendChild(script);
    
  } catch (error) {
    // Gracefully handle any errors
    console.warn('⚠️ Stagewise toolbar could not be loaded:', error.message);
    console.warn('💭 This is normal in production or if stagewise is not installed');
  }
}

// Initialize stagewise when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStagewise);
} else {
  initStagewise();
}

export { initStagewise }; 