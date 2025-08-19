// public/js/sortie-map-detail.js

(function () {
    const defaultCenter = [48.1173, -1.6778]; // Rennes par défaut
    const defaultZoom = 13;

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

        const dataset = el.dataset || {};
        const nom = dataset.nom || 'Lieu';
        const rue = dataset.rue || '';
        const ville = dataset.ville || '';
        const cp = dataset.cp || '';
        const lat = dataset.lat ? parseFloat(dataset.lat) : null;
        const lng = dataset.lng ? parseFloat(dataset.lng) : null;

        const map = L.map(el).setView(defaultCenter, defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        function showMarker(coords) {
            map.setView(coords, 15);
            L.marker(coords)
                .addTo(map)
                .bindPopup(`
          <div class="lieu-popup">
            <h4>${nom}</h4>
            ${rue ? `<p><strong>Adresse:</strong> ${rue}</p>` : ''}
            ${ville || cp ? `<p><strong>Ville:</strong> ${cp ? cp + ' ' : ''}${ville}</p>` : ''}
          </div>
        `)
                .openPopup();
            setTimeout(() => map.invalidateSize(), 100); // au cas où le conteneur se redimensionne
        }

        if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
            // ✅ On a les coordonnées : on affiche direct
            showMarker([lat, lng]);
        } else {
            // 🧭 Secours : géocoder l’adresse si coords absentes
            const parts = [];
            if (rue) parts.push(rue);
            if (cp) parts.push(cp);
            if (ville) parts.push(ville);
            const address = parts.length ? parts.join(', ') + ', France' : null;

            if (!address) {
                console.warn('❌ Adresse incomplète, affichage par défaut');
                map.setView(defaultCenter, defaultZoom);
                return;
            }

            geocode(address).then(coords => {
                if (coords) showMarker(coords);
                else map.setView(defaultCenter, defaultZoom);
            });
        }

        // Resize safe
        window.addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 100));
        document.addEventListener('turbo:load', () => setTimeout(() => map.invalidateSize(), 100));
    }

    function boot() {
        if (document.getElementById('sortie-map')) {
            waitForLeaflet(initMap);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.addEventListener('load', boot);
})();
