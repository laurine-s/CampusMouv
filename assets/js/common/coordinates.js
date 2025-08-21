/**
 * Gestionnaire des coordonnées GPS
 */

const Coordinates = {
    /**
     * Valider des coordonnées GPS
     */
    validate(lat, lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        return !isNaN(latNum) &&
            !isNaN(lngNum) &&
            Math.abs(latNum) <= 90 &&
            Math.abs(lngNum) <= 180 &&
            latNum !== 0 &&
            lngNum !== 0;
    },

    /**
     * Convertir les coordonnées au format base de données (virgule -> point)
     */
    formatForDatabase(coordinate) {
        return parseFloat(coordinate.toString().replace(',', '.')).toString();
    },

    /**
     * Convertir les coordonnées au format français (point -> virgule)
     */
    formatForDisplay(coordinate) {
        return parseFloat(coordinate).toFixed(6).replace('.', ',');
    },

    /**
     * Mettre à jour tous les champs de coordonnées
     */
    updateFields(latitude, longitude) {
        const latFormatted = this.formatForDatabase(latitude);
        const lngFormatted = this.formatForDatabase(longitude);

        // Champs d'affichage (avec virgules)
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        if (latDisplay) latDisplay.value = this.formatForDisplay(latitude);
        if (lngDisplay) lngDisplay.value = this.formatForDisplay(longitude);

        // Champs Symfony (avec points)
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        if (latInput) latInput.value = latFormatted;
        if (lngInput) lngInput.value = lngFormatted;

        // Créer des champs cachés
        this.createHiddenFields(latFormatted, lngFormatted);
    },

    /**
     * Créer des champs cachés pour les coordonnées
     */
    createHiddenFields(latitude, longitude) {
        const form = document.getElementById('lieu-form');
        if (!form) return;

        const fields = [
            { name: 'coordinates_latitude', value: latitude },
            { name: 'coordinates_longitude', value: longitude }
        ];

        Utils.createHiddenFields(form, fields);
    },

    /**
     * Vérifier si on a des coordonnées précises (plus de 4 décimales)
     */
    hasPreciseCoordinates() {
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        if (!latDisplay?.value || !lngDisplay?.value) {
            return false;
        }

        const lat = parseFloat(latDisplay.value.replace(',', '.'));
        const lng = parseFloat(lngDisplay.value.replace(',', '.'));

        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }

        const latDecimals = lat.toString().split('.')[1]?.length || 0;
        const lngDecimals = lng.toString().split('.')[1]?.length || 0;

        return latDecimals > 4 || lngDecimals > 4;
    },

    /**
     * Récupérer les coordonnées depuis les champs du formulaire
     */
    getFromForm() {
        // Priorité aux champs Symfony
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        if (latInput?.value && lngInput?.value) {
            return {
                latitude: this.formatForDatabase(latInput.value),
                longitude: this.formatForDatabase(lngInput.value)
            };
        }

        // Sinon, utiliser les champs d'affichage
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        if (latDisplay?.value && lngDisplay?.value) {
            return {
                latitude: this.formatForDatabase(latDisplay.value),
                longitude: this.formatForDatabase(lngDisplay.value)
            };
        }

        return null;
    },

    /**
     * S'assurer que les coordonnées sont dans le FormData
     */
    ensureInFormData(formData) {
        const coords = this.getFromForm();

        if (!coords) return false;

        const latNum = parseFloat(coords.latitude);
        const lngNum = parseFloat(coords.longitude);

        if (!this.validate(latNum, lngNum)) {
            return false;
        }

        // Déterminer les noms des champs
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        const latFieldName = latInput?.name || 'lieu[latitude]';
        const lngFieldName = lngInput?.name || 'lieu[longitude]';

        // Mettre à jour le FormData
        formData.set(latFieldName, coords.latitude);
        formData.set(lngFieldName, coords.longitude);

        return true;
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Coordinates;
} else {
    window.Coordinates = Coordinates;
}