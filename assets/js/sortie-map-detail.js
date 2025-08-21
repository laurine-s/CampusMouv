// public/js/sortie-map-detail.js

(function () {
    const defaultCenter = [48.1173, -1.6778]; // Rennes par défaut
    const defaultZoom = 13;

    // Variable globale pour éviter la double initialisation
    let mapInstance = null;

    function waitForLeaflet(cb, attempts = 0) {
        if (typeof L !== 'undefined') return cb();
        if (attempts > 50) return console.error('❌ Timeout: Leaflet non disponible');
        setTimeout(() => waitForLeaflet(cb, attempts + 1), 100);
    }

    function geocode(address) {
        const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address);
        return fetch(url)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                }
                return null;
            })
            .catch(() => null);
    }

    function initMap() {
        const el = document.getElementById('sortie-map');
        if (!el) {
            console.warn('📍 Container carte non trouvé');
            return;
        }

        // CORRECTION 1: Vérifier si la carte existe déjà
        if (mapInstance) {
            console.log('🗺️ Carte déjà initialisée, nettoyage...');
            mapInstance.remove();
            mapInstance = null;
        }

        // CORRECTION 2: Vider le container au cas où
        el.innerHTML = '';

        const dataset = el.dataset || {};
        const nom = dataset.nom || 'Lieu';
        const rue = dataset.rue || '';
        const ville = dataset.ville || '';
        const cp = dataset.cp || '';

        // CORRECTION 3: Récupération améliorée des coordonnées
        let lat = null;
        let lng = null;

        if (dataset.lat && dataset.lng) {
            // Gérer les virgules françaises
            lat = parseFloat(dataset.lat.toString().replace(',', '.'));
            lng = parseFloat(dataset.lng.toString().replace(',', '.'));

            console.log('📍 Coordonnées récupérées du dataset:', { lat, lng });
            console.log('📍 Coordonnées brutes:', { rawLat: dataset.lat, rawLng: dataset.lng });
        }

        // Créer la carte
        mapInstance = L.map(el).setView(defaultCenter, defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        function showMarker(coords) {
            console.log('📍 Affichage marqueur aux coordonnées:', coords);
            mapInstance.setView(coords, 15);
            L.marker(coords)
                .addTo(mapInstance)
                .bindPopup(`
                    <div class="lieu-popup">
                        <h4>${nom}</h4>
                        ${rue ? `<p><strong>Adresse:</strong> ${rue}</p>` : ''}
                        ${ville || cp ? `<p><strong>Ville:</strong> ${cp ? cp + ' ' : ''}${ville}</p>` : ''}
                        <p><small>Lat: ${coords[0].toFixed(6)}, Lng: ${coords[1].toFixed(6)}</small></p>
                    </div>
                `)
                .openPopup();

            setTimeout(() => mapInstance.invalidateSize(), 100);
        }

        // CORRECTION 4: Validation stricte des coordonnées
        if (lat !== null && lng !== null &&
            !Number.isNaN(lat) && !Number.isNaN(lng) &&
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
            lat !== 0 && lng !== 0) {

            console.log('✅ Coordonnées valides trouvées:', { lat, lng });
            showMarker([lat, lng]);

        } else {
            console.log('⚠️ Coordonnées invalides ou manquantes, géocodage de secours');
            console.log('Détail validation:', {
                lat, lng,
                isNaN_lat: Number.isNaN(lat),
                isNaN_lng: Number.isNaN(lng),
                abs_lat: Math.abs(lat),
                abs_lng: Math.abs(lng),
                lat_valid: Math.abs(lat) <= 90,
                lng_valid: Math.abs(lng) <= 180
            });

            // Géocoder l'adresse si coords absentes ou invalides
            const parts = [];
            if (rue) parts.push(rue);
            if (cp) parts.push(cp);
            if (ville) parts.push(ville);
            const address = parts.length ? parts.join(', ') + ', France' : null;

            if (!address) {
                console.warn('❌ Adresse incomplète, affichage par défaut');
                mapInstance.setView(defaultCenter, defaultZoom);
                return;
            }

            console.log('🔍 Géocodage de l\'adresse:', address);
            geocode(address).then(coords => {
                if (coords) {
                    console.log('✅ Géocodage réussi:', coords);
                    showMarker(coords);
                } else {
                    console.log('❌ Géocodage échoué, vue par défaut');
                    mapInstance.setView(defaultCenter, defaultZoom);
                }
            });
        }

        // Resize safe
        window.addEventListener('resize', () => {
            if (mapInstance) {
                setTimeout(() => mapInstance.invalidateSize(), 100);
            }
        });
    }

    function boot() {
        if (document.getElementById('sortie-map')) {
            console.log('🚀 Initialisation de la carte détail');
            waitForLeaflet(initMap);
        }
    }

    // CORRECTION 5: Éviter les initialisations multiples
    let isBooted = false;

    function safeBoot() {
        if (isBooted) {
            console.log('⚠️ Carte déjà initialisée, ignoré');
            return;
        }
        isBooted = true;
        boot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeBoot);
    } else {
        safeBoot();
    }

    // Pour Turbo/navigation SPA
    document.addEventListener('turbo:load', () => {
        isBooted = false; // Reset pour permettre nouvelle initialisation
        setTimeout(safeBoot, 100);
    });

    // Cleanup global pour éviter les fuites mémoire
    window.addEventListener('beforeunload', () => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
    });

})();