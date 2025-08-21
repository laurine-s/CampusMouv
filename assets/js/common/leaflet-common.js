/**
 * Fonctions communes pour les cartes Leaflet
 */

const LeafletCommon = {
    // Configuration par défaut
    defaultCenter: [48.1173, -1.6778], // Rennes
    defaultZoom: 13,

    // Configuration des tuiles OpenStreetMap
    tileConfig: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }
    },

    /**
     * Attendre que Leaflet soit chargé
     */
    waitForLeaflet(callback) {
        Utils.waitFor(() => typeof L !== 'undefined', callback);
    },

    /**
     * Créer une carte Leaflet de base
     */
    createMap(containerId, center = null, zoom = null) {
        const mapCenter = center || this.defaultCenter;
        const mapZoom = zoom || this.defaultZoom;

        const map = L.map(containerId).setView(mapCenter, mapZoom);

        L.tileLayer(this.tileConfig.url, this.tileConfig.options).addTo(map);

        return map;
    },

    /**
     * Géocoder une adresse avec Nominatim
     */
    async geocode(address) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;

            const response = await Utils.fetchData(url);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }

            return null;
        } catch (error) {
            console.error('Erreur de géocodage:', error);
            return null;
        }
    },

    /**
     * Créer un marqueur avec popup
     */
    createMarker(coordinates, popupContent) {
        const marker = L.marker(coordinates);

        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        return marker;
    },

    /**
     * Créer le contenu d'une popup pour un lieu
     */
    createPopupContent(lieu, coordinates = null) {
        let content = '<div class="lieu-popup">';

        if (lieu.nom) {
            content += `<h4>${lieu.nom}</h4>`;
        }

        if (lieu.rue) {
            content += `<p><strong>Adresse:</strong> ${lieu.rue}</p>`;
        }

        if (lieu.ville || lieu.codePostal || lieu.cp) {
            const ville = lieu.ville || '';
            const cp = lieu.codePostal || lieu.cp || '';
            content += `<p><strong>Ville:</strong> ${cp ? cp + ' ' : ''}${ville}</p>`;
        }

        if (coordinates) {
            content += `<p><small>GPS: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}</small></p>`;
        }

        content += '</div>';

        return content;
    },

    /**
     * Nettoyer une carte (supprimer marqueurs, reset vue)
     */
    clearMap(map, currentMarker = null) {
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        map.setView(this.defaultCenter, this.defaultZoom);
    },

    /**
     * Configurer le redimensionnement automatique
     */
    setupResize(map) {
        window.addEventListener('resize', () => {
            setTimeout(() => map.invalidateSize(), 100);
        });
    },

    /**
     * Récupérer des coordonnées depuis un dataset
     */
    getCoordinatesFromDataset(element) {
        const dataset = element.dataset || {};

        if (!dataset.lat || !dataset.lng) {
            return null;
        }

        // Gérer les virgules françaises
        const lat = parseFloat(dataset.lat.toString().replace(',', '.'));
        const lng = parseFloat(dataset.lng.toString().replace(',', '.'));

        if (Coordinates.validate(lat, lng)) {
            return [lat, lng];
        }

        return null;
    },

    /**
     * Construire une adresse complète pour le géocodage
     */
    buildAddress(lieu) {
        const parts = [];

        if (lieu.rue) parts.push(lieu.rue);
        if (lieu.ville) parts.push(lieu.ville);
        if (lieu.cp && !lieu.ville) parts.push(lieu.cp); // Code postal seulement si pas de ville

        return parts.length > 0 ? parts.join(', ') + ', France' : null;
    },

    /**
     * Afficher un lieu sur la carte (avec coordonnées ou géocodage)
     */
    async showLocation(map, lieu, currentMarker = null) {
        // Supprimer l'ancien marqueur
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }

        let coordinates = null;

        // Essayer d'utiliser les coordonnées GPS directes
        if (lieu.latitude && lieu.longitude) {
            const lat = parseFloat(lieu.latitude);
            const lng = parseFloat(lieu.longitude);

            if (Coordinates.validate(lat, lng)) {
                coordinates = [lat, lng];
            }
        }

        // Sinon, géocoder l'adresse
        if (!coordinates) {
            const address = this.buildAddress(lieu);
            if (address) {
                coordinates = await this.geocode(address);
            }
        }

        // Afficher le marqueur
        if (coordinates) {
            map.setView(coordinates, 15);

            const popupContent = this.createPopupContent(lieu, coordinates);
            currentMarker = this.createMarker(coordinates, popupContent);
            currentMarker.addTo(map).openPopup();

            return currentMarker;
        } else {
            // Vue par défaut si aucune localisation trouvée
            map.setView(this.defaultCenter, this.defaultZoom);
            return null;
        }
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeafletCommon;
} else {
    window.LeafletCommon = LeafletCommon;
}