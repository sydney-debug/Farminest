// Farm360 Pro - Animals Module

class Animals {
  constructor(app) {
    this.app = app;
    this.api = new API(app);
    this.animals = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Filter change handlers
    document.getElementById('animalTypeFilter')?.addEventListener('change', () => {
      this.load();
    });

    document.getElementById('animalStatusFilter')?.addEventListener('change', () => {
      this.load();
    });
  }

  async load() {
    try {
      const typeFilter = document.getElementById('animalTypeFilter').value;
      const statusFilter = document.getElementById('animalStatusFilter').value;

      const filters = {};
      if (typeFilter) filters.type = typeFilter;
      if (statusFilter) filters.status = statusFilter;

      const response = await this.api.getAnimals(filters);

      if (response.success) {
        this.animals = response.data;
        this.render();
      }
    } catch (error) {
      console.error('Failed to load animals:', error);
      this.app.showNotification('Failed to load animals', 'error');
    }
  }

  render() {
    const tbody = document.getElementById('animalsTableBody');
    if (!tbody) return;

    if (this.animals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No animals found</td></tr>';
      return;
    }

    tbody.innerHTML = this.animals.map(animal => `
      <tr>
        <td>${animal.name}</td>
        <td>${this.capitalizeFirst(animal.type)}</td>
        <td>${animal.breed || '-'}</td>
        <td>${this.calculateAge(animal.date_of_birth)}</td>
        <td>${animal.weight ? animal.weight + ' kg' : '-'}</td>
        <td><span class="status-badge status-${animal.status}">${this.capitalizeFirst(animal.status)}</span></td>
        <td class="actions">
          <button class="btn btn-sm btn-primary" onclick="window.farm360.animals.editAnimal(${animal.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-info" onclick="window.farm360.animals.viewDetails(${animal.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.farm360.animals.deleteAnimal(${animal.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  showAddModal() {
    const fields = [
      { id: 'name', label: 'Animal Name', type: 'text', required: true },
      {
        id: 'type',
        label: 'Animal Type',
        type: 'select',
        required: true,
        options: [
          { value: 'cow', label: 'Cow' },
          { value: 'sheep', label: 'Sheep' },
          { value: 'goat', label: 'Goat' },
          { value: 'pig', label: 'Pig' },
          { value: 'chicken', label: 'Chicken' },
          { value: 'horse', label: 'Horse' },
          { value: 'other', label: 'Other' }
        ]
      },
      { id: 'breed', label: 'Breed', type: 'text' },
      { id: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { id: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1' },
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' }
        ]
      },
      { id: 'tagNumber', label: 'Tag Number', type: 'text' }
    ];

    this.app.modal.createFormModal('Add New Animal', fields, async (data) => {
      try {
        const response = await this.api.createAnimal(data);
        if (response.success) {
          this.app.showNotification('Animal added successfully!', 'success');
          this.app.modal.close();
          this.load(); // Reload the list
        }
      } catch (error) {
        console.error('Failed to add animal:', error);
      }
    });
  }

  async editAnimal(id) {
    try {
      const response = await this.api.getAnimal(id);
      if (!response.success) {
        this.app.showNotification('Animal not found', 'error');
        return;
      }

      const animal = response.data;

      const fields = [
        { id: 'name', label: 'Animal Name', type: 'text', required: true, value: animal.name },
        {
          id: 'type',
          label: 'Animal Type',
          type: 'select',
          required: true,
          value: animal.type,
          options: [
            { value: 'cow', label: 'Cow' },
            { value: 'sheep', label: 'Sheep' },
            { value: 'goat', label: 'Goat' },
            { value: 'pig', label: 'Pig' },
            { value: 'chicken', label: 'Chicken' },
            { value: 'horse', label: 'Horse' },
            { value: 'other', label: 'Other' }
          ]
        },
        { id: 'breed', label: 'Breed', type: 'text', value: animal.breed || '' },
        { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', value: animal.date_of_birth || '' },
        { id: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1', value: animal.weight || '' },
        {
          id: 'gender',
          label: 'Gender',
          type: 'select',
          value: animal.gender || '',
          options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]
        },
        { id: 'tagNumber', label: 'Tag Number', type: 'text', value: animal.tag_number || '' }
      ];

      this.app.modal.createFormModal('Edit Animal', fields, async (data) => {
        try {
          const response = await this.api.updateAnimal(id, data);
          if (response.success) {
            this.app.showNotification('Animal updated successfully!', 'success');
            this.app.modal.close();
            this.load(); // Reload the list
          }
        } catch (error) {
          console.error('Failed to update animal:', error);
        }
      });
    } catch (error) {
      console.error('Failed to load animal for editing:', error);
      this.app.showNotification('Failed to load animal details', 'error');
    }
  }

  async viewDetails(id) {
    try {
      const response = await this.api.getAnimal(id);
      if (!response.success) {
        this.app.showNotification('Animal not found', 'error');
        return;
      }

      const animal = response.data;

      // Get calves and pregnancies
      const [calvesResponse, pregnanciesResponse] = await Promise.all([
        this.api.getAnimalCalves(id).catch(() => ({ success: true, data: [] })),
        this.api.getAnimalPregnancies(id).catch(() => ({ success: true, data: [] }))
      ]);

      const modalContent = `
        <div class="animal-details">
          <div class="animal-header">
            <h3>${animal.name}</h3>
            <span class="status-badge status-${animal.status}">${this.capitalizeFirst(animal.status)}</span>
          </div>

          <div class="details-grid">
            <div class="detail-item">
              <label>Type:</label>
              <span>${this.capitalizeFirst(animal.type)}</span>
            </div>
            <div class="detail-item">
              <label>Breed:</label>
              <span>${animal.breed || 'Not specified'}</span>
            </div>
            <div class="detail-item">
              <label>Age:</label>
              <span>${this.calculateAge(animal.date_of_birth)}</span>
            </div>
            <div class="detail-item">
              <label>Weight:</label>
              <span>${animal.weight ? animal.weight + ' kg' : 'Not recorded'}</span>
            </div>
            <div class="detail-item">
              <label>Gender:</label>
              <span>${animal.gender ? this.capitalizeFirst(animal.gender) : 'Not specified'}</span>
            </div>
            <div class="detail-item">
              <label>Tag Number:</label>
              <span>${animal.tag_number || 'Not assigned'}</span>
            </div>
          </div>

          ${calvesResponse.success && calvesResponse.data.length > 0 ? `
            <div class="related-section">
              <h4>Calves (${calvesResponse.data.length})</h4>
              <div class="calves-list">
                ${calvesResponse.data.map(calf => `
                  <div class="calf-item">
                    <strong>${calf.name || 'Unnamed'}</strong> -
                    Born: ${this.app.formatDate(calf.date_born)}
                    ${calf.nursing_duration ? `- Nursing: ${calf.nursing_duration} days` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${pregnanciesResponse.success && pregnanciesResponse.data.length > 0 ? `
            <div class="related-section">
              <h4>Pregnancies (${pregnanciesResponse.data.length})</h4>
              <div class="pregnancies-list">
                ${pregnanciesResponse.data.map(pregnancy => `
                  <div class="pregnancy-item">
                    <div class="pregnancy-info">
                      <strong>Due: ${this.app.formatDate(pregnancy.due_date)}</strong>
                      <span class="status-badge status-${pregnancy.delivery_status}">
                        ${this.capitalizeFirst(pregnancy.delivery_status)}
                      </span>
                    </div>
                    ${pregnancy.vet_name ? `<small>Assigned Vet: ${pregnancy.vet_name}</small>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      this.app.modal.open(`${animal.name} - Details`, modalContent);

    } catch (error) {
      console.error('Failed to load animal details:', error);
      this.app.showNotification('Failed to load animal details', 'error');
    }
  }

  async deleteAnimal(id) {
    if (!confirm('Are you sure you want to delete this animal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await this.api.deleteAnimal(id);
      if (response.success) {
        this.app.showNotification('Animal deleted successfully!', 'success');
        this.load(); // Reload the list
      }
    } catch (error) {
      console.error('Failed to delete animal:', error);
      this.app.showNotification('Failed to delete animal', 'error');
    }
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'Unknown';

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMs = today - birthDate;

    const years = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((ageInMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (years > 0) {
      return `${years}y ${months}m`;
    } else {
      return `${months}m`;
    }
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
