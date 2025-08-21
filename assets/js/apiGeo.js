// Script d'autocomplétion pour les adresses et villes - VERSION CORRIGÉE
(function () {
    'use strict';

    let currentSuggestions = [];
    let selectedIndex = -1;
    let currentType = '';
    let debounceVille = null;
    let debounceAdresse = null;

    // Variables pour éviter les conflits
    let isSelectingFromAdresse = false;
    let lastSelectedVille = null;

    // Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🚀 Initialisation autocomplétion');
        setupEventListeners();
        setupFormValidation();
    });

    function setupEventListeners() {
        // Input recherche ville
        const villeInput = document.getElementById('ville-search');
        if (villeInput) {
            villeInput.addEventListener('input', handleVilleInput);
            villeInput.addEventListener('keydown', handleKeydown);
        }

        // Input recherche adresse
        const adresseInput = document.getElementById('adresse-search');
        if (adresseInput) {
            adresseInput.addEventListener('input', handleAdresseInput);
            adresseInput.addEventListener('keydown', handleKeydown);
        }

        // Fermer suggestions au clic extérieur
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.autocomplete-container')) {
                hideAllSuggestions();
            }
        });
    }

    function setupFormValidation() {
        const form = document.getElementById('lieu-form');
        const villeSelect = document.querySelector('select[id*="ville"]');

        if (!form || !villeSelect) return;

        // Solution moderne : écouter l'événement 'invalid' des champs cachés
        villeSelect.addEventListener('invalid', function (e) {
            e.preventDefault();
            console.log('⚠️ Validation échouée pour le champ ville');
            showValidationError('Veuillez sélectionner une ville dans la liste des suggestions.');

            const villeSearchInput = document.getElementById('ville-search');
            if (villeSearchInput) {
                villeSearchInput.focus();
                villeSearchInput.style.borderColor = '#dc3545';
                villeSearchInput.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';

                setTimeout(function () {
                    villeSearchInput.style.borderColor = '';
                    villeSearchInput.style.boxShadow = '';
                }, 3000);
            }
        });

        // Ajouter un bouton de debug
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Formulaire';
        debugButton.type = 'button';
        debugButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; background: #007bff; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 12px;';
        debugButton.addEventListener('click', function () {
            console.log('=== DEBUG FORMULAIRE ===');
            console.log('🏙️ Input ville:', document.getElementById('ville-search')?.value);
            console.log('📋 Select ville value:', villeSelect?.value);
            console.log('📋 Select ville text:', villeSelect?.selectedOptions[0]?.textContent);
            console.log('🏠 Input rue:', document.querySelector('input[id*="rue"]')?.value);
            console.log('📍 Latitude:', document.querySelector('input[id*="latitude"]')?.value);
            console.log('📍 Longitude:', document.querySelector('input[id*="longitude"]')?.value);
            console.log('🔄 Dernière ville sélectionnée:', lastSelectedVille);
            console.log('✅ Validation passerait:', validateRequiredFields());
        });
        document.body.appendChild(debugButton);

        // Validation avant soumission
        form.addEventListener('submit', function (e) {
            if (!validateRequiredFields()) {
                e.preventDefault();
                return false;
            }
        });
    }

    function validateRequiredFields() {
        const villeSearchInput = document.getElementById('ville-search');

        console.log('🔍 Validation des champs requis...');

        // Vérifier qu'une ville a été sélectionnée
        if (!villeSearchInput || !villeSearchInput.value.trim()) {
            console.log('❌ Validation échouée: aucune ville saisie');
            showValidationError('Veuillez sélectionner une ville dans la liste des suggestions.');

            if (villeSearchInput) {
                villeSearchInput.focus();
                villeSearchInput.style.borderColor = '#dc3545';
                villeSearchInput.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            }
            return false;
        }

        // Vérifier qu'on a bien les données de ville
        const form = document.getElementById('lieu-form');
        const villeNomField = form.querySelector('input[name="ville_nom"]');
        const villeCodePostalField = form.querySelector('input[name="ville_code_postal"]');

        if (!villeNomField || !villeNomField.value || !villeCodePostalField || !villeCodePostalField.value) {
            console.log('❌ Validation échouée: données de ville manquantes');
            showValidationError('Veuillez sélectionner une ville dans la liste des suggestions (pas de saisie libre).');

            if (villeSearchInput) {
                villeSearchInput.focus();
                villeSearchInput.style.borderColor = '#dc3545';
                villeSearchInput.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            }
            return false;
        }

        console.log('✅ Validation réussie');
        return true;
    }

    function showValidationError(message) {
        let errorDiv = document.getElementById('validation-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'validation-error';
            errorDiv.style.cssText = `
                background-color: #f8d7da;
                color: #721c24;
                padding: 12px;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                margin-bottom: 16px;
                font-size: 14px;
            `;

            const form = document.getElementById('lieu-form');
            if (form && form.firstChild) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        setTimeout(function () {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    // ===== GESTION VILLE =====
    function handleVilleInput(e) {
        const value = e.target.value;

        // Supprimer les anciens champs cachés si l'utilisateur modifie
        if (!isSelectingFromAdresse) {
            const form = document.getElementById('lieu-form');
            const oldFields = form.querySelectorAll('input[name^="ville_"]');
            oldFields.forEach(field => field.remove());
            lastSelectedVille = null;
        }

        clearTimeout(debounceVille);

        const errorDiv = document.getElementById('validation-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';

        if (value.length < 2) {
            hideSuggestions('ville');
            return;
        }

        debounceVille = setTimeout(function () {
            searchVille(value);
        }, 300);
    }

    function searchVille(query) {
        console.log('🔍 Recherche ville:', query);
        showLoading('ville');

        let url;

        if (/^\d+$/.test(query)) {
            if (query.length <= 2) {
                const codeDep = query.padStart(2, '0');
                url = `https://geo.api.gouv.fr/departements/${codeDep}/communes?fields=nom,code,codesPostaux,departement&limit=50`;
            } else {
                url = `https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,departement&limit=100`;
            }
        } else {
            url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,departement&boost=population&limit=30`;
        }

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(function (data) {
                if (/^\d{3,}$/.test(query)) {
                    data = data.filter(function (commune) {
                        return commune.codesPostaux && commune.codesPostaux.some(function (cp) {
                            return cp.startsWith(query);
                        });
                    });
                }

                console.log('📊 Résultats ville:', data.length);
                showVilleSuggestions(data);
            })
            .catch(function (error) {
                console.error('❌ Erreur recherche ville:', error);
                showError('ville');
            });
    }

    function showVilleSuggestions(data) {
        const container = document.getElementById('ville-suggestions');
        if (!container) return;

        currentSuggestions = data.slice(0, 8);
        currentType = 'ville';
        selectedIndex = -1;

        if (currentSuggestions.length === 0) {
            container.innerHTML = '<div class="loading">Aucun résultat trouvé</div>';
        } else {
            let html = '';
            currentSuggestions.forEach(function (item, index) {
                const codesPostaux = item.codesPostaux ? item.codesPostaux.join(', ') : '';
                const departement = item.departement ? item.departement.nom : '';

                html += `
                    <div class="autocomplete-suggestion" onclick="selectVille(${index})">
                        <div class="suggestion-main">${item.nom}</div>
                        <div class="suggestion-details">${codesPostaux} - ${departement}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        container.style.display = 'block';
    }

    function selectVille(index) {
        const item = currentSuggestions[index];
        if (!item) return;

        console.log('🎯 Ville sélectionnée:', item);

        lastSelectedVille = {
            nom: item.nom,
            codesPostaux: item.codesPostaux,
            departement: item.departement,
            code: item.code
        };

        // Remplir l'input de recherche
        const villeInput = document.getElementById('ville-search');
        if (villeInput) {
            villeInput.value = item.nom;
        }

        // Créer des champs cachés pour envoyer au contrôleur
        createHiddenVilleFields(item);

        // Remplir les champs d'affichage
        fillLocationDetails(item);

        // MODIFICATION CRITIQUE: Vérifier si on a déjà des coordonnées précises d'adresse
        const hasAddressCoordinates = checkIfHasAddressCoordinates();

        if (hasAddressCoordinates) {
            console.log('🛡️ PROTECTION: Coordonnées d\'adresse précises détectées - pas de récupération centre-ville');
            console.log('📍 Coordonnées précises préservées');
        } else {
            console.log('🌍 Aucune coordonnée précise - récupération centre-ville autorisée');
            setTimeout(function() {
                searchCoordinatesForVille(item);
            }, 100);
        }

        // Cacher le message d'erreur
        const errorDiv = document.getElementById('validation-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        hideSuggestions('ville');
        console.log('✅ Ville configurée pour envoi au serveur');
    }

    function checkIfHasAddressCoordinates() {
        // Vérifier les champs d'affichage pour voir si on a des coordonnées précises
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        if (!latDisplay?.value || !lngDisplay?.value) {
            return false;
        }

        // Convertir les valeurs (remplacer virgules par points)
        const lat = parseFloat(latDisplay.value.replace(',', '.'));
        const lng = parseFloat(lngDisplay.value.replace(',', '.'));

        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }

        // Vérifier la précision : si on a plus de 4 décimales, c'est probablement une adresse précise
        const latString = lat.toString();
        const lngString = lng.toString();

        const latDecimals = latString.split('.')[1]?.length || 0;
        const lngDecimals = lngString.split('.')[1]?.length || 0;

        const isPrecise = latDecimals > 4 || lngDecimals > 4;

        console.log('🔍 Analyse précision coordonnées:', {
            lat, lng,
            latDecimals, lngDecimals,
            isPrecise,
            criteria: 'Plus de 4 décimales = adresse précise'
        });

        return isPrecise;
    }

    function createHiddenVilleFields(villeData) {
        const form = document.getElementById('lieu-form');
        if (!form) return;

        // Supprimer les anciens champs cachés s'ils existent
        const oldFields = form.querySelectorAll('input[name^="ville_"]');
        oldFields.forEach(field => field.remove());

        // Créer les nouveaux champs cachés
        const fields = [
            {
                name: 'ville_nom',
                value: villeData.nom
            },
            {
                name: 'ville_code_postal',
                value: villeData.codesPostaux && villeData.codesPostaux.length > 0 ? villeData.codesPostaux[0] : ''
            },
            {
                name: 'ville_departement',
                value: villeData.departement ? villeData.departement.nom : ''
            },
            {
                name: 'ville_code_insee',
                value: villeData.code || ''
            }
        ];

        fields.forEach(fieldData => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = fieldData.name;
            hiddenField.value = fieldData.value;
            form.appendChild(hiddenField);

            console.log('📝 Champ caché créé:', fieldData.name, '=', fieldData.value);
        });
    }


    function fillLocationDetails(item) {
        // Code postal
        const codePostalInput = document.getElementById('codePostal');
        if (codePostalInput && item.codesPostaux && item.codesPostaux.length > 0) {
            codePostalInput.value = item.codesPostaux[0];
        }

        // Département
        const departementInput = document.getElementById('departement');
        if (departementInput && item.departement) {
            departementInput.value = item.departement.nom;
        }
    }

    // NOUVELLE FONCTION: Rechercher les coordonnées d'une ville
    function searchCoordinatesForVille(villeItem) {
        if (!villeItem || !villeItem.code) return;

        console.log('🌍 Recherche coordonnées pour la ville:', villeItem.nom);

        const url = `https://geo.api.gouv.fr/communes/${villeItem.code}?fields=centre&format=json`;

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(function (data) {
                if (data.centre && data.centre.coordinates) {
                    const coords = data.centre.coordinates;
                    const longitude = coords[0];
                    const latitude = coords[1];

                    console.log('📍 Coordonnées ville trouvées:', {latitude, longitude});
                    updateCoordinates(latitude, longitude);
                }
            })
            .catch(function (error) {
                console.error('❌ Erreur récupération coordonnées ville:', error);
            });
    }

    // ===== GESTION ADRESSE =====
    function handleAdresseInput(e) {
        const value = e.target.value;

        clearTimeout(debounceAdresse);

        if (value.length < 3) {
            hideSuggestions('adresse');
            return;
        }

        debounceAdresse = setTimeout(function () {
            searchAdresse(value);
        }, 300);
    }

    function searchAdresse(query) {
        console.log('🔍 Recherche adresse:', query);
        showLoading('adresse');

        // Améliorer la requête avec la ville si disponible
        let searchQuery = query;
        const villeInput = document.getElementById('ville-search');
        if (villeInput && villeInput.value.trim() && !isSelectingFromAdresse) {
            searchQuery += ' ' + villeInput.value.trim();
        }

        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(searchQuery)}&limit=8`;

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(function (data) {
                console.log('📊 Résultats adresse:', data.features.length);
                showAdresseSuggestions(data.features);
            })
            .catch(function (error) {
                console.error('❌ Erreur recherche adresse:', error);
                showError('adresse');
            });
    }

    function showAdresseSuggestions(features) {
        const container = document.getElementById('adresse-suggestions');
        if (!container) return;

        currentSuggestions = features;
        currentType = 'adresse';
        selectedIndex = -1;

        if (features.length === 0) {
            container.innerHTML = '<div class="loading">Aucune adresse trouvée</div>';
        } else {
            let html = '';
            features.forEach(function (feature, index) {
                const props = feature.properties;
                const adresse = props.label || props.name;
                const score = Math.round(props.score * 100);

                let coordInfo = '';
                if (feature.geometry && feature.geometry.coordinates) {
                    const coords = feature.geometry.coordinates;
                    coordInfo = ` • GPS: ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
                }

                html += `
                    <div class="autocomplete-suggestion" onclick="selectAdresse(${index})">
                        <div class="suggestion-main">${adresse}</div>
                        <div class="suggestion-details">${score}% correspondance${coordInfo}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        container.style.display = 'block';
    }

    function selectAdresse(index) {
        const feature = currentSuggestions[index];
        if (!feature) return;

        const props = feature.properties;
        console.log('🎯 Adresse sélectionnée:', props);

        // Extraire l'adresse seule
        let adresseSeule = props.name || props.label;
        if (props.city && props.postcode) {
            const regex = new RegExp(',?\\s*' + props.postcode + '\\s*' + props.city + '.*$', 'i');
            adresseSeule = adresseSeule.replace(regex, '');
        }

        // Remplir l'input de recherche d'adresse
        const adresseInput = document.getElementById('adresse-search');
        if (adresseInput) {
            adresseInput.value = adresseSeule;
        }

        // Remplir le champ Symfony rue
        const rueInput = document.querySelector('input[id*="rue"]');
        if (rueInput) {
            rueInput.value = adresseSeule;
            console.log('✅ Champ rue rempli:', adresseSeule);
        }

        // CRITIQUE: Remplir coordonnées GPS EN PREMIER avec les coordonnées PRÉCISES
        if (feature.geometry && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates;
            const longitude = coords[0];
            const latitude = coords[1];

            console.log('🎯 COORDONNÉES PRÉCISES DE L\'ADRESSE:', { latitude, longitude });
            console.log('📍 Ces coordonnées seront protégées contre l\'écrasement');

            // Utiliser la fonction avec source spécifique
            updateCoordinates(latitude, longitude, 'address_precise');

            // Marquer qu'on a des coordonnées précises (optionnel - la vérification se fait sur la précision)
            window.lastCoordinatesSource = 'address_precise';
            window.lastCoordinatesTime = Date.now();
        }

        // Ensuite gérer la ville
        if (props.city) {
            const villeInput = document.getElementById('ville-search');
            if (villeInput) {
                villeInput.value = props.city;

                // Déclencher recherche ville
                setTimeout(function() {
                    searchVille(props.city);
                }, 100);
            }
        }

        // Remplir code postal
        const codePostalInput = document.getElementById('codePostal');
        if (codePostalInput && props.postcode) {
            codePostalInput.value = props.postcode;
        }

        // Remplir département
        const departementInput = document.getElementById('departement');
        if (departementInput && props.context) {
            const parts = props.context.split(',');
            if (parts.length > 0) {
                departementInput.value = parts[parts.length - 1].trim();
            }
        }

        hideSuggestions('adresse');
    }

    // NOUVELLE FONCTION: Centraliser la mise à jour des coordonnées
    function updateCoordinates(latitude, longitude, source = 'autocompletion') {
        console.log('📍 updateCoordinates appelée:', {latitude, longitude, source});

        // Forcer le format avec point décimal pour la base de données
        const latFormatted = parseFloat(latitude).toString().replace(',', '.');
        const lngFormatted = parseFloat(longitude).toString().replace(',', '.');

        console.log('📍 Coordonnées formatées:', {latitude: latFormatted, longitude: lngFormatted});

        // Champs d'affichage (avec virgules pour l'utilisateur français)
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        if (latDisplay) latDisplay.value = latitude.toFixed(6).replace('.', ',');
        if (lngDisplay) lngDisplay.value = longitude.toFixed(6).replace('.', ',');

        // Champs Symfony (CRITIQUES - avec points pour la base de données)
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        if (latInput) {
            latInput.value = latFormatted;
            console.log('✅ Latitude Symfony mise à jour:', latFormatted);
        } else {
            console.error('❌ Champ latitude Symfony introuvable!');
        }

        if (lngInput) {
            lngInput.value = lngFormatted;
            console.log('✅ Longitude Symfony mise à jour:', lngFormatted);
        } else {
            console.error('❌ Champ longitude Symfony introuvable!');
        }

        // NOUVEAU: Créer des champs cachés pour les coordonnées (comme pour la ville)
        createHiddenCoordinatesFields(latFormatted, lngFormatted);
    }

    function createHiddenCoordinatesFields(latitude, longitude) {
        const form = document.getElementById('lieu-form');
        if (!form) return;

        // Supprimer les anciens champs
        const oldCoordFields = form.querySelectorAll('input[name^="coordinates_"]');
        oldCoordFields.forEach(field => field.remove());

        // S'assurer que ce sont des strings numériques
        const latString = parseFloat(latitude).toString();
        const lngString = parseFloat(longitude).toString();

        console.log('📝 Création champs cachés (strings numériques):', { latString, lngString });

        const coordFields = [
            {
                name: 'coordinates_latitude',
                value: latString
            },
            {
                name: 'coordinates_longitude',
                value: lngString
            }
        ];

        coordFields.forEach(fieldData => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = fieldData.name;
            hiddenField.value = fieldData.value;
            form.appendChild(hiddenField);

            console.log('📝 Champ caché créé:', fieldData.name, '=', fieldData.value, 'Type:', typeof fieldData.value);
        });
    }

    // ===== NAVIGATION CLAVIER =====
    function handleKeydown(e) {
        const type = e.target.id === 'ville-search' ? 'ville' : 'adresse';
        const container = document.getElementById(type + '-suggestions');

        if (!container || container.style.display === 'none') return;

        const suggestions = container.querySelectorAll('.autocomplete-suggestion');
        if (suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                updateSelection(suggestions);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(suggestions);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    if (type === 'ville') {
                        selectVille(selectedIndex);
                    } else {
                        selectAdresse(selectedIndex);
                    }
                }
                break;
            case 'Escape':
                hideSuggestions(type);
                break;
        }
    }

    function updateSelection(suggestions) {
        for (let i = 0; i < suggestions.length; i++) {
            const suggestion = suggestions[i];
            if (i === selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        }
    }

    // ===== UTILITAIRES =====
    function showLoading(type) {
        const container = document.getElementById(type + '-suggestions');
        if (container) {
            container.innerHTML = '<div class="loading">Recherche en cours...</div>';
            container.style.display = 'block';
        }
    }

    function showError(type) {
        const container = document.getElementById(type + '-suggestions');
        if (container) {
            container.innerHTML = '<div class="loading">Erreur de connexion</div>';
            container.style.display = 'block';
        }
    }

    function hideSuggestions(type) {
        const container = document.getElementById(type + '-suggestions');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
        selectedIndex = -1;
    }

    function hideAllSuggestions() {
        hideSuggestions('ville');
        hideSuggestions('adresse');
    }

    // Exposer les fonctions globalement pour les onclick
    window.selectVille = selectVille;
    window.selectAdresse = selectAdresse;

})();
const originalUpdateCoordinates = window.updateCoordinates || updateCoordinates;

function updateCoordinates(latitude, longitude, source = 'autocompletion') {
    console.log('📍 updateCoordinates appelée:', { latitude, longitude, source });

    // Convertir en nombres puis en strings numériques propres
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    // Vérifier que ce sont des nombres valides
    if (isNaN(latNum) || isNaN(lngNum)) {
        console.error('❌ Coordonnées invalides:', { latitude, longitude });
        return;
    }

    // Convertir en strings numériques avec précision
    const latString = latNum.toString();
    const lngString = lngNum.toString();

    console.log('📍 Coordonnées converties en strings:', { latString, lngString });

    // Champs d'affichage (avec virgules pour l'utilisateur français)
    const latDisplay = document.getElementById('latitude-display');
    const lngDisplay = document.getElementById('longitude-display');

    if (latDisplay) latDisplay.value = latNum.toFixed(6).replace('.', ',');
    if (lngDisplay) lngDisplay.value = lngNum.toFixed(6).replace('.', ',');

    // Champs Symfony (CRITIQUES - strings numériques avec points)
    const latInput = document.querySelector('input[id*="latitude"]');
    const lngInput = document.querySelector('input[id*="longitude"]');

    if (latInput) {
        latInput.value = latString; // String numérique
        console.log('✅ Latitude Symfony définie:', latString, 'Type:', typeof latString);
    } else {
        console.error('❌ Champ latitude Symfony introuvable!');
    }

    if (lngInput) {
        lngInput.value = lngString; // String numérique
        console.log('✅ Longitude Symfony définie:', lngString, 'Type:', typeof lngString);
    } else {
        console.error('❌ Champ longitude Symfony introuvable!');
    }

    // Créer des champs cachés avec strings numériques
    createHiddenCoordinatesFields(latString, lngString);
}

// Remplacer la fonction globale
if (typeof updateCoordinates === 'function') {
    window.updateCoordinates = updateCoordinatesWithDebug;
    updateCoordinates = updateCoordinatesWithDebug;
}

// Debug pour selectAdresse
const originalSelectAdresse = window.selectAdresse;
if (originalSelectAdresse) {
    window.selectAdresse = function (index) {
        console.log('🏠 selectAdresse appelée avec index:', index);
        const feature = currentSuggestions[index];
        if (feature && feature.geometry && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates;
            console.log('🎯 Coordonnées de l\'adresse sélectionnée:', {
                longitude: coords[0],
                latitude: coords[1]
            });
        }

        return originalSelectAdresse.call(this, index);
    };
}

// Debug pour selectVille
const originalSelectVille = window.selectVille;
if (originalSelectVille) {
    window.selectVille = function (index) {
        console.log('🏙️ selectVille appelée avec index:', index);
        const item = currentSuggestions[index];
        if (item) {
            console.log('🎯 Ville sélectionnée:', item.nom);
        }

        return originalSelectVille.call(this, index);
    };
}

// Debug pour le formulaire - vérifier ce qui est envoyé
document.addEventListener('DOMContentLoaded', function () {
    const lieuForm = document.getElementById('lieu-form');
    if (lieuForm) {
        lieuForm.addEventListener('submit', function (e) {
            console.log('📤 SOUMISSION FORMULAIRE - Vérification finale des coordonnées:');

            const formData = new FormData(lieuForm);

            // Vérifier les champs display
            const latDisplay = document.getElementById('latitude-display');
            const lngDisplay = document.getElementById('longitude-display');

            console.log('👁️ Champs d\'affichage:');
            console.log('  latitude-display:', latDisplay?.value);
            console.log('  longitude-display:', lngDisplay?.value);

            // Vérifier les champs Symfony
            console.log('📋 Champs Symfony dans FormData:');
            for (let [key, value] of formData.entries()) {
                if (key.includes('latitude') || key.includes('longitude')) {
                    console.log('  ' + key + ':', value);
                }
            }

            // Vérifier directement les inputs
            const latInput = document.querySelector('input[id*="latitude"]');
            const lngInput = document.querySelector('input[id*="longitude"]');

            console.log('🎯 Champs Symfony directs:');
            console.log('  latitude input value:', latInput?.value);
            console.log('  longitude input value:', lngInput?.value);
            console.log('  latitude input name:', latInput?.name);
            console.log('  longitude input name:', lngInput?.name);
        });
    }
});

// Bouton de debug pour voir l'état actuel
const debugCoordsButton = document.createElement('button');
debugCoordsButton.textContent = 'Debug Coordonnées';
debugCoordsButton.type = 'button';
debugCoordsButton.style.cssText = 'position: fixed; bottom: 60px; right: 10px; z-index: 9999; background: #28a745; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 12px;';
debugCoordsButton.addEventListener('click', function () {
    console.log('=== DEBUG ÉTAT ACTUEL DES COORDONNÉES ===');

    const latDisplay = document.getElementById('latitude-display');
    const lngDisplay = document.getElementById('longitude-display');
    const latInput = document.querySelector('input[id*="latitude"]');
    const lngInput = document.querySelector('input[id*="longitude"]');

    console.log('📺 Champs d\'affichage (ce que voit l\'utilisateur):');
    console.log('  latitude-display:', latDisplay?.value);
    console.log('  longitude-display:', lngDisplay?.value);

    console.log('📋 Champs Symfony (ce qui sera envoyé):');
    console.log('  latitude:', latInput?.value, '(name:', latInput?.name + ')');
    console.log('  longitude:', lngInput?.value, '(name:', lngInput?.name + ')');

    console.log('🏠 Dernière adresse sélectionnée:', window.lastSelectedAdresse || 'aucune');
    console.log('🏙️ Dernière ville sélectionnée:', window.lastSelectedVille || 'aucune');
});

document.body.appendChild(debugCoordsButton);

console.log('🔧 Debug des coordonnées activé !');