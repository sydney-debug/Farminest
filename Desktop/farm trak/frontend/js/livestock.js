/**
 * Livestock Management JavaScript for FarmTrak 360
 * Handles livestock CRUD operations and display
 */

let livestock = [];
let livestockModal;

/**
 * Load livestock page content
 */
async function loadLivestock() {
    try {
        await loadLivestockData();
        setupLivestockEventListeners();

    } catch (error) {
        console.error('Failed to load livestock:', error);
        app.showToast('Failed to load livestock', 'error');
    }
}

/**
 * Load livestock data from API
 */
async function loadLivestockData() {
    try {
        const response = await app.apiRequest('/livestock');
        livestock = response.livestock || [];

        displayLivestock(livestock);

    } catch (error) {
        console.error('Failed to load livestock data:', error);
        // Use sample data for demo
        livestock = getSampleLivestock();
        displayLivestock(livestock);
    }
}

/**
 * Display livestock in the UI
 */
function displayLivestock(livestockList) {
    const livestockGrid = app.getElement('livestockGrid');
    if (!livestockGrid) return;

    livestockGrid.innerHTML = '';

    if (livestockList.length === 0) {
        livestockGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-cow"></i>
                <h3>No livestock found</h3>
                <p>Start by adding your first animal to track your livestock.</p>
            </div>
        `;
        return;
    }

    livestockList.forEach(animal => {
        const livestockCard = createLivestockCard(animal);
        livestockGrid.appendChild(livestockCard);
    });
}

/**
 * Create livestock card element
 */
function createLivestockCard(animal) {
    const card = document.createElement('div');
    card.className = 'card livestock-card';
    card.dataset.livestockId = animal.id;

    const birthDate = animal.birth_date ? app.formatDate(animal.birth_date) : 'Unknown';
    const healthStatus = animal.health_status || 'healthy';
    const healthClass = `health-${healthStatus}`;

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${animal.name || `Animal ${animal.tag_number}`}</h3>
            <div class="card-actions">
                <button class="btn btn-sm btn-outline edit-livestock-btn" data-livestock-id="${animal.id}">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-sm btn-secondary delete-livestock-btn" data-livestock-id="${animal.id}">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>

        <div class="card-body">
            <div class="livestock-details">
                <div class="detail-row">
                    <span class="label">Tag Number:</span>
                    <span class="value">${animal.tag_number}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Species:</span>
                    <span class="value">${animal.species}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Breed:</span>
                    <span class="value">${animal.breed || 'Not specified'}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Gender:</span>
                    <span class="value">${animal.gender || 'Not specified'}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Birth Date:</span>
                    <span class="value">${birthDate}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Weight:</span>
                    <span class="value">${animal.current_weight ? `${animal.current_weight} kg` : 'Not recorded'}</span>
                </div>

                <div class="detail-row">
                    <span class="label">Health Status:</span>
                    <span class="value health-badge ${healthClass}">
                        <i class="fas ${getHealthIcon(healthStatus)}"></i>
                        ${healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                    </span>
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="livestock-actions">
                <button class="btn btn-sm btn-outline add-health-btn" data-livestock-id="${animal.id}">
                    <i class="fas fa-plus"></i>
                    Add Health Record
                </button>
                <button class="btn btn-sm btn-secondary view-history-btn" data-livestock-id="${animal.id}">
                    <i class="fas fa-history"></i>
                    View History
                </button>
            </div>
        </div>
    `;

    return card;
}

/**
 * Get health status icon
 */
function getHealthIcon(status) {
    switch (status) {
        case 'healthy': return 'fa-check-circle';
        case 'sick': return 'fa-exclamation-triangle';
        case 'under_treatment': return 'fa-stethoscope';
        default: return 'fa-question-circle';
    }
}

/**
 * Setup livestock event listeners
 */
function setupLivestockEventListeners() {
    // Add livestock button
    const addLivestockBtn = app.getElement('addLivestockBtn');
    if (addLivestockBtn) {
        addLivestockBtn.addEventListener('click', () => {
            openLivestockModal();
        });
    }

    // Edit livestock buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-livestock-btn') || e.target.closest('.edit-livestock-btn')) {
            const btn = e.target.classList.contains('edit-livestock-btn') ? e.target : e.target.closest('.edit-livestock-btn');
            const livestockId = btn.dataset.livestockId;
            editLivestock(livestockId);
        }
    });

    // Delete livestock buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-livestock-btn') || e.target.closest('.delete-livestock-btn')) {
            const btn = e.target.classList.contains('delete-livestock-btn') ? e.target : e.target.closest('.delete-livestock-btn');
            const livestockId = btn.dataset.livestockId;
            deleteLivestock(livestockId);
        }
    });

    // Add health record buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-health-btn') || e.target.closest('.add-health-btn')) {
            const btn = e.target.classList.contains('add-health-btn') ? e.target : e.target.closest('.add-health-btn');
            const livestockId = btn.dataset.livestockId;
            addHealthRecord(livestockId);
        }
    });

    // Setup modal event listeners
    setupLivestockModalListeners();
}

/**
 * Setup livestock modal event listeners
 */
function setupLivestockModalListeners() {
    const modal = app.getElement('livestockModal');
    const closeBtn = app.getElement('livestockModalClose');
    const cancelBtn = app.getElement('livestockModalCancel');
    const form = app.getElement('livestockForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeLivestockModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeLivestockModal();
        });
    }

    if (form) {
        form.addEventListener('submit', handleLivestockFormSubmit);
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLivestockModal();
            }
        });
    }

    // Load farms for farm selection dropdown
    loadFarmsForDropdown();
}

/**
 * Load farms for dropdown selection
 */
