/**
 * FarmTrak 360 - Main Application JavaScript
 * Handles overall application state, navigation, and common functionality
 */

class FarmTrakApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = null;
        this.token = null;
        this.apiBaseUrl = 'http://localhost:5000/api';

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Load theme preference
        this.loadTheme();

        // Setup event listeners
        this.setupEventListeners();

        // Check authentication status
        await this.checkAuthStatus();

        // Initialize page content
        this.initPage();

        // Setup navigation
        this.setupNavigation();

        // Hide loading spinner
        this.hideLoadingSpinner();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // User menu toggle
        document.getElementById('userMenuToggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });

        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenuDropdown');
            if (userMenu && !userMenu.contains(e.target) && !document.getElementById('userMenuToggle').contains(e.target)) {
                userMenu.classList.remove('show');
            }
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // User menu actions
        document.querySelectorAll('.user-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                this.handleUserMenuAction(action);
            });
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    /**
     * Check authentication status
     */
    async checkAuthStatus() {
        const token = localStorage.getItem('farmtrak_token');
        const user = localStorage.getItem('farmtrak_user');

        if (token && user) {
            try {
                this.token = token;
                this.user = JSON.parse(user);

                // Verify token is still valid
                await this.verifyToken();

                // Update UI for authenticated user
                this.updateAuthUI();

            } catch (error) {
                console.error('Token verification failed:', error);
                this.logout();
            }
        } else {
            // Show login prompt or redirect to login
            this.showAuthRequired();
        }
    }

    /**
     * Verify JWT token with server
     */
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token verification failed');
            }

            const data = await response.json();
            this.user = data.user;

        } catch (error) {
            throw new Error('Token verification failed');
        }
    }

    /**
     * Update UI elements for authenticated user
     */
    updateAuthUI() {
        // Update user name and avatar
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) {
            userNameEl.textContent = this.user.full_name || this.user.email;
        }

        if (userAvatarEl) {
            if (this.user.avatar_url) {
                userAvatarEl.innerHTML = `<img src="${this.user.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                userAvatarEl.innerHTML = `<i class="fas fa-user"></i>`;
            }
        }

        // Show authenticated navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.style.display = 'flex';
        });
    }

    /**
     * Show authentication required message
     */
    showAuthRequired() {
        // For now, we'll show a demo mode or redirect to login
        // In a real app, you'd redirect to login page
        this.showToast('Please log in to access FarmTrak 360', 'warning');

        // Set demo user for development
        this.setDemoUser();
    }

    /**
     * Set demo user for development/testing
     */
    setDemoUser() {
        this.user = {
            id: 'demo-user-id',
            email: 'demo@farmtrak.com',
            full_name: 'Demo Farmer',
            farm_role: 'farmer'
        };

        this.token = 'demo-token';
        localStorage.setItem('farmtrak_user', JSON.stringify(this.user));
        localStorage.setItem('farmtrak_token', this.token);

        this.updateAuthUI();
    }

    /**
     * Initialize current page content
     */
    initPage() {
        // Initialize the current page based on URL or default to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || 'dashboard';

        this.navigateToPage(page);
    }

    /**
     * Setup navigation functionality
     */
    setupNavigation() {
        // Handle navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateToPage(e.state.page, false);
            }
        });
    }

    /**
     * Navigate to a specific page
     */
    navigateToPage(page, updateHistory = true) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
        });

        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            this.currentPage = page;

            // Update active navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === page) {
                    link.classList.add('active');
                }
            });

            // Update browser history
            if (updateHistory) {
                const url = page === 'dashboard' ? '/' : `/?page=${page}`;
                window.history.pushState({ page }, '', url);
            }

            // Load page-specific content
            this.loadPageContent(page);
        }
    }

    /**
     * Load content for specific page
     */
    async loadPageContent(page) {
        switch (page) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
                break;
            case 'farms':
                if (typeof loadFarms === 'function') {
                    loadFarms();
                }
                break;
            case 'livestock':
                if (typeof loadLivestock === 'function') {
                    loadLivestock();
                }
                break;
            case 'crops':
                if (typeof loadCrops === 'function') {
                    loadCrops();
                }
                break;
            case 'vets':
                if (typeof loadVets === 'function') {
                    loadVets();
                }
                break;
            case 'agrovets':
                if (typeof loadAgrovets === 'function') {
                    loadAgrovets();
                }
                break;
            case 'sharing':
                if (typeof loadSharing === 'function') {
                    loadSharing();
                }
                break;
            case 'contacts':
                if (typeof loadContacts === 'function') {
                    loadContacts();
                }
                break;
            case 'maps':
                if (typeof loadMaps === 'function') {
                    loadMaps();
                }
                break;
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        navLinks?.classList.toggle('show');
    }

    /**
     * Toggle user menu dropdown
     */
    toggleUserMenu() {
        const userMenu = document.getElementById('userMenuDropdown');
        userMenu?.classList.toggle('show');
    }

    /**
     * Handle user menu actions
     */
    handleUserMenuAction(action) {
        switch (action) {
            case 'profile':
                this.navigateToPage('profile');
                break;
            case 'settings':
                this.showToast('Settings page coming soon!', 'info');
                break;
            case 'help':
                this.showToast('Help & Support coming soon!', 'info');
                break;
            case 'logout':
                this.logout();
                break;
        }

        // Close user menu
        document.getElementById('userMenuDropdown')?.classList.remove('show');
    }

    /**
     * Logout user
     */
    logout() {
        // Clear stored data
        localStorage.removeItem('farmtrak_token');
        localStorage.removeItem('farmtrak_user');

        // Reset app state
        this.user = null;
        this.token = null;

        // Show logout message
        this.showToast('Logged out successfully', 'success');

        // Reset to demo user for development
        setTimeout(() => {
            this.setDemoUser();
        }, 1000);
    }

    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        const currentTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
            localStorage.setItem('farmtrak_theme', 'dark');
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
            localStorage.setItem('farmtrak_theme', 'light');
        }

        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
            themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    /**
     * Load theme from localStorage
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('farmtrak_theme') || 'light';
        this.setTheme(savedTheme);
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Close mobile menu on larger screens
        if (window.innerWidth >= 768) {
            const navLinks = document.getElementById('navLinks');
            navLinks?.classList.remove('show');
        }
    }

    /**
     * Show loading spinner
     */
    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    /**
     * Hide loading spinner
     */
    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');

        if (!toastContainer) {
            console.warn('Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to container
        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto hide
        const hideTimeout = setTimeout(() => {
            this.hideToast(toast);
        }, duration);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(hideTimeout);
            this.hideToast(toast);
        });
    }

    /**
     * Hide toast notification
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    /**
     * Make API request with authentication
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;

        } catch (error) {
            console.error('API request failed:', error);

            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.showToast('Session expired. Please log in again.', 'warning');
                this.logout();
            } else {
                this.showToast(error.message || 'An error occurred', 'error');
            }

            throw error;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Utility function to get element by ID with error handling
     */
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    }
}

// Global app instance
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new FarmTrakApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FarmTrakApp;
}
