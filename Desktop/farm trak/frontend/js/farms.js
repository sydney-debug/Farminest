/**
 * Farm Management JavaScript for FarmTrak 360
 * Handles farm CRUD operations and display
 */

let farms = [];
let farmsModal;

/**
 * Load farms page content
 */
async function loadFarms() {
    try {
        await loadFarmsData();
        setupFarmEventListeners();

    } catch (error) {
        console.error('Failed to load farms:', error);
        app.showToast('Failed to load farms', 'error');
    }
}

/**
 * Load farms data from API
 */
async function loadFarmsData() {
    try {
        const response = await app.apiRequest('/farms');
        farms = response.farms || [];

        displayFarms(farms);

    } catch (error) {
        console.error('Failed to load farms data:', error);
        // Use sample data for demo
        farms = getSampleFarms();
        displayFarms(farms);
    }
}

/**
 * Display farms in the UI
 */
function displayFarms(farmsList) {
    const farmsGrid = app.getElement('farmsGrid');
    if (!farmsGrid) return;

    farmsGrid.innerHTML = '';

    if (farmsList.length === 0) {
        farmsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-home"></i>
                <h3>No farms found</h3>
                <p>Start by adding your first farm to get started with FarmTrak 360.</p>
            </div>
        `;
        return;
    }

    farmsList.forEach(farm => {
        const farmCard = createFarmCard(farm);
        farmsGrid.appendChild(farmCard);
    });
}

/**
 * Create farm card element
 */
function createFarmCard(farm) {
    const card = document.createElement('div');
    card.className = 'card farm-card';
    card.dataset.farmId = farm.id;

    const areaText = farm.area_hectares ? `${farm.area_hectares} ha` : 'Area not specified';
    const typeText = farm.farm_type ? farm.farm_type.charAt(0).toUpperCase() + farm.farm_type.slice(1) : 'Mixed';

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${farm.name}</h3>
            <div class="card-actions">
                <button class="btn btn-sm btn-outline edit-farm-btn" data-farm-id="${farm.id}">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-sm btn-secondary delete-farm-btn" data-farm-id="${farm.id}">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>

        <div class="card-body">
            <p>${farm.description || 'No description available'}</p>

            <div class="farm-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${farm.location || 'Location not specified'}</span>
                </div>

                <div class="detail-item">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${areaText}</span>
                </div>

                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    <span>${typeText} Farm</span>
                </div>

                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>Est. ${farm.established_date ? app.formatDate(farm.established_date) : 'Date not specified'}</span>
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="farm-stats">
                <span class="stat">
                    <i class="fas fa-cow"></i>
                    <span>${farm.livestock?.[0]?.count || 0} Livestock</span>
                </span>
                <span class="stat">
                    <i class="fas fa-seedling"></i>
                    <span>${farm.crops?.[0]?.count || 0} Crops</span>
                </span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Setup farm event listeners
 */
function setupFarmEventListeners() {
    // Add farm button
    const addFarmBtn = app.getElement('addFarmBtn');
    if (addFarmBtn) {
        addFarmBtn.addEventListener('click', () => {
            openFarmModal();
        });
    }

    // Edit farm buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-farm-btn') || e.target.closest('.edit-farm-btn')) {
            const btn = e.target.classList.contains('edit-farm-btn') ? e.target : e.target.closest('.edit-farm-btn');
            const farmId = btn.dataset.farmId;
            editFarm(farmId);
        }
    });

    // Delete farm buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-farm-btn') || e.target.closest('.delete-farm-btn')) {
            const btn = e.target.classList.contains('delete-farm-btn') ? e.target : e.target.closest('.delete-farm-btn');
            const farmId = btn.dataset.farmId;
            deleteFarm(farmId);
        }
    });

    // Setup modal event listeners
    setupFarmModalListeners();
}

/**
 * Setup farm modal event listeners
 */
function setupFarmModalListeners() {
    const modal = app.getElement('farmModal');
    const closeBtn = app.getElement('farmModalClose');
    const cancelBtn = app.getElement('farmModalCancel');
    const form = app.getElement('farmForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeFarmModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeFarmModal();
        });
    }

    if (form) {
        form.addEventListener('submit', handleFarmFormSubmit);
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFarmModal();
            }
        });
    }
}

/**
 * Open farm modal for adding new farm
 */
function openFarmModal(farm = null) {
    const modal = app.getElement('farmModal');
    const title = app.getElement('farmModalTitle');
    const form = app.getElement('farmForm');

    if (!modal || !title || !form) return;

    // Set modal title
    title.textContent = farm ? 'Edit Farm' : 'Add Farm';

    // Reset form
    form.reset();

    // If editing, populate form with farm data
    if (farm) {
        populateFarmForm(form, farm);
    }

    // Show modal
    modal.classList.add('show');
    farmsModal = { mode: farm ? 'edit' : 'add', farm };

    // Focus first input
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

/**
 * Close farm modal
 */
function closeFarmModal() {
    const modal = app.getElement('farmModal');
    if (modal) {
        modal.classList.remove('show');
        farmsModal = null;
    }
}

/**
 * Populate farm form with existing farm data
 */
function populateFarmForm(form, farm) {
    const formData = new FormData(form);

    // Map farm properties to form fields
    const fieldMappings = {
        'name': farm.name,
        'description': farm.description,
        'location': farm.location,
        'latitude': farm.latitude,
        'longitude': farm.longitude,
        'area_hectares': farm.area_hectares,
        'farm_type': farm.farm_type,
        'established_date': farm.established_date,
        'contact_phone': farm.contact_phone,
        'contact_email': farm.contact_email
    };

    Object.entries(fieldMappings).forEach(([field, value]) => {
        const input = form.querySelector(`[name="${field}"]`);
        if (input && value !== null && value !== undefined) {
            if (input.type === 'date' && value) {
                input.value = new Date(value).toISOString().split('T')[0];
            } else {
                input.value = value;
            }
        }
    });
}

/**
 * Handle farm form submission
 */
async function handleFarmFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const farmData = Object.fromEntries(formData.entries());

    // Clean up data
    Object.keys(farmData).forEach(key => {
        if (farmData[key] === '') {
            delete farmData[key];
        }
    });

    try {
        if (farmsModal.mode === 'edit') {
            await updateFarm(farmsModal.farm.id, farmData);
        } else {
            await createFarm(farmData);
        }

        closeFarmModal();
        await loadFarmsData();
        app.showToast(`Farm ${farmsModal.mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');

    } catch (error) {
        console.error('Failed to save farm:', error);
        app.showToast('Failed to save farm', 'error');
    }
}

/**
 * Create new farm
 */
async function createFarm(farmData) {
    try {
        await app.apiRequest('/farms', {
            method: 'POST',
            body: JSON.stringify(farmData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Update existing farm
 */
async function updateFarm(farmId, farmData) {
    try {
        await app.apiRequest(`/farms/${farmId}`, {
            method: 'PUT',
            body: JSON.stringify(farmData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Edit farm
 */
function editFarm(farmId) {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
        openFarmModal(farm);
    }
}

/**
 * Delete farm
 */
async function deleteFarm(farmId) {
    const farm = farms.find(f => f.id === farmId);

    if (!farm) {
        app.showToast('Farm not found', 'error');
        return;
    }

    // Show confirmation dialog
    app.getElement('confirmationTitle').textContent = 'Delete Farm';
    app.getElement('confirmationMessage').textContent = `Are you sure you want to delete "${farm.name}"? This action cannot be undone.`;

    const confirmationModal = app.getElement('confirmationModal');
    confirmationModal.classList.add('show');

    // Handle confirmation
    const confirmBtn = app.getElement('confirmationConfirm');
    const cancelBtn = app.getElement('confirmationCancel');

    const handleConfirm = async () => {
        try {
            await app.apiRequest(`/farms/${farmId}`, {
                method: 'DELETE'
            });

            await loadFarmsData();
            app.showToast('Farm deleted successfully', 'success');

        } catch (error) {
            console.error('Failed to delete farm:', error);
            app.showToast('Failed to delete farm', 'error');
        }

        confirmationModal.classList.remove('show');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleCancel = () => {
        confirmationModal.classList.remove('show');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

/**
 * Get sample farms data for demo
 */
function getSampleFarms() {
    return [
        {
            id: 'farm-1',
            name: 'Green Valley Farm',
            description: 'A mixed crop and livestock farm focusing on sustainable agriculture',
            location: 'Nairobi, Kenya',
            area_hectares: 50.5,
            farm_type: 'mixed',
            established_date: '2020-01-15',
            contact_phone: '+254712345678',
            contact_email: 'greenvalley@example.com',
            livestock: [{ count: 25 }],
            crops: [{ count: 8 }]
        },
        {
            id: 'farm-2',
            name: 'Sunrise Ranch',
            description: 'Specialized in dairy farming and crop rotation',
            location: 'Nakuru, Kenya',
            area_hectares: 75.0,
            farm_type: 'mixed',
            established_date: '2018-06-01',
            contact_phone: '+254733456789',
            contact_email: 'sunrise@example.com',
            livestock: [{ count: 40 }],
            crops: [{ count: 12 }]
        }
    ];
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadFarms
    };
}
