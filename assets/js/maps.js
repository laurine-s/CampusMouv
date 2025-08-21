/**
 * Gestionnaire unifié des cartes Leaflet - VERSION ES5
 */

/**
 * Classe pour les cartes de détail (affichage simple)
 */
function MapDetail(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.currentMarker = null;

    this.init();
}

MapDetail.prototype.init = function() {
    var self = this;
    LeafletCommon.waitForLeaflet(function() {
        self.initializeMap();
        self.loadLocationFromDataset();
    });
};

MapDetail.prototype.initializeMap = function() {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    // Nettoyer le container si nécessaire
    if (this.map) {
        this.map.remove();
        this.map = null;
    }
    container.innerHTML = '';

    this.map = LeafletCommon.createMap(this.containerId);
    LeafletCommon.setupResize(this.map);
};

MapDetail.prototype.loadLocationFromDataset = function() {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var dataset = container.dataset || {};
    var lieu = {
        nom: dataset.nom || 'Lieu',
        rue: dataset.rue || '',
        ville: dataset.ville || '',
        cp: dataset.cp || '',
        latitude: dataset.lat,
        longitude: dataset.lng
    };

    this.showLocation(lieu);
};

MapDetail.prototype.showLocation = function(lieu) {
    if (!this.map) return;

    var self = this;
    // Essayer les coordonnées du dataset
    var container = document.getElementById(this.containerId);
    var coordinates = LeafletCommon.getCoordinatesFromDataset(container);

    if (coordinates) {
        this.displayMarker(coordinates, lieu);
    } else {
        // Géocoder l'adresse
        var address = LeafletCommon.buildAddress(lieu);
        if (address) {
            LeafletCommon.geocode(address).then(function(coords) {
                if (coords) {
                    self.displayMarker(coords, lieu);
                } else {
                    self.map.setView(LeafletCommon.defaultCenter, LeafletCommon.defaultZoom);
                }
            }).catch(function(error) {
                console.error('Erreur géocodage:', error);
                self.map.setView(LeafletCommon.defaultCenter, LeafletCommon.defaultZoom);
            });
        }
    }
};

MapDetail.prototype.displayMarker = function(coordinates, lieu) {
    var self = this;

    // Supprimer l'ancien marqueur
    if (this.currentMarker) {
        this.map.removeLayer(this.currentMarker);
    }

    // Centrer et afficher
    this.map.setView(coordinates, 15);

    var popupContent = LeafletCommon.createPopupContent(lieu, coordinates);
    this.currentMarker = LeafletCommon.createMarker(coordinates, popupContent);
    this.currentMarker.addTo(this.map).openPopup();

    setTimeout(function() {
        if (self.map) {
            self.map.invalidateSize();
        }
    }, 100);
};

/**
 * Classe pour les cartes interactives (formulaires)
 */
function MapManager(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.currentMarker = null;

    this.init();
}

MapManager.prototype.init = function() {
    var self = this;
    LeafletCommon.waitForLeaflet(function() {
        self.initializeMap();
        self.setupEventListeners();
    });
};

MapManager.prototype.initializeMap = function() {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    this.map = LeafletCommon.createMap(this.containerId);
    LeafletCommon.setupResize(this.map);

    this.updateMapFromCurrentSelection();
};

MapManager.prototype.setupEventListeners = function() {
    var self = this;

    // Écouter les changements de lieu dans le formulaire
    var lieuSelect = document.querySelector('select[name*="lieu"]');
    if (lieuSelect) {
        lieuSelect.addEventListener('change', function() {
            self.updateMapFromCurrentSelection();
        });
    }

    // Écouter les événements personnalisés
    document.addEventListener('sortie:lieuChanged', function(event) {
        self.updateMapLocation(event.detail.lieu);
    });
};

MapManager.prototype.updateMapFromCurrentSelection = function() {
    var lieuSelect = document.querySelector('select[name*="lieu"]');

    if (!lieuSelect || !lieuSelect.value) {
        this.clearMap();
        return;
    }

    var lieuxData = this.getLieuxData();
    var lieu = null;

    if (lieuxData) {
        for (var i = 0; i < lieuxData.length; i++) {
            if (lieuxData[i].id == lieuSelect.value) {
                lieu = lieuxData[i];
                break;
            }
        }
    }

    if (lieu) {
        this.updateMapLocation(lieu);
    } else {
        this.clearMap();
    }
};

