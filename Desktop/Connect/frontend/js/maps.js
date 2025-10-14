/**
 * Maps and Location JavaScript for FarmTrak 360
 * Handles GPS tracking and mapping features
 */

let farmMap;

async function loadMaps() {
    try {
        await initializeMap();
        await loadFarmLocations();
        setupMapEventListeners();
        app.showToast('Maps page loaded', 'info');
    } catch (error) {
        console.error('Failed to load maps page:', error);
        app.showToast('Failed to load maps', 'error');
    }
}

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    const mapContainer = app.getElement('farmMap');
    if (!mapContainer) return;

    // Initialize map centered on Kenya (example location)
    farmMap = L.map('farmMap').setView([-1.2921, 36.8219], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(farmMap);

    // Add marker for user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                L.marker([latitude, longitude])
                    .bindPopup('Your Location')
                    .addTo(farmMap);
            },
            (error) => {
                console.warn('Geolocation error:', error);
            }
        );
    }
}

/**
 * Load farm locations on map
 */
async function loadFarmLocations() {
    try {
        const response = await app.apiRequest('/farms');
        const farms = response.farms || [];

        farms.forEach(farm => {
            if (farm.latitude && farm.longitude) {
                const marker = L.marker([farm.latitude, farm.longitude])
                    .bindPopup(`
                        <strong>${farm.name}</strong><br>
                        ${farm.location}<br>
                        ${farm.area_hectares} hectares<br>
                        <a href="#" onclick="showFarmDetails('${farm.id}')">View Details</a>
                    `)
                    .addTo(farmMap);

                // Add circle for farm area (approximate)
                if (farm.area_hectares) {
                    const radius = Math.sqrt(farm.area_hectares * 10000 / Math.PI); // Approximate radius in meters
                    L.circle([farm.latitude, farm.longitude], {
                        radius: radius,
                        color: 'green',
                        fillOpacity: 0.1,
                        weight: 2
                    }).addTo(farmMap);
                }
            }
        });

    } catch (error) {
        console.error('Failed to load farm locations:', error);
    }
}

/**
 * Setup map event listeners
 */
function setupMapEventListeners() {
    // Show farms button
    const showFarmsBtn = app.getElement('showFarmsBtn');
    if (showFarmsBtn) {
        showFarmsBtn.addEventListener('click', () => {
            if (farmMap) {
                farmMap.setView([-1.2921, 36.8219], 10);
            }
        });
    }

    // Show livestock button
    const showLivestockBtn = app.getElement('showLivestockBtn');
    if (showLivestockBtn) {
        showLivestockBtn.addEventListener('click', () => {
            loadLivestockLocations();
        });
    }

    // Locate me button
    const locateMeBtn = app.getElement('locateMeBtn');
    if (locateMeBtn) {
        locateMeBtn.addEventListener('click', () => {
            if (navigator.geolocation && farmMap) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        farmMap.setView([latitude, longitude], 15);
                        L.marker([latitude, longitude])
                            .bindPopup('You are here')
                            .addTo(farmMap);
                    },
                    (error) => {
                        app.showToast('Unable to get your location', 'error');
                    }
                );
            }
        });
    }
}

/**
 * Load livestock locations on map
 */
async function loadLivestockLocations() {
    try {
        const response = await app.apiRequest('/livestock');
        const livestock = response.livestock || [];

        livestock.forEach(animal => {
            if (animal.latitude && animal.longitude) {
                L.marker([animal.latitude, animal.longitude])
                    .bindPopup(`
                        <strong>${animal.name || animal.tag_number}</strong><br>
                        Species: ${animal.species}<br>
                        Health: ${animal.health_status}<br>
                        <a href="#" onclick="showLivestockDetails('${animal.id}')">View Details</a>
                    `)
                    .addTo(farmMap);
            }
        });

        app.showToast(`Loaded ${livestock.length} livestock locations`, 'success');

    } catch (error) {
        console.error('Failed to load livestock locations:', error);
        app.showToast('Failed to load livestock locations', 'error');
    }
}

/**
 * Show farm details (placeholder)
 */
function showFarmDetails(farmId) {
    app.showToast(`Farm details for ${farmId}`, 'info');
}

/**
 * Show livestock details (placeholder)
 */
function showLivestockDetails(livestockId) {
    app.showToast(`Livestock details for ${livestockId}`, 'info');
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadMaps
    };
}
