// Farm360 Pro - Main JavaScript File
import { API_BASE_URL } from './config.js';

class Farm360App {
  constructor() {
    this.apiBaseUrl = API_BASE_URL;
    this.token = localStorage.getItem('token');
    this.currentUser = null;
    this.currentPage = 'dashboard';

    this.init();
  }

  init() {
    // Initialize components
    this.auth = new Auth(this);
    this.navigation = new Navigation(this);
    this.modal = new Modal(this);
    this.notifications = new Notifications(this);

    // Initialize page modules
    this.dashboard = new Dashboard(this);
    this.animals = new Animals(this);

    // Check authentication
    if (this.token) {
      this.auth.validateToken();
    } else {
      this.showLogin();
    }

    // Setup global event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Global click handlers for navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-page]')) {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        this.navigation.navigateTo(page);
      }
    });

    // Add button handler
    document.addEventListener('click', (e) => {
      if (e.target.matches('#addBtn') || e.target.closest('#addBtn')) {
        e.preventDefault();
        this.handleAddButton();
      }
    });

    // Global form submission handler
    document.addEventListener('submit', (e) => {
      if (e.target.matches('form[data-api]')) {
        e.preventDefault();
        this.handleFormSubmit(e.target);
      }
    });
  }

  async handleFormSubmit(form) {
    const apiEndpoint = form.getAttribute('data-api');
    const formData = new FormData(form);

    try {
      const response = await fetch(`${this.apiBaseUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...((form.enctype !== 'multipart/form-data') && {
            'Content-Type': 'application/json'
          })
        },
        ...(form.enctype === 'multipart/form-data' ? { body: formData } : {
          body: JSON.stringify(Object.fromEntries(formData))
        })
      });

      const result = await response.json();

      if (response.ok) {
        this.notifications.show('Success!', 'success');
        form.reset();
        // Refresh current page data
        this.refreshCurrentPage();
      } else {
        this.notifications.show(result.message || 'Error occurred', 'error');
      }
    } catch (error) {
      console.error('API Error:', error);
      this.notifications.show('Network error occurred', 'error');
    }
  }

  handleAddButton() {
    const currentPage = this.currentPage;
    let modalContent = '';

    switch(currentPage) {
      case 'animals':
        modalContent = this.animals.getAddAnimalForm();
        break;
      case 'crops':
        modalContent = this.crops.getAddCropForm();
        break;
      case 'produce':
        modalContent = this.produce.getAddProduceForm();
        break;
      case 'customers':
        modalContent = this.customers.getAddCustomerForm();
        break;
      default:
        modalContent = '<p>Add functionality for this page</p>';
    }

    this.modal.show('Add New Item', modalContent);
  }

  refreshCurrentPage() {
    switch(this.currentPage) {
      case 'dashboard':
        this.dashboard.loadDashboard();
        break;
      case 'animals':
        this.animals.loadAnimals();
        break;
      case 'crops':
        this.crops.loadCrops();
        break;
      case 'produce':
        this.produce.loadProduce();
        break;
      case 'customers':
        this.customers.loadCustomers();
        break;
    }
  }

  showLogin() {
    this.navigation.showPage('login');
  }

  logout() {
    localStorage.removeItem('token');
    this.token = null;
    this.currentUser = null;
    this.showLogin();
  }

  async apiRequest(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async apiGet(endpoint) {
    return this.apiRequest(endpoint, { method: 'GET' });
  }

  async apiPost(endpoint, data) {
    return this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async apiPut(endpoint, data) {
    return this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async apiDelete(endpoint) {
    return this.apiRequest(endpoint, { method: 'DELETE' });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.farm360 = new Farm360App();
});
