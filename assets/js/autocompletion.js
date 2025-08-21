/**
 * Script d'autocomplétion pour les adresses et villes - VERSION ES5
 */

(function () {
    'use strict';

    var currentSuggestions = [];
    var selectedIndex = -1;
    var currentType = '';
    var lastSelectedVille = null;
    var debounceVille = null;
    var debounceAdresse = null;

    /**
     * Initialisation
     */
    function init() {
        setupEventListeners();
        Forms.setupValidation('lieu-form');
    }

    /**
     * Configuration des événements
     */
    function setupEventListeners() {
        var villeInput = document.getElementById('ville-search');
        var adresseInput = document.getElementById('adresse-search');

        if (villeInput) {
            villeInput.addEventListener('input', handleVilleInput);
            villeInput.addEventListener('keydown', handleKeydown);
        }

        if (adresseInput) {
            adresseInput.addEventListener('input', handleAdresseInput);
            adresseInput.addEventListener('keydown', handleKeydown);
        }

        // Fermer suggestions au clic extérieur
        document.addEventListener('click', function(e) {
            var closest = e.target.closest('.autocomplete-container');
            if (!closest) {
                hideAllSuggestions();
            }
        });
    }

    /**
     * Gestion input ville
     */
    function handleVilleInput(e) {
        var value = e.target.value;

        // Nettoyer les anciens champs cachés
        clearVilleFields();

        Forms.hideValidationMessage();
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';

        clearTimeout(debounceVille);

        if (value.length < 2) {
            Utils.hideSuggestions('ville');
            return;
        }

        debounceVille = setTimeout(function() {
            searchVille(value);
        }, 300);
    }

    /**
     * Gestion input adresse
     */
    function handleAdresseInput(e) {
        var value = e.target.value;

        clearTimeout(debounceAdresse);

        if (value.length < 3) {
            Utils.hideSuggestions('adresse');
            return;
        }

        debounceAdresse = setTimeout(function() {
            searchAdresse(value);
        }, 300);
    }

    /**
     * Recherche de ville
     */
    function searchVille(query) {
        Utils.showLoading('ville');

        var url;

        if (/^\d+$/.test(query)) {
            if (query.length <= 2) {
                var codeDep = query.length === 1 ? '0' + query : query;
                url = 'https://geo.api.gouv.fr/departements/' + codeDep + '/communes?fields=nom,code,codesPostaux,departement&limit=50';
            } else {
                url = 'https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,departement&limit=100';
            }
        } else {
            url = 'https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(query) + '&fields=nom,code,codesPostaux,departement&boost=population&limit=30';
        }

        Utils.fetchData(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                // Filtrer par code postal si recherche numérique
                if (/^\d{3,}$/.test(query)) {
                    data = data.filter(function(commune) {
                        return commune.codesPostaux && commune.codesPostaux.some(function(cp) {
                            return cp.indexOf(query) === 0;
                        });
                    });
                }

                showVilleSuggestions(data);
            })
            .catch(function(error) {
                Utils.showError('ville');
            });
    }

    /**
     * Recherche d'adresse
     */
    function searchAdresse(query) {
        Utils.showLoading('adresse');

        // Améliorer la requête avec la ville si disponible
        var searchQuery = query;
        var villeInput = document.getElementById('ville-search');
        if (villeInput && villeInput.value.trim()) {
            searchQuery += ' ' + villeInput.value.trim();
        }

        var url = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(searchQuery) + '&limit=8';

        Utils.fetchData(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                showAdresseSuggestions(data.features);
            })
            .catch(function(error) {
                Utils.showError('adresse');
            });
    }

    /**
     * Afficher les suggestions de ville
     */
    function showVilleSuggestions(data) {
        var container = document.getElementById('ville-suggestions');
        if (!container) return;

        currentSuggestions = data.slice(0, 8);
        currentType = 'ville';
        selectedIndex = -1;

        if (currentSuggestions.length === 0) {
            container.innerHTML = '<div class="loading">Aucun résultat trouvé</div>';
        } else {
            var html = '';
            for (var i = 0; i < currentSuggestions.length; i++) {
                var item = currentSuggestions[i];
                var codesPostaux = item.codesPostaux ? item.codesPostaux.join(', ') : '';
                var departement = item.departement ? item.departement.nom : '';

                html += '<div class="autocomplete-suggestion" onclick="selectVille(' + i + ')">' +
                    '<div class="suggestion-main">' + item.nom + '</div>' +
                    '<div class="suggestion-details">' + codesPostaux + ' - ' + departement + '</div>' +
                    '</div>';
            }
            container.innerHTML = html;
        }

        container.style.display = 'block';
    }

    /**
     * Afficher les suggestions d'adresse
     */
    function showAdresseSuggestions(features) {
        var container = document.getElementById('adresse-suggestions');
        if (!container) return;

        currentSuggestions = features;
        currentType = 'adresse';
        selectedIndex = -1;

        if (features.length === 0) {
            container.innerHTML = '<div class="loading">Aucune adresse trouvée</div>';
        } else {
            var html = '';
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                var props = feature.properties;
                var adresse = props.label || props.name;
                var score = Math.round(props.score * 100);

                html += '<div class="autocomplete-suggestion" onclick="selectAdresse(' + i + ')">' +
                    '<div class="suggestion-main">' + adresse + '</div>' +
                    '<div class="suggestion-details">' + score + '% correspondance</div>' +
                    '</div>';
            }
            container.innerHTML = html;
        }

        container.style.display = 'block';
    }

    /**
     * Sélectionner une ville
     */
    function selectVille(index) {
        var item = currentSuggestions[index];
        if (!item) return;

        lastSelectedVille = {
            nom: item.nom,
            codesPostaux: item.codesPostaux,
            departement: item.departement,
            code: item.code
        };

        // Remplir l'input de recherche
        var villeInput = document.getElementById('ville-search');
        if (villeInput) {
            villeInput.value = item.nom;
        }

        // Créer des champs cachés
        createHiddenVilleFields(item);

        // Remplir les champs d'affichage
        fillLocationDetails(item);

        // Récupérer coordonnées centre-ville si pas de coordonnées précises
        if (!Coordinates.hasPreciseCoordinates()) {
            setTimeout(function() {
                searchCoordinatesForVille(item);
            }, 100);
        }

        Forms.hideValidationMessage();
        Utils.hideSuggestions('ville');
    }

    /**
     * Sélectionner une adresse
     */
    function selectAdresse(index) {
        var feature = currentSuggestions[index];
        if (!feature) return;

        var props = feature.properties;

        // Extraire l'adresse seule
        var adresseSeule = props.name || props.label;
        if (props.city && props.postcode) {
            var pattern = ',?\\s*' + props.postcode + '\\s*' + props.city + '.*$';
            var regex = new RegExp(pattern, 'i');
            adresseSeule = adresseSeule.replace(regex, '');
        }

        // Remplir l'input d'adresse
        var adresseInput = document.getElementById('adresse-search');
        if (adresseInput) {
            adresseInput.value = adresseSeule;
        }

        // Remplir le champ rue Symfony
        var rueInput = document.querySelector('input[id*="rue"]');
        if (rueInput) {
            rueInput.value = adresseSeule;
        }

        // Mettre à jour les coordonnées GPS avec précision d'adresse
        if (feature.geometry && feature.geometry.coordinates) {
            var coords = feature.geometry.coordinates;
            Coordinates.updateFields(coords[1], coords[0]); // lat, lng
        }

        // Gérer la ville
        if (props.city) {
            var villeInput = document.getElementById('ville-search');
            if (villeInput) {
                villeInput.value = props.city;
                setTimeout(function() {
                    searchVille(props.city);
                }, 100);
            }
        }

        // Autres champs
        var codePostalInput = document.getElementById('codePostal');
        if (codePostalInput && props.postcode) {
            codePostalInput.value = props.postcode;
        }

        var departementInput = document.getElementById('departement');
        if (departementInput && props.context) {
            var parts = props.context.split(',');
            if (parts.length > 0) {
                departementInput.value = parts[parts.length - 1].trim();
            }
        }

        Utils.hideSuggestions('adresse');
    }

    /**
     * Créer les champs cachés pour la ville
     */
    function createHiddenVilleFields(villeData) {
        var form = document.getElementById('lieu-form');
        if (!form) return;

        var fields = [
            { name: 'ville_nom', value: villeData.nom },
            { name: 'ville_code_postal', value: villeData.codesPostaux && villeData.codesPostaux.length > 0 ? villeData.codesPostaux[0] : '' },
            { name: 'ville_departement', value: villeData.departement ? villeData.departement.nom : '' },
            { name: 'ville_code_insee', value: villeData.code || '' }
        ];

        Utils.createHiddenFields(form, fields);
    }

    /**
     * Nettoyer les champs cachés de ville
     */
    function clearVilleFields() {
        var form = document.getElementById('lieu-form');
        if (!form) return;

        var oldFields = form.querySelectorAll('input[name^="ville_"]');
        for (var i = 0; i < oldFields.length; i++) {
            oldFields[i].remove();
        }
        lastSelectedVille = null;
    }

    /**
     * Remplir les détails de localisation
     */
    function fillLocationDetails(item) {
        var codePostalInput = document.getElementById('codePostal');
        if (codePostalInput && item.codesPostaux && item.codesPostaux.length > 0) {
            codePostalInput.value = item.codesPostaux[0];
        }

        var departementInput = document.getElementById('departement');
        if (departementInput && item.departement) {
            departementInput.value = item.departement.nom;
        }
    }

    /**
     * Rechercher les coordonnées d'une ville
     */
    function searchCoordinatesForVille(villeItem) {
        if (!villeItem || !villeItem.code) return;

        var url = 'https://geo.api.gouv.fr/communes/' + villeItem.code + '?fields=centre&format=json';

        Utils.fetchData(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.centre && data.centre.coordinates) {
                    var coords = data.centre.coordinates;
                    Coordinates.updateFields(coords[1], coords[0]); // lat, lng
                }
            })
            .catch(function(error) {
                console.error('Erreur récupération coordonnées ville:', error);
            });
    }

    /**
     * Navigation clavier
     */
    function handleKeydown(e) {
        var type = e.target.id === 'ville-search' ? 'ville' : 'adresse';
        var container = document.getElementById(type + '-suggestions');

        if (!container || container.style.display === 'none') return;

        var suggestions = container.querySelectorAll('.autocomplete-suggestion');
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
                Utils.hideSuggestions(type);
                break;
        }
    }

    /**
     * Mettre à jour la sélection visuelle
     */
    function updateSelection(suggestions) {
        for (var i = 0; i < suggestions.length; i++) {
            var suggestion = suggestions[i];
            if (i === selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        }
    }

    /**
     * Masquer toutes les suggestions
     */
    function hideAllSuggestions() {
        Utils.hideSuggestions('ville');
        Utils.hideSuggestions('adresse');
        selectedIndex = -1;
    }

    // Exposer les fonctions globalement pour les onclick
    window.selectVille = selectVille;
    window.selectAdresse = selectAdresse;

    // Initialisation
    Utils.initializeWhenReady(init);

})();