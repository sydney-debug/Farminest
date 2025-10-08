// Farm360 Pro - API Helper Functions

class API {
  constructor(app) {
    this.app = app;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    return this.app.apiRequest(endpoint, options);
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication endpoints
  async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(userData) {
    return this.put('/auth/profile', userData);
  }

  // Dashboard endpoints
  async getDashboardOverview() {
    return this.get('/dashboard/overview');
  }

  async getAnimalStats() {
    return this.get('/dashboard/animal-stats');
  }

  async getCropStats() {
    return this.get('/dashboard/crop-stats');
  }

  async getFinancialSummary() {
    return this.get('/dashboard/financial-summary');
  }

  // Animals endpoints
  async getAnimals(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.get(`/animals?${queryString}`);
  }

  async getAnimal(id) {
    return this.get(`/animals/${id}`);
  }

  async createAnimal(animalData) {
    return this.post('/animals', animalData);
  }

  async updateAnimal(id, animalData) {
    return this.put(`/animals/${id}`, animalData);
  }

  async deleteAnimal(id) {
    return this.delete(`/animals/${id}`);
  }

  async getAnimalCalves(id) {
    return this.get(`/animals/${id}/calves`);
  }

  async getAnimalPregnancies(id) {
    return this.get(`/animals/${id}/pregnancies`);
  }

  async addPregnancy(id, pregnancyData) {
    return this.post(`/animals/${id}/pregnancies`, pregnancyData);
  }

  // Crops endpoints
  async getCrops(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.get(`/crops?${queryString}`);
  }

  async getCrop(id) {
    return this.get(`/crops/${id}`);
  }

  async createCrop(cropData) {
    return this.post('/crops', cropData);
  }

  async updateCrop(id, cropData) {
    return this.put(`/crops/${id}`, cropData);
  }

  async deleteCrop(id) {
    return this.delete(`/crops/${id}`);
  }

  async updateCropStatus(id, status) {
    return this.patch(`/crops/${id}/status`, { status });
  }

  async getCropYields(id) {
    return this.get(`/crops/${id}/yields`);
  }

  // Produce endpoints
  async getProduce(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.get(`/produce?${queryString}`);
  }

  async createProduce(produceData) {
    return this.post('/produce', produceData);
  }

  async getProduceStats() {
    return this.get('/produce/stats/summary');
  }

  // Customers endpoints
  async getCustomers() {
    return this.get('/sales/customers');
  }

  async getCustomer(id) {
    return this.get(`/sales/customers/${id}`);
  }

  async createCustomer(customerData) {
    return this.post('/sales/customers', customerData);
  }

  async updateCustomer(id, customerData) {
    return this.put(`/sales/customers/${id}`, customerData);
  }

  async deleteCustomer(id) {
    return this.delete(`/sales/customers/${id}`);
  }

  // Sales endpoints
  async getSales(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.get(`/sales?${queryString}`);
  }

  async createSale(saleData) {
    return this.post('/sales', saleData);
  }

  async updateSalePayment(id, paymentData) {
    return this.patch(`/sales/${id}/payment`, paymentData);
  }

  async getSalesSummary() {
    return this.get('/sales/summary');
  }

  // Health records endpoints
  async getHealthRecords(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.get(`/health?${queryString}`);
  }

  async createHealthRecord(recordData) {
    return this.post('/health', recordData);
  }

  // Veterinarians endpoints
  async getVeterinarians() {
    return this.get('/vets');
  }

  async getVeterinarian(id) {
    return this.get(`/vets/${id}`);
  }
}
