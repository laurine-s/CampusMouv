// Script d'autocomplétion pour les adresses et villes
(function() {
    'use strict';

    let currentSuggestions = [];
    let selectedIndex = -1;
    let currentType = '';
    let debounceVille = null;
    let debounceAdresse = null;

    // Initialisation au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
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
        document.addEventListener('click', function(e) {
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
        villeSelect.addEventListener('invalid', function(e) {
            e.preventDefault(); // Empêcher le message par défaut

            console.log('⚠️ Validation échouée pour le champ ville');
            console.log('📋 Valeur actuelle du select:', this.value);

            // Afficher un message personnalisé
            showValidationError('Veuillez sélectionner une ville dans la liste des suggestions.');

            // Focaliser sur le champ de recherche visible
            const villeSearchInput = document.getElementById('ville-search');
            if (villeSearchInput) {
                villeSearchInput.focus();
                villeSearchInput.style.borderColor = '#dc3545';
                villeSearchInput.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';

                // Retirer le style d'erreur après 3 secondes
                setTimeout(function() {
                    villeSearchInput.style.borderColor = '';
                    villeSearchInput.style.boxShadow = '';
                }, 3000);
            }
        });

        // Ajouter un bouton de debug pour voir l'état du formulaire
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Formulaire';
        debugButton.type = 'button';
        debugButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; background: #007bff; color: white; border: none; padding: 8px; border-radius: 4px; font-size: 12px;';
        debugButton.addEventListener('click', function() {
            console.log('=== DEBUG FORMULAIRE ===');
            console.log('🏙️ Input ville:', document.getElementById('ville-search')?.value);
            console.log('📋 Select ville value:', villeSelect?.value);
            console.log('📋 Select ville text:', villeSelect?.selectedOptions[0]?.textContent);
            console.log('🏠 Input rue:', document.querySelector('input[id*="rue"]')?.value);
            console.log('📍 Latitude:', document.querySelector('input[id*="latitude"]')?.value);
            console.log('📍 Longitude:', document.querySelector('input[id*="longitude"]')?.value);
            console.log('✅ Validation passerait:', validateRequiredFields());
        });
        document.body.appendChild(debugButton);

        // Validation avant soumission
        form.addEventListener('submit', function(e) {
            if (!validateRequiredFields()) {
                e.preventDefault();
                return false;
            }
        });
    }

    function validateRequiredFields() {
        const villeSelect = document.querySelector('select[id*="ville"]');
        const villeSearchInput = document.getElementById('ville-search');

        console.log('🔍 Validation des champs requis...');

        if (villeSelect) {
            console.log('📋 Valeur du select ville:', villeSelect.value);
            console.log('📋 Option sélectionnée:', villeSelect.selectedOptions[0]?.textContent);
        }

        // Vérifier que la ville est sélectionnée
        if (villeSelect && (!villeSelect.value || villeSelect.value === '' || villeSelect.value === '0')) {
            console.log('❌ Validation échouée: aucune ville sélectionnée');
            showValidationError('Veuillez sélectionner une ville dans la liste des suggestions.');

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
        // Créer ou mettre à jour le message d'erreur
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

            // Insérer au début du formulaire
            const form = document.getElementById('lieu-form');
            if (form && form.firstChild) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Masquer automatiquement après 5 secondes
        setTimeout(function() {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    // ===== GESTION VILLE =====
    function handleVilleInput(e) {
        const value = e.target.value;

        clearTimeout(debounceVille);

        // Cacher le message d'erreur quand l'utilisateur tape
        const errorDiv = document.getElementById('validation-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }

        // Réinitialiser le style du champ
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';

        if (value.length < 2) {
            hideSuggestions('ville');
            return;
        }

        debounceVille = setTimeout(function() {
            searchVille(value);
        }, 300);
    }

    function searchVille(query) {
        console.log('🔍 Recherche ville:', query);

        showLoading('ville');

        let url;

        // Si que des chiffres
        if (/^\d+$/.test(query)) {
            if (query.length <= 2) {
                // Recherche par département
                const codeDep = query.padStart(2, '0');
                url = `https://geo.api.gouv.fr/departements/${codeDep}/communes?fields=nom,code,codesPostaux,departement&limit=50`;
            } else {
                // Recherche par code postal
                url = `https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,departement&limit=100`;
            }
        } else {
            // Recherche par nom
            url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,departement&boost=population&limit=30`;
        }

        fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(function(data) {
                // Si recherche par code postal partiel, filtrer
                if (/^\d{3,}$/.test(query)) {
                    data = data.filter(function(commune) {
                        return commune.codesPostaux && commune.codesPostaux.some(function(cp) {
                            return cp.startsWith(query);
                        });
                    });
                }

                console.log('📊 Résultats ville:', data.length);
                showVilleSuggestions(data);
            })
            .catch(function(error) {
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
            currentSuggestions.forEach(function(item, index) {
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

        console.log('🎯 Ville sélectionnée:', item.nom);

        // Remplir l'input de recherche
        const villeInput = document.getElementById('ville-search');
        if (villeInput) {
            villeInput.value = item.nom;
        }

        // Trouver et sélectionner dans le select Symfony
        const villeSelect = document.querySelector('select[id*="ville"]');
        if (villeSelect) {
            console.log('🔍 Recherche dans le select pour:', item.nom);
            console.log('📋 Options disponibles:', Array.from(villeSelect.options).map(opt => opt.textContent));

            const options = villeSelect.querySelectorAll('option');
            let optionFound = false;

            // Essayer plusieurs stratégies de correspondance
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                const optionText = option.textContent.toLowerCase().trim();
                const itemNom = item.nom.toLowerCase().trim();

                // 1. Correspondance exacte du nom
                if (optionText.includes(itemNom)) {
                    option.selected = true;
                    optionFound = true;
                    console.log('✅ Option trouvée par nom:', option.textContent);
                    break;
                }

                // 2. Correspondance par code postal si disponible
                if (item.codesPostaux && item.codesPostaux.length > 0) {
                    const cp = item.codesPostaux[0];
                    if (optionText.includes(cp)) {
                        option.selected = true;
                        optionFound = true;
                        console.log('✅ Option trouvée par code postal:', option.textContent);
                        break;
                    }
                }
            }

            // Si aucune option trouvée, forcer la première option non vide comme fallback
            if (!optionFound) {
                console.log('⚠️ Aucune correspondance trouvée, recherche d\'une option similaire...');

                // Chercher une option qui contient une partie du nom
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    if (option.value && option.value !== '') {
                        const optionWords = option.textContent.toLowerCase().split(/[\s\-,]+/);
                        const itemWords = item.nom.toLowerCase().split(/[\s\-,]+/);

                        // Vérifier si au moins un mot correspond
                        for (let itemWord of itemWords) {
                            if (itemWord.length > 2 && optionWords.some(optWord => optWord.includes(itemWord) || itemWord.includes(optWord))) {
                                option.selected = true;
                                optionFound = true;
                                console.log('✅ Option trouvée par similarité:', option.textContent);
                                break;
                            }
                        }
                        if (optionFound) break;
                    }
                }
            }

            if (optionFound) {
                // Déclencher l'événement change
                const changeEvent = new Event('change', { bubbles: true });
                villeSelect.dispatchEvent(changeEvent);

                // Marquer le champ comme valide
                villeSelect.setCustomValidity('');

                // Cacher le message d'erreur
                const errorDiv = document.getElementById('validation-error');
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }

                console.log('✅ Ville validée avec succès');
            } else {
                console.log('❌ Impossible de trouver une option correspondante');

                // En dernier recours, sélectionner la première option valide
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    if (option.value && option.value !== '' && option.value !== '0') {
                        option.selected = true;
                        villeSelect.setCustomValidity('');
                        console.log('🔧 Option de secours sélectionnée:', option.textContent);
                        break;
                    }
                }
            }
        }

        // Remplir code postal
        const codePostalInput = document.getElementById('codePostal');
        if (codePostalInput && item.codesPostaux && item.codesPostaux.length > 0) {
            codePostalInput.value = item.codesPostaux[0];
        }

        // Remplir département
        const departementInput = document.getElementById('departement');
        if (departementInput && item.departement) {
            departementInput.value = item.departement.nom;
        }

        hideSuggestions('ville');
    }

    // ===== GESTION ADRESSE =====
    function handleAdresseInput(e) {
        const value = e.target.value;

        clearTimeout(debounceAdresse);

        if (value.length < 3) {
            hideSuggestions('adresse');
            return;
        }

        debounceAdresse = setTimeout(function() {
            searchAdresse(value);
        }, 300);
    }

    function searchAdresse(query) {
        console.log('🔍 Recherche adresse:', query);

        showLoading('adresse');

        // Améliorer la requête avec la ville si disponible
        let searchQuery = query;
        const villeInput = document.getElementById('ville-search');
        if (villeInput && villeInput.value.trim()) {
            searchQuery += ' ' + villeInput.value.trim();
        }

        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(searchQuery)}&limit=8`;

        fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Erreur réseau');
                return response.json();
            })
            .then(function(data) {
                console.log('📊 Résultats adresse:', data.features.length);
                showAdresseSuggestions(data.features);
            })
            .catch(function(error) {
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
            features.forEach(function(feature, index) {
                const props = feature.properties;
                const adresse = props.label || props.name;
                const score = Math.round(props.score * 100);

                // Ajouter coordonnées dans les détails
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
        console.log('🎯 Adresse sélectionnée:', props.label);

        // Extraire l'adresse seule (sans ville/code postal)
        let adresseSeule = props.name || props.label;
        if (props.city && props.postcode) {
            const regex = new RegExp(',?\\s*' + props.postcode + '\\s*' + props.city + '.*$', 'i');
            adresseSeule = adresseSeule.replace(regex, '');
        }

        // Remplir l'input de recherche
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

        // Remplir ville
        const villeInput = document.getElementById('ville-search');
        if (villeInput && props.city) {
            villeInput.value = props.city;
            // Déclencher recherche ville
            setTimeout(function() {
                searchVille(props.city);
            }, 100);
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

        // Remplir coordonnées GPS
        if (feature.geometry && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates;
            const longitude = coords[0];
            const latitude = coords[1];

            console.log('📍 Coordonnées:', { latitude: latitude, longitude: longitude });

            // Champs d'affichage
            const latDisplay = document.getElementById('latitude-display');
            const lngDisplay = document.getElementById('longitude-display');

            if (latDisplay) latDisplay.value = latitude.toFixed(6);
            if (lngDisplay) lngDisplay.value = longitude.toFixed(6);

            // Champs Symfony
            const latInput = document.querySelector('input[id*="latitude"]');
            const lngInput = document.querySelector('input[id*="longitude"]');

            if (latInput) {
                latInput.value = latitude;
                console.log('✅ Latitude Symfony:', latitude);
            }
            if (lngInput) {
                lngInput.value = longitude;
                console.log('✅ Longitude Symfony:', longitude);
            }
        }

        hideSuggestions('adresse');
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