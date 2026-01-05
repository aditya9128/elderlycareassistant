// main.js - Universal Navigation Handler for ElderlyCare Assistant

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 Main application initializing...');
    
    // Configuration for page redirects
    const PAGE_REDIRECTS = {
        // Health Tip Categories
        'nutrition.html': [
            '.fa-apple-alt', // Nutrition icon
            'a[href="./nutrition.html"]',
            '[data-redirect="nutrition"]'
        ],
        'sleep.html': [
            '.fa-bed', // Sleep icon
            'a[href="./sleep.html"]',
            '[data-redirect="sleep"]'
        ],
        'fitness.html': [
            '.fa-running', // Fitness icon
            'a[href="./fitness.html"]',
            '[data-redirect="fitness"]'
        ],
        'mentalhealth.html': [
            '.fa-brain', // Mental health icon
            'a[href="./mentalhealth.html"]',
            '[data-redirect="mentalhealth"]'
        ],
        
        // Service Cards
        'find-caregivers.html': [
            '.fa-hands-helping', // Find caregiver icon
            'a[href="./find-caregivers.html"]',
            '[data-redirect="find-caregiver"]',
            '.view-profile-btn' // View profile buttons
        ],
        'reminders.html': [
            '.fa-pills', // Medical reminders icon
            'a[href="./reminders.html"]',
            '[data-redirect="reminders"]'
        ],
        'bookings.html': [
            '.fa-calendar-check', // Book appointments icon
            'a[href="./bookings.html"]',
            '[data-redirect="bookings"]'
        ],
        
        // Authentication Pages
        'login.html': [
            '.fa-sign-in-alt', // Login icon
            'a[href="login.html"]',
            '[data-redirect="login"]',
            'button[onclick*="login.html"]'
        ],
        'signup.html': [
            '.fa-user-plus', // Signup icon
            'a[href="signup.html"]',
            '[data-redirect="signup"]',
            'button[onclick*="signup.html"]'
        ],
        'caregiver-login.html': [
            '.fa-user-nurse', // Caregiver login icon
            'a[href="caregiver-login.html"]',
            '[data-redirect="caregiver-login"]'
        ],
        
        // Special Pages
        'dashboard.html': [
            '[data-redirect="dashboard"]',
            'button[onclick*="dashboard.html"]'
        ]
    };
    
    // Initialize all redirect handlers
    initializeRedirectHandlers();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    console.log('✅ Main application initialized');
});

// Initialize all redirect handlers based on configuration
function initializeRedirectHandlers() {
    const PAGE_REDIRECTS = {
        'nutrition.html': ['.fa-apple-alt', 'a[href="./nutrition.html"]', '[data-redirect="nutrition"]'],
        'sleep.html': ['.fa-bed', 'a[href="./sleep.html"]', '[data-redirect="sleep"]'],
        'fitness.html': ['.fa-running', 'a[href="./fitness.html"]', '[data-redirect="fitness"]'],
        'mentalhealth.html': ['.fa-brain', 'a[href="./mentalhealth.html"]', '[data-redirect="mentalhealth"]'],
        'find-caregivers.html': ['.fa-hands-helping', 'a[href="./find-caregivers.html"]', '[data-redirect="find-caregiver"]', '.view-profile-btn'],
        'reminders.html': ['.fa-pills', 'a[href="./reminders.html"]', '[data-redirect="reminders"]'],
        'bookings.html': ['.fa-calendar-check', 'a[href="./bookings.html"]', '[data-redirect="bookings"]'],
        'login.html': ['.fa-sign-in-alt', 'a[href="login.html"]', '[data-redirect="login"]', 'button[onclick*="login.html"]'],
        'signup.html': ['.fa-user-plus', 'a[href="signup.html"]', '[data-redirect="signup"]', 'button[onclick*="signup.html"]'],
        'caregiver-login.html': ['.fa-user-nurse', 'a[href="caregiver-login.html"]', '[data-redirect="caregiver-login"]'],
        'dashboard.html': ['[data-redirect="dashboard"]', 'button[onclick*="dashboard.html"]']
    };
    
    // Set up redirects for each page
    for (const [page, selectors] of Object.entries(PAGE_REDIRECTS)) {
        setupPageRedirect(page, selectors);
    }
    
    // Special case: Hospital section link (stays on same page)
    document.querySelectorAll('a[href="#hospitals"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const hospitalsSection = document.getElementById('hospitals');
            if (hospitalsSection) {
                hospitalsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Setup redirect for a specific page
function setupPageRedirect(pageUrl, selectors) {
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            // Remove any existing inline onclick handlers
            if (element.hasAttribute('onclick')) {
                element.removeAttribute('onclick');
            }
            
            // Add event listener
            element.addEventListener('click', function(e) {
                e.preventDefault();
                console.log(`🔗 Redirecting to: ${pageUrl}`);
                
                // Check if we need to pass any data
                const redirectData = {
                    timestamp: new Date().toISOString(),
                    source: window.location.pathname
                };
                
                // Store any specific data from the element
                if (element.hasAttribute('data-specialization')) {
                    redirectData.specialization = element.getAttribute('data-specialization');
                }
                
                if (element.hasAttribute('data-caregiver-id')) {
                    redirectData.caregiverId = element.getAttribute('data-caregiver-id');
                }
                
                // Store in session storage for next page
                sessionStorage.setItem('redirectData', JSON.stringify(redirectData));
                
                // Redirect to page
                window.location.href = pageUrl;
            });
        });
    });
}

