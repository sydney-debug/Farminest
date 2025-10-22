const API = window.FRONTEND_API_URL || 'http://localhost:3001/api';
let token = null;
let map = null;
let salesChart = null;

// Auth & Session Management
function updateAuthUI(profile) {
  const authDiv = document.getElementById('auth');
  const loginForm = authDiv.querySelector('.login-form');
  const userInfo = authDiv.querySelector('.user-info');
  
  if (profile) {
    loginForm.style.display = 'none';
    userInfo.style.display = 'flex';
    userInfo.querySelector('.user-name').textContent = profile.name || profile.email;
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
  } else {
    loginForm.style.display = 'flex';
    userInfo.style.display = 'none';
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
  }
}

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  if (!email) {
    showToast('Please enter an email address', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    
    if (json.token) {
      token = json.token;
      localStorage.setItem('ff_token', token);
      updateAuthUI(json.profile);
      loadDashboard();
      showToast('Welcome back!', 'success');
    } else {
      showToast(json.error || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Connection error', 'error');
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('ff_token');
  updateAuthUI(null);
  showToast('Logged out successfully', 'info');
});

// Dashboard Data Loading
async function loadDashboard() {
  if (!token) return;
  
  try {
    // Load counts and data in parallel
    const [animals, crops, feeds, sales] = await Promise.all([
      fetch(`${API}/animals`, { headers: { 'authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/crops`, { headers: { 'authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/feeds`, { headers: { 'authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/sales/pl`, { headers: { 'authorization': `Bearer ${token}` } }).then(r => r.json())
    ]);

    // Update dashboard cards
    updateDashboardCounts({
      animals: animals.animals || [],
      crops: crops.crops || [],
      feeds: feeds.feeds || [],
      sales: sales.items || []
    });

    // Load specific sections
    loadAnimals(animals.animals);
    loadFeeds(feeds.feeds);
    loadVets();
    updateSalesChart(sales.items);
  } catch (err) {
    showToast('Error loading dashboard data', 'error');
  }
}

function updateDashboardCounts(data) {
  // Animals card
  document.getElementById('animal-count').textContent = data.animals.length;
  const healthyCounts = data.animals.reduce((acc, a) => {
    const lastHealth = a.health_records?.[0];
    if (lastHealth?.condition === 'Good') acc.healthy++;
    else acc.attention++;
    return acc;
  }, { healthy: 0, attention: 0 });
  document.getElementById('healthy-count').textContent = healthyCounts.healthy;
  document.getElementById('attention-count').textContent = healthyCounts.attention;

  // Crops card
  document.getElementById('crop-count').textContent = data.crops.length;
  document.getElementById('active-crops').textContent = data.crops.filter(c => !c.harvest_date).length;
  document.getElementById('total-area').textContent = data.crops.reduce((sum, c) => sum + (c.area_ha || 0), 0).toFixed(1);

  // Feed card
  document.getElementById('feed-count').textContent = data.feeds.length;
  document.getElementById('feed-types').textContent = new Set(data.feeds.map(f => f.name)).size;
  const lowStock = data.feeds.filter(f => f.quantity <= f.threshold).length;
  document.getElementById('low-stock').textContent = lowStock;
  document.getElementById('low-stock').parentElement.style.display = lowStock ? 'block' : 'none';

  // Sales summary (simplified)
  const totalSales = data.sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  document.getElementById('sales-total').textContent = formatCurrency(totalSales);
}

// Animals Management
function initAnimalForm() {
  const form = document.getElementById('animal-form');
  const addBtn = document.getElementById('btn-add-animal');
  const cancelBtn = document.getElementById('btn-cancel-animal');

  addBtn.addEventListener('click', () => form.style.display = 'block');
  cancelBtn.addEventListener('click', () => form.style.display = 'none');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    try {
      // Handle image upload first if present
      const imageFile = formData.get('image');
      let imagePath = null;
      
      if (imageFile.size > 0) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadRes = await fetch(`${API}/upload`, {
          method: 'POST',
          headers: { 'authorization': `Bearer ${token}` },
          body: uploadData
        });
        const { path } = await uploadRes.json();
        imagePath = path;
      }

      // Create animal with optional image
      const data = Object.fromEntries(formData.entries());
      delete data.image;
      if (imagePath) data.image_path = imagePath;

      const res = await fetch(`${API}/animals`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (json.animal) {
        form.reset();
        form.style.display = 'none';
        loadDashboard();
        showToast('Animal added successfully', 'success');
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      showToast(err.message || 'Error adding animal', 'error');
    }
  });
}

function loadAnimals(animals = []) {
  const tbody = document.getElementById('animal-list');
  tbody.innerHTML = '';
  
  animals.forEach(animal => {
    const tr = document.createElement('tr');
    const age = calculateAge(animal.dob);
    const lastHealth = animal.health_records?.[0];
    
    tr.innerHTML = `
      <td>${animal.name}</td>
      <td>${animal.species || 'N/A'}</td>
      <td>${animal.breed || 'N/A'}</td>
      <td>${age}</td>
      <td>
        <span class="status-${getHealthStatus(lastHealth)}">
          ${lastHealth?.condition || 'No records'}
        </span>
      </td>
      <td>
        <button class="btn-icon" onclick="showHealthForm('${animal.id}')">
          <i class="fas fa-stethoscope"></i>
        </button>
        <button class="btn-icon" onclick="deleteAnimal('${animal.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Feed Management
function loadFeeds(feeds = []) {
  const tbody = document.getElementById('feed-list');
  const alertsDiv = document.getElementById('feed-alerts');
  tbody.innerHTML = '';
  alertsDiv.innerHTML = '';
  
  // Show alerts for low stock
  const lowStock = feeds.filter(f => f.quantity <= f.threshold);
  if (lowStock.length > 0) {
    alertsDiv.innerHTML = `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        ${lowStock.length} feed items are running low
      </div>
    `;
  }
  
  feeds.forEach(feed => {
    const tr = document.createElement('tr');
    const status = feed.quantity <= feed.threshold ? 'low' :
                  feed.quantity <= feed.threshold * 1.5 ? 'medium' : 'good';
    
    tr.innerHTML = `
      <td>${feed.name}</td>
      <td>${feed.quantity} ${feed.unit}</td>
      <td>${feed.unit}</td>
      <td><span class="status-${status}">${status}</span></td>
      <td>
        <button class="btn-icon" onclick="updateFeed('${feed.id}')">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Vets Map
async function loadVets() {
  try {
    const res = await fetch(`${API}/vets`);
    const { vets } = await res.json();
    
    if (!map) {
      map = L.map('map').setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    }

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add vet markers and list
    const vetList = document.getElementById('vet-list');
    vetList.innerHTML = '';
    
    vets.forEach(vet => {
      if (vet.latitude && vet.longitude) {
        const marker = L.marker([vet.latitude, vet.longitude])
          .addTo(map)
          .bindPopup(`
            <strong>${vet.name}</strong><br>
            ${vet.address || ''}<br>
            <a href="tel:${vet.phone}">${vet.phone}</a>
          `);

        // Add to list
        const card = document.createElement('div');
        card.className = 'card vet-card';
        card.innerHTML = `
          <h3>${vet.name}</h3>
          <div class="vet-details">
            <p><i class="fas fa-map-marker-alt"></i> ${vet.address || 'No address'}</p>
            <p><i class="fas fa-phone"></i> ${vet.phone || 'No phone'}</p>
            <button onclick="map.setView([${vet.latitude}, ${vet.longitude}], 15)">
              Show on map
            </button>
          </div>
        `;
        vetList.appendChild(card);
      }
    });

    // Center map on first vet
    if (vets.length && vets[0].latitude) {
      map.setView([vets[0].latitude, vets[0].longitude], 10);
    }
  } catch (err) {
    showToast('Error loading vets', 'error');
  }
}

// Sales Chart
function updateSalesChart(sales = []) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  
  // Group sales by month
  const monthlyData = sales.reduce((acc, sale) => {
    const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + Number(sale.amount);
    return acc;
  }, {});

  if (salesChart) {
    salesChart.destroy();
  }

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(monthlyData),
      datasets: [{
        label: 'Monthly Sales',
        data: Object.values(monthlyData),
        borderColor: '#2b7a78',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Utility Functions
function showToast(message, type = 'info') {
  // Create toast if doesn't exist
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function calculateAge(dob) {
  if (!dob) return 'N/A';
  const diff = new Date() - new Date(dob);
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  return years > 0 ? `${years}y` : 'Less than 1y';
}

function getHealthStatus(record) {
  if (!record) return 'medium';
  return record.condition?.toLowerCase().includes('good') ? 'good' : 'medium';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  initAnimalForm();
  
  // Check for existing session
  token = localStorage.getItem('ff_token');
  if (token) {
    loadDashboard();
  }
  
  // Add refresh handler
  document.getElementById('btn-refresh').addEventListener('click', loadDashboard);
  
  // Add export handler
  document.getElementById('btn-export').addEventListener('click', async () => {
    if (!token) return;
    try {
      window.open(`${API}/sales/export?token=${token}`, '_blank');
    } catch (err) {
      showToast('Error exporting data', 'error');
    }
  });
});
