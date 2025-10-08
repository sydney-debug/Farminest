// Farm360 Pro - Authentication Module

class Auth {
  constructor(app) {
    this.app = app;
    this.api = new API(app);
  }

  async validateToken() {
    try {
      const response = await this.api.getProfile();
      if (response.success) {
        this.app.currentUser = response.user;
        this.updateUI();
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  async login(email, password) {
    try {
      const response = await this.api.login({ email, password });

      if (response.success) {
        this.app.token = response.token;
        this.app.currentUser = response.user;

        localStorage.setItem('token', response.token);
        this.updateUI();

        this.app.showNotification('Login successful!', 'success');
        return true;
      }
    } catch (error) {
      this.app.showNotification(error.message || 'Login failed', 'error');
      return false;
    }
  }

  async register(userData) {
    try {
      const response = await this.api.register(userData);

      if (response.success) {
        this.app.token = response.token;
        this.app.currentUser = response.user;

        localStorage.setItem('token', response.token);
        this.updateUI();

        this.app.showNotification('Registration successful!', 'success');
        return true;
      }
    } catch (error) {
      this.app.showNotification(error.message || 'Registration failed', 'error');
      return false;
    }
  }

  logout() {
    this.app.token = null;
    this.app.currentUser = null;
    localStorage.removeItem('token');

    // Clear any sensitive data
    if (this.app.dashboard) {
      this.app.dashboard.clearData();
    }

    this.showLoginForm();
  }

  updateUI() {
    const loginElements = document.querySelectorAll('.login-required');
    const logoutBtn = document.getElementById('logoutBtn');

    if (this.app.currentUser) {
      // Show authenticated UI
      loginElements.forEach(el => el.style.display = 'block');
      logoutBtn.style.display = 'flex';

      // Update user info in header if needed
      this.updateUserInfo();

      // Load dashboard data
      this.app.showDashboard();
    } else {
      // Show login UI
      loginElements.forEach(el => el.style.display = 'none');
      logoutBtn.style.display = 'none';

      this.showLoginForm();
    }
  }

  updateUserInfo() {
    // Update any user info displays in the UI
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = this.app.currentUser?.fullName || 'User';
    });
  }

  showLoginForm() {
    const modalContent = `
      <div class="auth-container">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="register">Register</button>
        </div>

        <div class="auth-form-container">
          <div class="auth-form active" id="loginForm">
            <h3>Welcome Back</h3>
            <p>Sign in to your Farm360 Pro account</p>

            <form id="loginFormElement">
              <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" required>
              </div>

              <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" required>
              </div>

              <button type="submit" class="btn btn-primary w-full">Sign In</button>
            </form>
          </div>

          <div class="auth-form" id="registerForm">
            <h3>Create Account</h3>
            <p>Join Farm360 Pro to manage your farm</p>

            <form id="registerFormElement">
              <div class="form-row">
                <div class="form-group">
                  <label for="registerFullName">Full Name</label>
                  <input type="text" id="registerFullName" required>
                </div>

                <div class="form-group">
                  <label for="registerEmail">Email</label>
                  <input type="email" id="registerEmail" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="registerPhone">Phone</label>
                  <input type="tel" id="registerPhone">
                </div>

                <div class="form-group">
                  <label for="registerUserType">Account Type</label>
                  <select id="registerUserType" required>
                    <option value="farmer">Farmer</option>
                    <option value="vet">Veterinarian</option>
                  </select>
                </div>
              </div>

              <!-- Vet-specific fields -->
              <div class="vet-fields" style="display: none;">
                <div class="form-row">
                  <div class="form-group">
                    <label for="registerClinicName">Clinic Name</label>
                    <input type="text" id="registerClinicName">
                  </div>

                  <div class="form-group">
                    <label for="registerSpecialization">Specialization</label>
                    <input type="text" id="registerSpecialization">
                  </div>
                </div>

                <div class="form-group">
                  <label for="registerLicenseNumber">License Number</label>
                  <input type="text" id="registerLicenseNumber">
                </div>

                <div class="form-group">
                  <label for="registerAddress">Clinic Address</label>
                  <textarea id="registerAddress" rows="3"></textarea>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="registerPassword">Password</label>
                  <input type="password" id="registerPassword" required minlength="6">
                </div>

                <div class="form-group">
                  <label for="registerConfirmPassword">Confirm Password</label>
                  <input type="password" id="registerConfirmPassword" required minlength="6">
                </div>
              </div>

              <button type="submit" class="btn btn-success w-full">Create Account</button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.app.modal.open('Authentication', modalContent);

    // Setup event listeners
    this.setupAuthEventListeners();
  }

  setupAuthEventListeners() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');

        // Update active tab
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active form
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tabName}Form`).classList.add('active');

        // Show/hide vet fields
        this.toggleVetFields();
      });
    });

    // User type change
    document.getElementById('registerUserType')?.addEventListener('change', () => {
      this.toggleVetFields();
    });

    // Form submissions
    document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      await this.login(email, password);
    });

    document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        fullName: document.getElementById('registerFullName').value,
        email: document.getElementById('registerEmail').value,
        phone: document.getElementById('registerPhone').value,
        userType: document.getElementById('registerUserType').value,
        password: document.getElementById('registerPassword').value
      };

      // Add vet-specific fields if user type is vet
      if (formData.userType === 'vet') {
        formData.clinicName = document.getElementById('registerClinicName').value;
        formData.specialization = document.getElementById('registerSpecialization').value;
        formData.licenseNumber = document.getElementById('registerLicenseNumber').value;
        formData.address = document.getElementById('registerAddress').value;
      }

      // Validate passwords match
      const confirmPassword = document.getElementById('registerConfirmPassword').value;
      if (formData.password !== confirmPassword) {
        this.app.showNotification('Passwords do not match', 'error');
        return;
      }

      await this.register(formData);
    });
  }

  toggleVetFields() {
    const userType = document.getElementById('registerUserType').value;
    const vetFields = document.querySelector('.vet-fields');

    if (userType === 'vet') {
      vetFields.style.display = 'block';
      // Make vet fields required
      document.getElementById('registerClinicName').required = true;
      document.getElementById('registerSpecialization').required = true;
      document.getElementById('registerLicenseNumber').required = true;
    } else {
      vetFields.style.display = 'none';
      // Remove required from vet fields
      document.getElementById('registerClinicName').required = false;
      document.getElementById('registerSpecialization').required = false;
      document.getElementById('registerLicenseNumber').required = false;
    }
  }
}
