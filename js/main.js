import { GlobularCluster } from './canvas-renderer.js';
import { initializeAnimations } from './animations.js';
import { loadComponents } from './loader.js';

// Initialize the entire application
async function initializeApp() {
    // Load nav and footer components first
    await loadComponents();

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
