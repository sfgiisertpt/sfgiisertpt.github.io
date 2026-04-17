import { initializeTeamModals } from './team-modal.js';

// Scroll animations for cards
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.research-card, .team-card, .publication-item, .research-teaser-card, .research-highlight-card').forEach(el => {
        observer.observe(el);
    });
}

// Navbar scroll effect
function setupNavbarScrollEffect() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Smooth scroll for nav links
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Initialize all animations
export function initializeAnimations() {
    setupScrollAnimations();
    setupNavbarScrollEffect();
    setupSmoothScroll();

    // Initialize dynamic sections when they are present
    if (document.querySelector('.team-member-grid[data-team-file]') || document.getElementById('pi-profile')) {
        initializeTeamModals();
    }
}

