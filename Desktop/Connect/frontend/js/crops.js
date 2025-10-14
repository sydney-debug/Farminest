/**
 * Crop Management JavaScript for FarmTrak 360
 * Handles crop CRUD operations and display
 */

let crops = [];
let cropsModal;

/**
 * Load crops page content
 */
async function loadCrops() {
    try {
        await loadCropsData();
        setupCropEventListeners();

    } catch (error) {
        console.error('Failed to load crops:', error);
        app.showToast('Failed to load crops', 'error');
    }
}

/**
 * Load crops data from API
 */
async function loadCropsData() {
    try {
        const response = await app.apiRequest('/crops');
        crops = response.crops || [];

        displayCrops(crops);

    } catch (error) {
        console.error('Failed to load crops data:', error);
        // Use sample data for demo
        crops = getSampleCrops();
        displayCrops(crops);
    }
}

/**
 * Display crops in the UI
 */
function displayCrops(cropsList) {
    const cropsGrid = app.getElement('cropsGrid');
    if (!cropsGrid) return;

    cropsGrid.innerHTML = '';

    if (cropsList.length === 0) {
        cropsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-seedling"></i>
                <h3>No crops found</h3>
                <p>Start by adding your first crop to track your agricultural activities.</p>
            </div>
        `;
        return;
    }

    cropsList.forEach(crop => {
        const cropCard = createCropCard(crop);
        cropsGrid.appendChild(cropCard);
    });
}

/**
 * Create crop card element
 */
function createCropCard(crop) {
    const card = document.createElement('div');
    card.className = 'card crop-card';
    card.dataset.cropId = crop.id;

    const plantedDate = crop.planted_date ? app.formatDate(crop.planted_date) : 'Unknown';
    const harvestDate = crop.expected_harvest_date ? app.formatDate(crop.expected_harvest_date) : 'Not set';
    const areaText = crop.area_hectares ? `${crop.area_hectares} ha` : 'Area not specified';

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${crop.name}</h3>
            <div class="card-actions">
                <button class="btn btn-sm btn-outline edit-crop-btn" data-crop-id="${crop.id}">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-sm btn-secondary delete-crop-btn" data-crop-id="${crop.id}">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>

        <div class="card-body">
            <div class="crop-details">
                <div class="detail-row">
                    <span class="label">Variety:</span>
                    <span class="value">${crop.variety || 'Not specified'}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Area:</span>
                    <span class="value">${areaText}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Planted Date:</span>
                    <span class="value">${plantedDate}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Expected Harvest:</span>
                    <span class="value">${harvestDate}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Yield:</span>
                    <span class="value">${crop.yield_kg ? `${crop.yield_kg} kg` : 'Not recorded'}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value status-badge ${getCropStatusClass(crop)}">
                        <i class="fas ${getCropStatusIcon(crop)}"></i>
                        ${getCropStatusText(crop)}
                    </span>
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="crop-actions">
                <button class="btn btn-sm btn-outline add-activity-btn" data-crop-id="${crop.id}">
                    <i class="fas fa-plus"></i>
                    Add Activity
                </button>
                <button class="btn btn-sm btn-secondary view-progress-btn" data-crop-id="${crop.id}">
                    <i class="fas fa-chart-line"></i>
                    View Progress
                </button>
            </div>
        </div>
    `;

    return card;
}

/**
 * Get crop status based on dates
 */
function getCropStatus(crop) {
    if (!crop.planted_date) return 'planning';

    const plantedDate = new Date(crop.planted_date);
    const harvestDate = crop.expected_harvest_date ? new Date(crop.expected_harvest_date) : null;
    const today = new Date();

    if (crop.actual_harvest_date) return 'harvested';
    if (harvestDate && today > harvestDate) return 'overdue';
    if (harvestDate && (harvestDate - today) < (7 * 24 * 60 * 60 * 1000)) return 'ready'; // Within 7 days

    return 'growing';
}

/**
 * Get crop status CSS class
 */
function getCropStatusClass(crop) {
    const status = getCropStatus(crop);
    return `status-${status}`;
}

/**
 * Get crop status icon
 */
function getCropStatusIcon(crop) {
    const status = getCropStatus(crop);
    switch (status) {
        case 'planning': return 'fa-calendar-alt';
        case 'growing': return 'fa-seedling';
        case 'ready': return 'fa-check-circle';
        case 'overdue': return 'fa-exclamation-triangle';
        case 'harvested': return 'fa-cut';
        default: return 'fa-question-circle';
    }
}

/**
 * Get crop status text
 */
function getCropStatusText(crop) {
    const status = getCropStatus(crop);
    switch (status) {
        case 'planning': return 'Planning';
        case 'growing': return 'Growing';
        case 'ready': return 'Ready for Harvest';
        case 'overdue': return 'Harvest Overdue';
        case 'harvested': return 'Harvested';
        default: return 'Unknown';
    }
}

/**
 * Setup crop event listeners
 */
function setupCropEventListeners() {
    // Add crop button
    const addCropBtn = app.getElement('addCropBtn');
    if (addCropBtn) {
        addCropBtn.addEventListener('click', () => {
            openCropModal();
        });
    }

    // Edit crop buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-crop-btn') || e.target.closest('.edit-crop-btn')) {
            const btn = e.target.classList.contains('edit-crop-btn') ? e.target : e.target.closest('.edit-crop-btn');
            const cropId = btn.dataset.cropId;
            editCrop(cropId);
        }
    });

    // Delete crop buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-crop-btn') || e.target.closest('.delete-crop-btn')) {
            const btn = e.target.classList.contains('delete-crop-btn') ? e.target : e.target.closest('.delete-crop-btn');
            const cropId = btn.dataset.cropId;
            deleteCrop(cropId);
        }
    });

    // Setup modal event listeners
    setupCropModalListeners();
}

