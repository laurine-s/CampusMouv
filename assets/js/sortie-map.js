/**
 * Gestionnaire de carte Leaflet pour le formulaire de sortie
 * Affiche la localisation du lieu sélectionné
 */

class SortieMapManager {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.defaultCenter = [48.1173, -1.6778]; // Rennes par défaut
        this.defaultZoom = 13;

        this.init();
    }

    /**
     * Initialisation de la carte
     */
    init() {
        console.log('🗺️ Initialisation SortieMapManager');

        // Attendre que Leaflet soit chargé
        this.waitForLeaflet(() => {
            this.initializeMap();
            this.setupEventListeners();
            console.log('✅ Carte Leaflet initialisée');
        });
    }

    /**
     * Attendre que Leaflet soit disponible
     */
    waitForLeaflet(callback, maxAttempts = 50) {
        let attempts = 0;

        const check = () => {
            attempts++;

            if (typeof L !== 'undefined') {
                console.log('✅ Leaflet chargé');
                callback();
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('❌ Timeout: Leaflet non disponible');
            }
        };

        check();
    }

    /**
     * Initialiser la carte Leaflet
     */
    initializeMap() {
        const mapContainer = document.getElementById('sortie-map');

        if (!mapContainer) {
            console.warn('❌ Container de carte non trouvé');
            return;
        }

        // Créer la carte
        this.map = L.map('sortie-map').setView(this.defaultCenter, this.defaultZoom);

        // Ajouter la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        console.log('🗺️ Carte créée avec succès');

        // Afficher le lieu initial si disponible
        this.updateMapFromCurrentSelection();
    }

    /**
     * Configurer les événements
     */
    setupEventListeners() {
        // Écouter les changements de lieu dans le formulaire principal
        const lieuSelect = document.querySelector('select[name*="lieu"]');

        if (lieuSelect) {
            lieuSelect.addEventListener('change', () => {
                console.log('🎯 Lieu changé, mise à jour de la carte');
                this.updateMapFromCurrentSelection();
            });
        }

        // Écouter aussi les événements personnalisés
        document.addEventListener('sortie:lieuChanged', (event) => {
            console.log('🎯 Événement lieu changé reçu:', event.detail);
            this.updateMapLocation(event.detail.lieu);
        });

        // Événement de redimensionnement
        window.addEventListener('resize', () => {
            if (this.map) {
                setTimeout(() => {
                    this.map.invalidateSize();
                }, 100);
            }
        });
    }

    /**
     * Mettre à jour la carte depuis la sélection actuelle
     */
    updateMapFromCurrentSelection() {
        const lieuSelect = document.querySelector('select[name*="lieu"]');

        if (!lieuSelect || !lieuSelect.value) {
            this.clearMap();
            return;
        }

        // Récupérer les données du lieu depuis SortieForm
        const lieuxData = this.getLieuxData();
        const lieu = lieuxData?.find(l => l.id == lieuSelect.value);

        if (lieu) {
            this.updateMapLocation(lieu);
        } else {
            console.warn('❌ Lieu non trouvé dans les données');
            this.clearMap();
        }
    }

    /**
     * Récupérer les données des lieux
     */
    getLieuxData() {
        // Essayer de récupérer depuis l'instance SortieForm
        if (window.sortieFormInstance && window.sortieFormInstance.lieuxData) {
            return window.sortieFormInstance.lieuxData;
        }

        // Fallback : récupérer depuis les attributs HTML
        const appDataElement = document.getElementById('app-data');
        if (appDataElement) {
            try {
                const lieuxString = appDataElement.getAttribute('data-lieux');
                return lieuxString ? JSON.parse(lieuxString) : [];
            } catch (error) {
                console.error('❌ Erreur parsing données lieux:', error);
                return [];
            }
        }

        return [];
    }

    /**
     * Mettre à jour la localisation sur la carte
     */
    async updateMapLocation(lieu) {
        if (!this.map || !lieu) return;

        console.log('📍 Mise à jour carte pour:', lieu.nom);

        try {
            // Construire l'adresse pour la géolocalisation
            const adresse = this.buildAddress(lieu);

            if (!adresse) {
                console.warn('❌ Adresse incomplète pour:', lieu.nom);
                this.clearMap();
                return;
            }

            // Géocoder l'adresse
            const coordinates = await this.geocodeAddress(adresse);

            if (coordinates) {
                this.showLocationOnMap(coordinates, lieu);
            } else {
                console.warn('❌ Géocodage échoué pour:', adresse);
                this.showDefaultLocation(lieu);
            }

        } catch (error) {
            console.error('❌ Erreur mise à jour carte:', error);
            this.showDefaultLocation(lieu);
        }
    }

    /**
     * Construire l'adresse complète
     */
    buildAddress(lieu) {
        const parts = [];

        if (lieu.rue) parts.push(lieu.rue);
        if (lieu.ville) parts.push(lieu.ville);

        return parts.length > 0 ? parts.join(', ') + ', France' : null;
    }

    /**
     * Géocoder une adresse
     */
    async geocodeAddress(adresse) {
        try {
            console.log('🔍 Géocodage de:', adresse);

            // Utiliser l'API de géocodage de Nominatim (OpenStreetMap)
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}&limit=1`;

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const coordinates = [parseFloat(result.lat), parseFloat(result.lon)];
                console.log('✅ Coordonnées trouvées:', coordinates);
                return coordinates;
            }

            return null;
        } catch (error) {
            console.error('❌ Erreur géocodage:', error);
            return null;
        }
    }

    /**
     * Afficher la localisation sur la carte
     */
    showLocationOnMap(coordinates, lieu) {
        // Supprimer le marqueur précédent
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Centrer la carte
        this.map.setView(coordinates, 15);

        // Ajouter un nouveau marqueur
        this.currentMarker = L.marker(coordinates)
            .addTo(this.map)
            .bindPopup(`
                <div class="lieu-popup">
                    <h4>${lieu.nom}</h4>
                    ${lieu.rue ? `<p><strong>Adresse:</strong> ${lieu.rue}</p>` : ''}
                    ${lieu.ville ? `<p><strong>Ville:</strong> ${lieu.ville}</p>` : ''}
                </div>
            `)
            .openPopup();

        console.log('✅ Marqueur ajouté pour:', lieu.nom);
    }

    /**
     * Afficher une localisation par défaut
     */
    showDefaultLocation(lieu) {
        // Afficher la région par défaut (centre de la France)
        const defaultCoords = [46.603354, 1.888334];
        this.map.setView(defaultCoords, 6);

        // Supprimer le marqueur précédent
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Ajouter un marqueur générique
        this.currentMarker = L.marker(defaultCoords)
            .addTo(this.map)
            .bindPopup(`
                <div class="lieu-popup">
                    <h4>${lieu.nom}</h4>
                    <p><em>Localisation approximative</em></p>
                    ${lieu.rue ? `<p><strong>Adresse:</strong> ${lieu.rue}</p>` : ''}
                    ${lieu.ville ? `<p><strong>Ville:</strong> ${lieu.ville}</p>` : ''}
                </div>
            `)
            .openPopup();
    }

    /**
     * Vider la carte
     */
    clearMap() {
        if (!this.map) return;

        // Supprimer le marqueur
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
            this.currentMarker = null;
        }

        // Revenir à la vue par défaut
        this.map.setView(this.defaultCenter, this.defaultZoom);
        console.log('🗺️ Carte réinitialisée');
    }

    /**
     * Redimensionner la carte
     */
    resizeMap() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    /**
     * Méthode publique pour mettre à jour depuis l'extérieur
     */
    updateFromExternalData(lieu) {
        this.updateMapLocation(lieu);
    }
}

// Initialisation
function initSortieMap() {
    if (window.sortieMapInstance) {
        console.log('SortieMap déjà initialisé');
        return;
    }

    // Attendre que le DOM soit prêt
    if (document.getElementById('sortie-map')) {
        window.sortieMapInstance = new SortieMapManager();
    } else {
        console.log('📍 Container carte non trouvé, carte désactivée');
    }
}

// Différentes méthodes d'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSortieMap);
} else {
    initSortieMap();
}

// Pour Turbo
document.addEventListener('turbo:load', initSortieMap);

// Backup window.onload
window.addEventListener('load', initSortieMap);