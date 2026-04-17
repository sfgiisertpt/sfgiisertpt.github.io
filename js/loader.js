// Dynamic loader for nav and footer components
export async function loadComponents() {
    try {
        // Determine the correct path based on current location
        // For pages in /pages/ directory, go up one level
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const baseDir = isInPagesDir ? '../' : './';

        // Load navigation
        const navResponse = await fetch(`${baseDir}includes/nav.html`);
        if (navResponse.ok) {
            const navHTML = await navResponse.text();
            const navbar = document.getElementById('navbar');
            if (navbar) {
                navbar.innerHTML = navHTML;

                const homeLink = navbar.querySelector('.home-link');
                if (homeLink) {
                    homeLink.setAttribute('href', `${baseDir}index.html`);
                }

                const navLinks = navbar.querySelectorAll('.nav-links a');
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href.startsWith('#')) {
                        if (isInPagesDir) {
                            link.setAttribute('href', `${baseDir}index.html${href}`);
                        }
                    } else if (href.startsWith('./')) {
                        link.setAttribute('href', `${baseDir}${href.substring(2)}`);
                    }
                });
            }
        }

        // Load footer
        const footerResponse = await fetch(`${baseDir}includes/footer.html`);
        if (footerResponse.ok) {
            const footerHTML = await footerResponse.text();
            const footer = document.getElementById('footer');
            if (footer) {
                footer.innerHTML = footerHTML;
            }
        }

        // Re-attach event listeners after loading components
        reattachEventListeners();
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Reattach event listeners to newly loaded elements
function reattachEventListeners() {
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Mobile Menu Toggle
        const mobileMenuBtn = navbar.querySelector('.mobile-menu-btn');
        const navLinks = navbar.querySelector('.nav-links');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
            
            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }
    }
}
