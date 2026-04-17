import { GlobularCluster } from './canvas-renderer.js';
import { initializeAnimations } from './animations.js';
import { loadComponents } from './loader.js';

import { loadSelectedPublications } from './publications.js';
import { initPublicationsPage } from './publications-page.js';

// Initialize the entire application
async function initializeApp() {
    // Load nav and footer components first
    await loadComponents();

    // Load publications
    await loadSelectedPublications();

    // Initialize full publications page (if on publications page)
    await initPublicationsPage();

    // Initialize canvas renderer
    const clusterCanvas = document.getElementById('nebula-canvas');
    if (clusterCanvas) {
        new GlobularCluster(clusterCanvas);
    }

    // Initialize animations
    initializeAnimations();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
