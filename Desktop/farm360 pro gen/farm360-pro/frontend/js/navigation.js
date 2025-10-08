// Farm360 Pro - Navigation Module

class Navigation {
  constructor(app) {
    this.app = app;
    this.sidebar = document.getElementById('sidebar');
    this.mainContent = document.getElementById('mainContent');
  }

  navigateTo(page) {
    // Update current page
    this.app.currentPage = page;

    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });

    // Update page title
    const pageTitles = {
      dashboard: 'Dashboard',
      animals: 'Animal Management',
      crops: 'Crop Management',
      produce: 'Produce & Sales',
      customers: 'Customer Management',
      health: 'Health Records',
      vets: 'Veterinarians',
      profile: 'Profile Settings'
    };

    document.getElementById('pageTitle').textContent = pageTitles[page] || 'Farm360 Pro';

    // Show/hide pages
    document.querySelectorAll('.page').forEach(pageEl => {
      pageEl.classList.remove('active');
    });

    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update add button text based on current page
    this.updateAddButton(page);

    // Load page-specific data
    this.loadPageData(page);

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 1024) {
      this.closeSidebar();
    }
  }

  updateAddButton(page) {
    const addBtn = document.getElementById('addBtn');
    if (!addBtn) return;

    const buttonTexts = {
      animals: 'Add Animal',
      crops: 'Add Crop',
      customers: 'Add Customer',
      produce: 'Add Produce',
      health: 'Add Health Record'
    };

    const buttonText = buttonTexts[page] || 'Add New';
    addBtn.querySelector('span').textContent = buttonText;
  }

  async loadPageData(page) {
    switch (page) {
      case 'dashboard':
        if (this.app.dashboard) {
          await this.app.dashboard.load();
        }
        break;
      case 'animals':
        if (this.app.animals) {
          await this.app.animals.load();
        }
        break;
      // Add other page loaders as needed
    }
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.toggle('active');
    }
  }

  openSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.add('active');
    }
  }

  closeSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.remove('active');
    }
  }

  // Handle responsive navigation
  handleResize() {
    if (window.innerWidth > 1024) {
      this.openSidebar();
    } else {
      this.closeSidebar();
    }
  }
}