MapManager.prototype.getLieuxData = function() {
    // Depuis l'instance SortieForm
    if (window.sortieFormInstance && window.sortieFormInstance.lieuxData) {
        return window.sortieFormInstance.lieuxData;
    }

    // Depuis les attributs HTML
    var appDataElement = document.getElementById('app-data');
    if (appDataElement) {
        try {
            var lieuxString = appDataElement.getAttribute('data-lieux');
            return lieuxString ? JSON.parse(lieuxString) : [];
        } catch (error) {
            console.error('Erreur parsing données lieux:', error);
            return [];
        }
    }

    return [];
};

MapManager.prototype.updateMapLocation = function(lieu) {
    if (!this.map || !lieu) return;

    var self = this;
    LeafletCommon.showLocation(this.map, lieu, this.currentMarker).then(function(marker) {
        self.currentMarker = marker;
    }).catch(function(error) {
        console.error('Erreur mise à jour carte:', error);
    });
};

MapManager.prototype.clearMap = function() {
    if (!this.map) return;
    LeafletCommon.clearMap(this.map, this.currentMarker);
    this.currentMarker = null;
};

// Méthodes publiques pour compatibilité
MapManager.prototype.updateFromExternalData = function(lieu) {
    this.updateMapLocation(lieu);
};

MapManager.prototype.updateFromCoordinates = function(lieu) {
    if (!this.map || !lieu) return;

    var lat = parseFloat(lieu.latitude);
    var lng = parseFloat(lieu.longitude);

    if (!Coordinates.validate(lat, lng)) {
        console.error('Coordonnées GPS invalides:', { lat: lat, lng: lng });
        return;
    }

    // Effacer les marqueurs existants
    if (this.currentMarker) {
        this.map.removeLayer(this.currentMarker);
    }

    // Centrer la carte
    this.map.setView([lat, lng], 16);

    // Créer le marqueur
    var popupContent = LeafletCommon.createPopupContent(lieu, [lat, lng]);
    this.currentMarker = LeafletCommon.createMarker([lat, lng], popupContent);
    this.currentMarker.addTo(this.map).openPopup();
};

MapManager.prototype.resizeMap = function() {
    if (this.map) {
        this.map.invalidateSize();
    }
};

/**
 * Fonctions d'initialisation
 */

/**
 * Initialiser une carte de détail
 */
function initMapDetail() {
    var container = document.getElementById('sortie-map');
    if (container && !window.mapDetailInstance) {
        window.mapDetailInstance = new MapDetail('sortie-map');

        // Cleanup pour éviter les fuites mémoire
        window.addEventListener('beforeunload', function() {
            if (window.mapDetailInstance && window.mapDetailInstance.map) {
                window.mapDetailInstance.map.remove();
                window.mapDetailInstance = null;
            }
        });
    }
}

/**
 * Initialiser une carte interactive (formulaire)
 */
function initMapManager() {
    var container = document.getElementById('sortie-map');
    if (container && !window.sortieMapInstance) {
        window.sortieMapInstance = new MapManager('sortie-map');
    }
}

/**
 * Initialisation automatique selon le contexte
 */
function initMaps() {
    var container = document.getElementById('sortie-map');
    if (!container) return;

    // Détecter le type de page selon la présence d'éléments
    var isFormPage = document.querySelector('select[name*="lieu"]') ||
        document.getElementById('sortie-form');

    if (isFormPage) {
        initMapManager();
    } else {
        initMapDetail();
    }
}

// Initialisation avec gestion des différents événements de chargement
Utils.initializeWhenReady(initMaps);

// Export des classes pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MapDetail: MapDetail,
        MapManager: MapManager,
        initMapDetail: initMapDetail,
        initMapManager: initMapManager,
        initMaps: initMaps
    };
} else {
    window.MapDetail = MapDetail;
    window.MapManager = MapManager;
    window.initMapDetail = initMapDetail;
    window.initMapManager = initMapManager;
}