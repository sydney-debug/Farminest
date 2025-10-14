/**
 * Authentication JavaScript for FarmTrak 360
 * Handles user authentication, login, and registration
 */

/**
 * Handle user login
 */
async function handleLogin(email, password) {
    try {
        const response = await fetch(`${app.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Login failed');
        }

        // Store authentication data
        localStorage.setItem('farmtrak_token', data.token);
        localStorage.setItem('farmtrak_user', JSON.stringify(data.user));

        // Update app state
        app.user = data.user;
        app.token = data.token;

        // Update UI
        app.updateAuthUI();

        app.showToast('Login successful!', 'success');

        return data;

    } catch (error) {
        console.error('Login error:', error);
        app.showToast(error.message || 'Login failed', 'error');
        throw error;
    }
}

/**
 * Handle user registration
 */
async function handleRegister(userData) {
    try {
        const response = await fetch(`${app.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Registration failed');
        }

        app.showToast('Registration successful! Please check your email for verification.', 'success');

        return data;

    } catch (error) {
        console.error('Registration error:', error);
        app.showToast(error.message || 'Registration failed', 'error');
        throw error;
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Clear stored data
    localStorage.removeItem('farmtrak_token');
    localStorage.removeItem('farmtrak_user');

    // Reset app state
    app.user = null;
    app.token = null;

    app.showToast('Logged out successfully', 'success');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!(app.token && app.user);
}

/**
 * Get current user
 */
function getCurrentUser() {
    return app.user;
}

/**
 * Get auth token
 */
function getAuthToken() {
    return app.token;
}

/**
 * Refresh user session
 */
async function refreshSession() {
    try {
        if (!app.token) {
            throw new Error('No token available');
        }

        const response = await fetch(`${app.apiBaseUrl}/auth/refresh`, {
            headers: {
                'Authorization': `Bearer ${app.token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Session refresh failed');
        }

        // Update token
        localStorage.setItem('farmtrak_token', data.token);
        app.token = data.token;

        return data;

    } catch (error) {
        console.error('Session refresh error:', error);
        throw error;
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        handleRegister,
        handleLogout,
        isAuthenticated,
        getCurrentUser,
        getAuthToken,
        refreshSession
    };
}
