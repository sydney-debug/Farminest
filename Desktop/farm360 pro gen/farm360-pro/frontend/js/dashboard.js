// Farm360 Pro - Dashboard Module

class Dashboard {
  constructor(app) {
    this.app = app;
    this.api = new API(app);
  }

  async load() {
    try {
      await Promise.all([
        this.loadOverview(),
        this.loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.app.showNotification('Failed to load dashboard data', 'error');
    }
  }

  async loadOverview() {
    try {
      const response = await this.api.getDashboardOverview();

      if (response.success) {
        const data = response.data;

        // Update stat cards
        document.getElementById('totalAnimals').textContent = data.totalAnimals || 0;
        document.getElementById('totalCrops').textContent = data.totalCrops || 0;
        document.getElementById('monthlySales').textContent = this.app.formatCurrency(data.monthlySales || 0);
        document.getElementById('outstandingDebts').textContent = this.app.formatCurrency(data.outstandingDebts || 0);

        // Store data for charts
        this.overviewData = data;
      }
    } catch (error) {
      console.error('Failed to load dashboard overview:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const activityList = document.getElementById('recentActivity');
      if (!activityList) return;

      // For now, show sample activities
      // In a real app, this would come from the API
      const activities = [
        {
          type: 'animal_added',
          description: 'Added new cow: Bessie',
          date: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        },
        {
          type: 'sale_recorded',
          description: 'Sold 50kg of corn to Johnson Farm',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          type: 'health_check',
          description: 'Health check completed for Daisy',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        }
      ];

      activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
          </div>
          <div class="activity-content">
            <div class="title">${activity.description}</div>
            <div class="time">${this.app.formatDateTime(activity.date)}</div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  getActivityIcon(type) {
    const icons = {
      animal_added: 'plus-circle',
      sale_recorded: 'dollar-sign',
      health_check: 'stethoscope',
      crop_harvested: 'seedling',
      payment_received: 'credit-card'
    };
    return icons[type] || 'circle';
  }

  clearData() {
    // Clear dashboard data when logging out
    document.getElementById('totalAnimals').textContent = '0';
    document.getElementById('totalCrops').textContent = '0';
    document.getElementById('monthlySales').textContent = '$0';
    document.getElementById('outstandingDebts').textContent = '$0';

    const activityList = document.getElementById('recentActivity');
    if (activityList) {
      activityList.innerHTML = '<p>No recent activity</p>';
    }
  }
}