async function loadFarmsForDropdown() {
    try {
        const response = await app.apiRequest('/farms');
        const farms = response.farms || [];

        const farmSelect = app.getElement('livestockFarm');
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
        console.error('Failed to load farms for dropdown:', error);
    }
}

/**
 * Open livestock modal for adding new livestock
 */
function openLivestockModal(animal = null) {
    const modal = app.getElement('livestockModal');
    const title = app.getElement('livestockModalTitle');
    const form = app.getElement('livestockForm');

    if (!modal || !title || !form) return;

    // Set modal title
    title.textContent = animal ? 'Edit Livestock' : 'Add Livestock';

    // Reset form
    form.reset();

    // If editing, populate form with animal data
    if (animal) {
        populateLivestockForm(form, animal);
    }

    // Show modal
    modal.classList.add('show');
    livestockModal = { mode: animal ? 'edit' : 'add', animal };

    // Focus first input
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
}

/**
 * Close livestock modal
 */
function closeLivestockModal() {
    const modal = app.getElement('livestockModal');
    if (modal) {
        modal.classList.remove('show');
        livestockModal = null;
    }
}

/**
 * Populate livestock form with existing animal data
 */
function populateLivestockForm(form, animal) {
    const formData = new FormData(form);

    // Map animal properties to form fields
    const fieldMappings = {
        'farm_id': animal.farm_id,
        'tag_number': animal.tag_number,
        'name': animal.name,
        'species': animal.species,
        'breed': animal.breed,
        'gender': animal.gender,
        'birth_date': animal.birth_date,
        'purchase_date': animal.purchase_date,
        'purchase_price': animal.purchase_price,
        'current_weight': animal.current_weight,
        'color': animal.color,
        'markings': animal.markings,
        'mother_tag': animal.mother_tag,
        'father_tag': animal.father_tag,
        'health_status': animal.health_status,
        'location': animal.location,
        'notes': animal.notes
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
 * Handle livestock form submission
 */
async function handleLivestockFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const livestockData = Object.fromEntries(formData.entries());

    // Clean up data
    Object.keys(livestockData).forEach(key => {
        if (livestockData[key] === '') {
            delete livestockData[key];
        }
    });

    try {
        if (livestockModal.mode === 'edit') {
            await updateLivestock(livestockModal.animal.id, livestockData);
        } else {
            await createLivestock(livestockData);
        }

        closeLivestockModal();
        await loadLivestockData();
        app.showToast(`Livestock ${livestockModal.mode === 'edit' ? 'updated' : 'created'} successfully`, 'success');

    } catch (error) {
        console.error('Failed to save livestock:', error);
        app.showToast('Failed to save livestock', 'error');
    }
}

/**
 * Create new livestock
 */
async function createLivestock(livestockData) {
    try {
        await app.apiRequest('/livestock', {
            method: 'POST',
            body: JSON.stringify(livestockData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Update existing livestock
 */
async function updateLivestock(livestockId, livestockData) {
    try {
        await app.apiRequest(`/livestock/${livestockId}`, {
            method: 'PUT',
            body: JSON.stringify(livestockData)
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Edit livestock
 */
function editLivestock(livestockId) {
    const animal = livestock.find(a => a.id === livestockId);
    if (animal) {
        openLivestockModal(animal);
    }
}

/**
 * Delete livestock
 */
async function deleteLivestock(livestockId) {
    const animal = livestock.find(a => a.id === livestockId);

    if (!animal) {
        app.showToast('Livestock not found', 'error');
        return;
    }

    // Show confirmation dialog
    app.getElement('confirmationTitle').textContent = 'Delete Livestock';
    app.getElement('confirmationMessage').textContent = `Are you sure you want to delete "${animal.name || animal.tag_number}"? This action cannot be undone.`;

    const confirmationModal = app.getElement('confirmationModal');
    confirmationModal.classList.add('show');

    // Handle confirmation
    const confirmBtn = app.getElement('confirmationConfirm');
    const cancelBtn = app.getElement('confirmationCancel');

    const handleConfirm = async () => {
        try {
            await app.apiRequest(`/livestock/${livestockId}`, {
                method: 'DELETE'
            });

            await loadLivestockData();
            app.showToast('Livestock deleted successfully', 'success');

        } catch (error) {
            console.error('Failed to delete livestock:', error);
            app.showToast('Failed to delete livestock', 'error');
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
 * Add health record for livestock
 */
function addHealthRecord(livestockId) {
    const animal = livestock.find(a => a.id === livestockId);
    if (animal) {
        app.showToast(`Add health record for ${animal.name || animal.tag_number}`, 'info');
        // In a real app, this would open a health record modal
    }
}

/**
 * Get sample livestock data for demo
 */
function getSampleLivestock() {
    return [
        {
            id: 'livestock-1',
            farm_id: 'farm-1',
            tag_number: 'GV-001',
            name: 'Bessie',
            species: 'cattle',
            breed: 'Holstein',
            gender: 'female',
            birth_date: '2020-03-15',
            current_weight: 450,
            health_status: 'healthy',
            farm: { name: 'Green Valley Farm' }
        },
        {
            id: 'livestock-2',
            farm_id: 'farm-1',
            tag_number: 'GV-002',
            name: 'Duke',
            species: 'cattle',
            breed: 'Angus',
            gender: 'male',
            birth_date: '2019-08-22',
            current_weight: 520,
            health_status: 'healthy',
            farm: { name: 'Green Valley Farm' }
        },
        {
            id: 'livestock-3',
            farm_id: 'farm-2',
            tag_number: 'SR-001',
            name: 'Wooly',
            species: 'sheep',
            breed: 'Merino',
            gender: 'female',
            birth_date: '2021-01-10',
            current_weight: 65,
            health_status: 'under_treatment',
            farm: { name: 'Sunrise Ranch' }
        }
    ];
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadLivestock
    };
}