/**
 * Setup crop modal event listeners
 */
function setupCropModalListeners() {
    const modal = app.getElement('cropModal');
    const closeBtn = app.getElement('cropModalClose');
    const cancelBtn = app.getElement('cropModalCancel');
    const form = app.getElement('cropForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeCropModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeCropModal();
        });
    }

    if (form) {
        form.addEventListener('submit', handleCropFormSubmit);
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCropModal();
            }
        });
    }

    // Load farms for farm selection dropdown
    loadFarmsForCropDropdown();
}

/**
 * Load farms for crop dropdown selection
 */
async function loadFarmsForCropDropdown() {
    try {
        const response = await app.apiRequest('/farms');
        const farms = response.farms || [];

        const farmSelect = app.getElement('cropFarm');
        if (farmSelect) {
            farmSelect.innerHTML = '<option value="">Select Farm</option>';
            farms.forEach(farm => {
                const option = document.createElement('option');
                option.value = farm.id;
                option.textContent = farm.name;
                farmSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Failed to load farms for crop dropdown:', error);
    }
}

/**
 * Open crop modal for adding new crop
 */
function openCropModal(crop = null) {
    const modal = app.getElement('cropModal');
    const title = app.getElement('cropModalTitle');
    const form = app.getElement('cropForm');

    if (!modal || !title || !form) return;

    // Set modal title
    title.textContent = crop ? 'Edit Crop' : 'Add Crop';

    // Reset form
    form.reset();

    // If editing, populate form with crop data
    if (crop) {
        populateCropForm(form, crop);
    }

    // Show modal
    modal.classList.add('show');
    cropsModal = { mode: crop ? 'edit' : 'add', crop };

    // Focus first input
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

/**
 * Close crop modal
 */
function closeCropModal() {
    const modal = app.getElement('cropModal');
    if (modal) {
        modal.classList.remove('show');
        cropsModal = null;
    }
}

/**
 * Populate crop form with existing crop data
 */
function populateCropForm(form, crop) {
    const formData = new FormData(form);

    // Map crop properties to form fields
    const fieldMappings = {
        'farm_id': crop.farm_id,
        'name': crop.name,
        'variety': crop.variety,
        'area_hectares': crop.area_hectares,
        'planted_date': crop.planted_date,
        'expected_harvest_date': crop.expected_harvest_date,
        'actual_harvest_date': crop.actual_harvest_date,
        'notes': crop.notes
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
 * Handle crop form submission
 */
async function handleCropFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const cropData = Object.fromEntries(formData.entries());

    // Clean up data
    Object.keys(cropData).forEach(key => {
        if (cropData[key] === '') {
            delete cropData[key];
        }
    });

    try {
        if (cropsModal.mode === 'edit') {
            await updateCrop(cropsModal.crop.id, cropData);
        } else {
            await createCrop(cropData);
        }

        closeCropModal();
        await loadCropsData();
        app.showToast(`Crop ${cropsModal.mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');

    } catch (error) {
        console.error('Failed to save crop:', error);
        app.showToast('Failed to save crop', 'error');
    }
}

/**
 * Create new crop
 */
async function createCrop(cropData) {
    try {
        await app.apiRequest('/crops', {
            method: 'POST',
            body: JSON.stringify(cropData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Update existing crop
 */
async function updateCrop(cropId, cropData) {
    try {
        await app.apiRequest(`/crops/${cropId}`, {
            method: 'PUT',
            body: JSON.stringify(cropData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Edit crop
 */
function editCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        openCropModal(crop);
    }
}

/**
 * Delete crop
 */
async function deleteCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);

    if (!crop) {
        app.showToast('Crop not found', 'error');
        return;
    }

    // Show confirmation dialog
    app.getElement('confirmationTitle').textContent = 'Delete Crop';
    app.getElement('confirmationMessage').textContent = `Are you sure you want to delete "${crop.name}"? This action cannot be undone.`;

    const confirmationModal = app.getElement('confirmationModal');
    confirmationModal.classList.add('show');

    // Handle confirmation
    const confirmBtn = app.getElement('confirmationConfirm');
    const cancelBtn = app.getElement('confirmationCancel');

    const handleConfirm = async () => {
        try {
            await app.apiRequest(`/crops/${cropId}`, {
                method: 'DELETE'
            });

            await loadCropsData();
            app.showToast('Crop deleted successfully', 'success');

        } catch (error) {
            console.error('Failed to delete crop:', error);
            app.showToast('Failed to delete crop', 'error');
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
 * Get sample crops data for demo
 */
function getSampleCrops() {
    return [
        {
            id: 'crop-1',
            farm_id: 'farm-1',
            name: 'Maize',
            variety: 'Hybrid Variety',
            area_hectares: 20.0,
            planted_date: '2024-03-01',
            expected_harvest_date: '2024-07-15',
            yield_kg: 2500,
            farm: { name: 'Green Valley Farm' }
        },
        {
            id: 'crop-2',
            farm_id: 'farm-1',
            name: 'Beans',
            variety: 'Bush Beans',
            area_hectares: 15.0,
            planted_date: '2024-03-15',
            expected_harvest_date: '2024-06-20',
            yield_kg: 800,
            farm: { name: 'Green Valley Farm' }
        },
        {
            id: 'crop-3',
            farm_id: 'farm-2',
            name: 'Rice',
            variety: 'Long Grain',
            area_hectares: 30.0,
            planted_date: '2024-02-01',
            expected_harvest_date: '2024-06-01',
            yield_kg: 4500,
            farm: { name: 'Sunrise Ranch' }
        }
    ];
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCrops
    };
}