// Initialize mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-button');
    const navLinks = document.getElementById('nav-links');
    
    if (!mobileMenuBtn || !navLinks) return;
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('hidden');
        navLinks.classList.toggle('flex');
        navLinks.classList.toggle('flex-col');
        navLinks.classList.toggle('absolute');
        navLinks.classList.toggle('top-full');
        navLinks.classList.toggle('left-0');
        navLinks.classList.toggle('right-0');
        navLinks.classList.toggle('bg-gradient-to-r');
        navLinks.classList.toggle('from-primary-600');
        navLinks.classList.toggle('to-primary-800');
        navLinks.classList.toggle('py-4');
        navLinks.classList.toggle('px-4');
        navLinks.classList.toggle('space-y-4');
        navLinks.classList.toggle('z-40');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navLinks.classList.contains('hidden') && 
            !navLinks.contains(event.target) && 
            !mobileMenuBtn.contains(event.target)) {
            hideMobileMenu(navLinks);
        }
    });
    
    // Close mobile menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => hideMobileMenu(navLinks));
    });
}

// Hide mobile menu
function hideMobileMenu(navLinks) {
    navLinks.classList.add('hidden');
    navLinks.classList.remove('flex', 'flex-col', 'absolute', 'top-full', 
        'left-0', 'right-0', 'bg-gradient-to-r', 'from-primary-600', 
        'to-primary-800', 'py-4', 'px-4', 'space-y-4', 'z-40');
}

// Initialize smooth scrolling for navigation
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#" or external link or file link
            if (href === '#' || href.startsWith('http') || href.includes('.html')) {
                return;
            }
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                updateActiveNavLink(href);
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLinkOnScroll);
}

// Update active navigation link
function updateActiveNavLink(href) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'bg-white/20');
        if (link.getAttribute('href') === href) {
            link.classList.add('active', 'bg-white/20');
        }
    });
}

// Update active nav link based on scroll position
function updateActiveNavLinkOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionBottom = sectionTop + sectionHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentSectionId = '#' + section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active', 'bg-white/20');
        if (link.getAttribute('href') === currentSectionId) {
            link.classList.add('active', 'bg-white/20');
        }
    });
}

// Utility function to add redirect to any element
function addRedirectToElement(elementSelector, pageUrl, data = {}) {
    document.querySelectorAll(elementSelector).forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Store any data
            if (Object.keys(data).length > 0) {
                sessionStorage.setItem('pageData', JSON.stringify(data));
            }
            
            // Redirect
            window.location.href = pageUrl;
        });
    });
}

// Get data from previous page (call this on destination page)
function getRedirectData() {
    const data = sessionStorage.getItem('redirectData');
    if (data) {
        const parsed = JSON.parse(data);
        sessionStorage.removeItem('redirectData'); // Clear after reading
        return parsed;
    }
    return null;
}

// Global function to easily set up new redirects
window.setupRedirect = function(elementSelector, pageUrl, data = {}) {
    addRedirectToElement(elementSelector, pageUrl, data);
};

// Global function to get page data
window.getPageData = getRedirectData;

console.log('✅ main.js loaded - Ready to handle all navigation');