/**
 * Dashboard JavaScript for FarmTrak 360
 * Handles dashboard functionality, stats, and charts
 */

let dashboardCharts = {};

/**
 * Load dashboard content
 */
async function loadDashboard() {
    try {
        // Load dashboard statistics
        await loadDashboardStats();

        // Load recent activities
        await loadRecentActivities();

        // Initialize charts
        initializeCharts();

        // Load sample data for demo
        loadSampleDashboardData();

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        app.showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Load dashboard statistics from API
 */
async function loadDashboardStats() {
    try {
        // In a real app, these would be API calls
        // For now, we'll use mock data

        // Get farms count
        const farmsResponse = await app.apiRequest('/farms');
        const farmsCount = farmsResponse.count || 0;

        // Get livestock count
        const livestockResponse = await app.apiRequest('/livestock');
        const livestockCount = livestockResponse.count || 0;

        // Get crops count
        const cropsResponse = await app.apiRequest('/crops');
        const cropsCount = cropsResponse.count || 0;

        // Update stats cards
        updateStatsCards(farmsCount, livestockCount, cropsCount);

    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // Use mock data as fallback
        updateStatsCards(2, 15, 8);
    }
}

/**
 * Update statistics cards
 */
function updateStatsCards(farmsCount, livestockCount, cropsCount) {
    const farmsEl = app.getElement('totalFarms');
    const livestockEl = app.getElement('totalLivestock');
    const cropsEl = app.getElement('totalCrops');

    if (farmsEl) farmsEl.textContent = farmsCount;
    if (livestockEl) livestockEl.textContent = livestockCount;
    if (cropsEl) cropsEl.textContent = cropsCount;

    // Add animation effect
    animateNumber(farmsEl, farmsCount);
    animateNumber(livestockEl, livestockCount);
    animateNumber(cropsEl, cropsCount);
}

/**
 * Animate number counting
 */
function animateNumber(element, target, duration = 1000) {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Load recent activities
 */
async function loadRecentActivities() {
    try {
        // In a real app, this would fetch from API
        // For demo, we'll create sample activities
        const activities = [
            {
                icon: 'fas fa-plus',
                message: 'Added new livestock: GV-003 Jersey Cow',
                time: '2 hours ago'
            },
            {
                icon: 'fas fa-seedling',
                message: 'Planted 5 hectares of maize',
                time: '1 day ago'
            },
            {
                icon: 'fas fa-user-md',
                message: 'Scheduled vet visit for cattle health check',
                time: '2 days ago'
            },
            {
                icon: 'fas fa-shopping-cart',
                message: 'Purchased fertilizer from AgroVet Ltd',
                time: '3 days ago'
            },
            {
                icon: 'fas fa-chart-line',
                message: 'Crop yield increased by 15% this month',
                time: '1 week ago'
            }
        ];

        displayActivities(activities);

    } catch (error) {
        console.error('Failed to load recent activities:', error);
        app.showToast('Failed to load recent activities', 'error');
    }
}

/**
 * Display activities in the UI
 */
function displayActivities(activities) {
    const activitiesList = app.getElement('recentActivities');
    if (!activitiesList) return;

    activitiesList.innerHTML = '';

    activities.forEach(activity => {
        const activityEl = document.createElement('div');
        activityEl.className = 'activity-item';

        activityEl.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;

        activitiesList.appendChild(activityEl);
    });
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Destroy existing charts
    Object.values(dashboardCharts).forEach(chart => {
        if (chart) chart.destroy();
    });

    // Initialize livestock species chart
    initializeLivestockChart();

    // Initialize crop performance chart
    initializeCropsChart();
}

/**
 * Initialize livestock distribution chart
 */
function initializeLivestockChart() {
    const ctx = document.getElementById('livestockChart');
    if (!ctx) return;

    // Sample data - in real app, this would come from API
    const livestockData = {
        labels: ['Cattle', 'Sheep', 'Pigs', 'Poultry', 'Goats'],
        datasets: [{
            label: 'Number of Animals',
            data: [12, 8, 5, 20, 3],
            backgroundColor: [
                'rgba(44, 85, 48, 0.8)',
                'rgba(74, 124, 89, 0.8)',
                'rgba(104, 159, 56, 0.8)',
                'rgba(205, 180, 219, 0.8)',
                'rgba(255, 166, 0, 0.8)'
            ],
            borderColor: [
                'rgba(44, 85, 48, 1)',
                'rgba(74, 124, 89, 1)',
                'rgba(104, 159, 56, 1)',
                'rgba(205, 180, 219, 1)',
                'rgba(255, 166, 0, 1)'
            ],
            borderWidth: 2
        }]
    };

    dashboardCharts.livestock = new Chart(ctx, {
        type: 'doughnut',
        data: livestockData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize crop performance chart
 */
function initializeCropsChart() {
    const ctx = document.getElementById('cropsChart');
    if (!ctx) return;

    // Sample data - in real app, this would come from API
    const cropsData = {
        labels: ['Maize', 'Beans', 'Rice', 'Wheat', 'Soybeans'],
        datasets: [{
            label: 'Yield (tons)',
            data: [25, 8, 15, 12, 18],
            backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(33, 150, 243, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(255, 87, 34, 0.8)',
                'rgba(156, 39, 176, 0.8)'
            ],
            borderColor: [
                'rgba(76, 175, 80, 1)',
                'rgba(33, 150, 243, 1)',
                'rgba(255, 193, 7, 1)',
                'rgba(255, 87, 34, 1)',
                'rgba(156, 39, 176, 1)'
            ],
            borderWidth: 2
        }]
    };

    dashboardCharts.crops = new Chart(ctx, {
        type: 'bar',
        data: cropsData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Yield: ${context.parsed.y} tons`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Yield (tons)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Crop Type'
                    }
                }
            }
        }
    });
}

/**
 * Load sample dashboard data for demo
 */
function loadSampleDashboardData() {
    // This function adds sample data for demonstration
    // In a real app, this would be replaced with actual API calls

    if (app.user && app.user.farm_role === 'farmer') {
        // Show farmer-specific dashboard elements
        const dashboardPage = app.getElement('dashboardPage');
        if (dashboardPage) {
            // Add any farmer-specific customizations here
        }
    }
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    app.showLoadingSpinner();

    try {
        await loadDashboardStats();
        await loadRecentActivities();
        initializeCharts();

        app.showToast('Dashboard refreshed', 'success');

    } catch (error) {
        console.error('Failed to refresh dashboard:', error);
        app.showToast('Failed to refresh dashboard', 'error');
    }

    app.hideLoadingSpinner();
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadDashboard,
        refreshDashboard
    };
}
