/**
 * Theme Management JavaScript for FarmTrak 360
 * Handles dark/light mode toggle and persistence
 */

/**
 * Initialize theme system
 */
function initTheme() {
    // Apply saved theme on page load
    applySavedTheme();

    // Setup theme toggle event listeners
    setupThemeToggleListeners();

    // Listen for system theme changes
    listenForSystemThemeChanges();
}

/**
 * Apply saved theme from localStorage
 */
function applySavedTheme() {
    const savedTheme = localStorage.getItem('farmtrak_theme') || 'light';
    setTheme(savedTheme);
}

/**
 * Setup theme toggle button listeners
 */
function setupThemeToggleListeners() {
    const themeToggleBtns = document.querySelectorAll('.theme-toggle, #themeToggle');

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
}

/**
 * Toggle between dark and light themes
 */
function toggleTheme() {
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    // Add a subtle animation effect
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // Show theme change notification
    app.showToast(`Switched to ${newTheme} mode`, 'info');
}

/**
 * Set specific theme
 */
function setTheme(theme) {
    const body = document.body;
    const themeToggleBtns = document.querySelectorAll('.theme-toggle, #themeToggle');

    if (theme === 'dark') {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');

        // Update toggle button icons
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
        });
    } else {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');

        // Update toggle button icons
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-moon';
            }
        });
    }

    // Save theme preference
    localStorage.setItem('farmtrak_theme', theme);

    // Dispatch custom event for other components to listen to
    const themeChangeEvent = new CustomEvent('themeChanged', {
        detail: { theme }
    });
    document.dispatchEvent(themeChangeEvent);
}

/**
 * Get current theme
 */
function getCurrentTheme() {
    return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
}

/**
 * Listen for system theme changes (if user has no preference saved)
 */
function listenForSystemThemeChanges() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('farmtrak_theme');

    // Only listen to system changes if no preference is saved
    if (!savedTheme) {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

        // Set initial theme based on system preference
        if (prefersDarkScheme.matches) {
            setTheme('dark');
        }

        // Listen for system theme changes
        prefersDarkScheme.addEventListener('change', (e) => {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
}

/**
 * Apply theme to specific elements (for dynamic content)
 */
function applyThemeToElement(element) {
    const currentTheme = getCurrentTheme();

    if (currentTheme === 'dark') {
        element.classList.add('theme-dark');
        element.classList.remove('theme-light');
    } else {
        element.classList.add('theme-light');
        element.classList.remove('theme-dark');
    }
}

/**
 * Get theme-aware color value
 */
function getThemeColor(colorName) {
    const currentTheme = getCurrentTheme();
    const root = document.documentElement;

    // This would require CSS custom properties for theme colors
    // For now, return the color name as-is
    return `var(--${colorName})`;
}

/**
 * Animate theme transition
 */
function animateThemeTransition() {
    const body = document.body;

    body.style.transition = 'background-color 0.5s ease, color 0.5s ease';

    // Reset transition after animation
    setTimeout(() => {
        body.style.transition = '';
    }, 500);
}

// Initialize theme system when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTheme,
        toggleTheme,
        setTheme,
        getCurrentTheme,
        applyThemeToElement
    };
}
