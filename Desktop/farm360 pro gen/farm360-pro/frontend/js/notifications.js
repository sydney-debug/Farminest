// Farm360 Pro - Notifications Module

class Notifications {
  constructor(app) {
    this.app = app;
    this.dropdown = null;
    this.badge = document.getElementById('notificationBadge');
    this.notifications = [];

    this.init();
  }

  init() {
    this.createDropdown();
    this.loadNotifications();
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'notification-dropdown';
    this.dropdown.innerHTML = `
      <div class="notification-header">
        <h4>Notifications</h4>
        <button class="mark-all-read" id="markAllRead">Mark all as read</button>
      </div>
      <div class="notification-list" id="notificationList">
        <p class="no-notifications">No notifications</p>
      </div>
    `;

    document.querySelector('.notifications').appendChild(this.dropdown);

    // Event listeners
    document.getElementById('markAllRead')?.addEventListener('click', () => {
      this.markAllAsRead();
    });
  }

  toggleDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.toggle('active');
    }
  }

  addNotification(message, type = 'info', persistent = false) {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false,
      persistent
    };

    this.notifications.unshift(notification);
    this.updateBadge();
    this.renderNotifications();

    if (!persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, 5000);
    }
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateBadge();
    this.renderNotifications();
  }

  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.updateBadge();
      this.renderNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.updateBadge();
    this.renderNotifications();
  }

  updateBadge() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (this.badge) {
      this.badge.textContent = unreadCount;
      this.badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<p class="no-notifications">No notifications</p>';
      return;
    }

    list.innerHTML = this.notifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}">
        <div class="notification-content">
          <p>${notification.message}</p>
          <small>${this.app.formatDateTime(notification.timestamp)}</small>
        </div>
        <div class="notification-actions">
          ${!notification.read ? '<button class="mark-read" onclick="window.farm360.notifications.markAsRead(${notification.id})">Mark read</button>' : ''}
          <button class="remove-notification" onclick="window.farm360.notifications.removeNotification(${notification.id})">&times;</button>
        </div>
      </div>
    `).join('');
  }

  loadNotifications() {
    // Load notifications from API or local storage
    // For now, we'll add some sample notifications
    setTimeout(() => {
      this.addNotification('Welcome to Farm360 Pro!', 'success', true);
      this.addNotification('Remember to feed your animals today', 'info');
      this.addNotification('Upcoming vet appointment tomorrow', 'warning');
    }, 2000);
  }
}
