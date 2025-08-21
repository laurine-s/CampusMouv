/**
 * Script pour le formulaire de création de sortie
 * Gère le filtrage des lieux par campus et l'affichage des informations d'adresse
 */

class SortieForm {
    constructor() {
        this.lieuxData = [];
        this.lieuToSelect = null;
        this.elements = {};

        this.init();
    }

    /**
     * Initialisation de l'application
     */
    init() {
        console.log('🚀 Initialisation SortieForm');

        // Charger les données depuis le DOM
        this.loadData();

        // Récupérer les éléments DOM
        this.getElements();

        // Vérifier que tout est prêt
        if (!this.validateElements()) {
            console.error('❌ Impossible d\'initialiser SortieForm');
            return;
        }

        // Configurer les événements
        this.setupEventListeners();

        // Sélection automatique si nécessaire
        this.handleAutoSelection();

        // Configurer la sauvegarde de session
        this.setupSessionSave();

        console.log('✅ SortieForm initialisé avec succès');
    }

    /**
     * Charger les données depuis les attributs HTML
     */
    loadData() {
        const appDataElement = document.getElementById('app-data');

        if (!appDataElement) {
            console.error('❌ Élément app-data non trouvé');
            return;
        }

        try {
            const lieuxString = appDataElement.getAttribute('data-lieux');
            if (lieuxString) {
                this.lieuxData = JSON.parse(lieuxString);
                console.log('✅ Données lieux chargées:', this.lieuxData.length, 'lieux');
            }

            this.lieuToSelect = appDataElement.getAttribute('data-lieu-to-select');
            if (this.lieuToSelect) {
                console.log('✅ Lieu à sélectionner:', this.lieuToSelect);
            }
        } catch (error) {
            console.error('❌ Erreur lors du parsing des données:', error);
        }
    }

    /**
     * Récupérer les éléments DOM
     */
    getElements() {
        // Sélecteurs principaux
        this.elements.campusSelect = document.querySelector('select[name*="campus"]');
        this.elements.lieuSelect = document.querySelector('select[name*="lieu"]');

        // Champs d'affichage d'adresse
        this.elements.adresseField = document.getElementById('adresse-field');
        this.elements.villeField = document.getElementById('ville-field');
        this.elements.codePostalField = document.getElementById('codepostal-field');

        // Formulaire pour la sauvegarde
        this.elements.form = document.getElementById('sortie-form');

        console.log('Éléments trouvés:', {
            campus: !!this.elements.campusSelect,
            lieu: !!this.elements.lieuSelect,
            adresse: !!this.elements.adresseField,
            ville: !!this.elements.villeField,
            codePostal: !!this.elements.codePostalField,
            form: !!this.elements.form
        });
    }

    /**
     * Valider que les éléments essentiels sont présents
     */
    validateElements() {
        const required = ['campusSelect', 'lieuSelect'];

        for (const elementName of required) {
            if (!this.elements[elementName]) {
                console.error(`❌ Élément requis manquant: ${elementName}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Configurer les événements
     */
    setupEventListeners() {
        // Événement changement de campus
        this.elements.campusSelect.addEventListener('change', () => {
            console.log('🔥 Campus changé:', this.elements.campusSelect.value);
            this.filterLieux();
        });

        // Événement changement de lieu
        this.elements.lieuSelect.addEventListener('change', () => {
            console.log('🔥 Lieu changé:', this.elements.lieuSelect.value);
            this.updateAdresseInfo();
        });

        // Sauvegarde automatique
        if (this.elements.form) {
            this.elements.form.addEventListener('input', () => this.saveToSession());
            this.elements.form.addEventListener('change', () => this.saveToSession());
        }

        // Gestion de la modal et du formulaire lieu
        this.setupModalEvents();
    }

    /**
     * Configurer les événements de la modal
     */
    setupModalEvents() {
        const lieuForm = document.getElementById('lieu-form');
        const modal = document.getElementById('mon-modal');
        const lieuCampusSelect = lieuForm?.querySelector('select[name*="campus"]');

        if (!lieuForm) {
            console.warn('❌ Formulaire lieu non trouvé');
            return;
        }

        // Synchroniser le campus de la modal avec celui du formulaire principal
        const ajoutLieuBtn = document.getElementById('ajoutLieu');
        if (ajoutLieuBtn) {
            ajoutLieuBtn.addEventListener('click', () => {
                console.log('📝 Ouverture modal création lieu');

                // Pré-sélectionner le campus dans la modal
                if (lieuCampusSelect && this.elements.campusSelect.value) {
                    lieuCampusSelect.value = this.elements.campusSelect.value;
                    console.log('✅ Campus pré-sélectionné dans la modal:', this.elements.campusSelect.value);
                }
            });
        }

        // Intercepter la soumission du formulaire lieu
        lieuForm.addEventListener('submit', (e) => {
            const submitButton = e.submitter;

            // Vérifier si c'est le bouton "Enregistrer" (pas "Annuler")
            if (submitButton && submitButton.name && submitButton.name.includes('createLieu')) {
                console.log('🚀 Soumission formulaire lieu interceptée');
                this.handleLieuFormSubmission(e, lieuForm, modal);
            }
        });
    }
    ensureCoordinatesInFormData(formData) {
        console.log('🔍 Vérification des coordonnées avant envoi...');

        // Récupérer les coordonnées depuis les champs d'affichage
        const latDisplay = document.getElementById('latitude-display');
        const lngDisplay = document.getElementById('longitude-display');

        // Récupérer les coordonnées depuis les champs Symfony
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        console.log('📊 État des champs de coordonnées:');
        console.log('  latitude-display:', latDisplay?.value);
        console.log('  longitude-display:', lngDisplay?.value);
        console.log('  latitude Symfony:', latInput?.value);
        console.log('  longitude Symfony:', lngInput?.value);
        console.log('  latitude Symfony name:', latInput?.name);
        console.log('  longitude Symfony name:', lngInput?.name);

        // Coordonnées à utiliser
        let finalLat = null;
        let finalLng = null;

        // 1. Priorité aux champs Symfony s'ils sont remplis
        if (latInput?.value && lngInput?.value && latInput.value.trim() !== '' && lngInput.value.trim() !== '') {
            finalLat = latInput.value.replace(',', '.');
            finalLng = lngInput.value.replace(',', '.');
            console.log('✅ Coordonnées trouvées dans les champs Symfony');
        }
        // 2. Sinon, utiliser les champs d'affichage
        else if (latDisplay?.value && lngDisplay?.value && latDisplay.value.trim() !== '' && lngDisplay.value.trim() !== '') {
            finalLat = latDisplay.value.replace(',', '.');
            finalLng = lngDisplay.value.replace(',', '.');
            console.log('✅ Coordonnées récupérées depuis les champs d\'affichage');
        }

        if (finalLat && finalLng) {
            // Vérifier que ce sont des nombres valides
            const latNum = parseFloat(finalLat);
            const lngNum = parseFloat(finalLng);

            if (!isNaN(latNum) && !isNaN(lngNum) && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180) {

                // Déterminer les noms corrects des champs
                let latFieldName = 'lieu[latitude]';
                let lngFieldName = 'lieu[longitude]';

                // Si on a les noms des inputs Symfony, les utiliser
                if (latInput?.name && lngInput?.name) {
                    latFieldName = latInput.name;
                    lngFieldName = lngInput.name;
                }

                // Mettre à jour le FormData
                formData.set(latFieldName, latNum.toString());
                formData.set(lngFieldName, lngNum.toString());

                console.log('✅ Coordonnées forcées dans FormData:', {
                    [latFieldName]: latNum.toString(),
                    [lngFieldName]: lngNum.toString()
                });

                // Mettre à jour aussi les champs Symfony pour cohérence
                if (latInput) latInput.value = latNum.toString();
                if (lngInput) lngInput.value = lngNum.toString();

                return true;
            } else {
                console.error('❌ Coordonnées invalides:', { finalLat, finalLng, latNum, lngNum });
            }
        } else {
            console.warn('⚠️ Aucune coordonnée trouvée');
            console.log('Détails:', {
                latDisplay: latDisplay?.value,
                lngDisplay: lngDisplay?.value,
                latInput: latInput?.value,
                lngInput: lngInput?.value
            });
        }

        return false;
    }
    /**
     * Gérer la soumission du formulaire lieu
     */
    async handleLieuFormSubmission(event, lieuForm, modal) {
        event.preventDefault();

        // Validation de l'autocomplétion de ville
        if (!this.validateVilleAutocompletion()) {
            return;
        }

        const formData = new FormData(lieuForm);
        const submitButton = event.submitter;

        // S'assurer que le bouton de soumission est correctement ajouté
        if (submitButton && submitButton.name) {
            formData.set(submitButton.name, submitButton.value || '1');
        } else {
            formData.set('lieu[createLieu]', '1');
        }

        // CRITIQUE: S'assurer que les coordonnées sont dans le FormData
        const coordsOk = this.ensureCoordinatesInFormData(formData);
        if (!coordsOk) {
            this.displayModalErrors('Impossible de récupérer les coordonnées GPS. Veuillez re-sélectionner l\'adresse.');
            return;
        }

        // Corriger le format des coordonnées
        this.fixCoordinatesFormat(formData);

        try {
            console.log('📤 Envoi des données du lieu...');

            // Debug: Afficher toutes les données envoyées
            console.log('=== DONNÉES FINALES ENVOYÉES ===');
            for (let [key, value] of formData.entries()) {
                console.log(key + ':', value);
            }

            // Envoyer la requête AJAX
            const response = await fetch(lieuForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Détail erreur serveur:', errorText);
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            // Gérer les réponses JSON et HTML
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('📥 Réponse JSON reçue:', result);

                if (result.success) {
                    console.log('✅ Lieu créé avec succès');
                    const nouveauLieu = this.extractLieuFromForm(formData);
                    nouveauLieu.id = result.lieu_id;
                    await this.handleSuccessfulLieuCreation(nouveauLieu, modal);
                } else {
                    console.log('❌ Erreur JSON:', result.error);
                    this.displayModalErrors(result.error);
                }
            } else {
                const result = await response.text();
                console.log('📥 Réponse HTML reçue');

                if (this.isSuccessResponse(result)) {
                    console.log('✅ Lieu créé avec succès');
                    const nouveauLieu = this.extractLieuFromForm(formData);
                    await this.handleSuccessfulLieuCreation(nouveauLieu, modal);
                } else {
                    console.log('❌ Erreur lors de la création');
                    this.displayModalErrors(result);
                }
            }

        } catch (error) {
            console.error('❌ Erreur lors de la soumission:', error);
            this.displayModalErrors(`Erreur de connexion: ${error.message}`);
        }
    }

    fixCoordinatesFormat(formData) {
        // Récupérer les coordonnées
        const latitude = formData.get('lieu[latitude]');
        const longitude = formData.get('lieu[longitude]');

        if (latitude) {
            // Convertir virgule en point pour la base de données
            const latFixed = parseFloat(latitude.toString().replace(',', '.')).toString();
            formData.set('lieu[latitude]', latFixed);
            console.log('🔧 Latitude corrigée:', latitude, '=>', latFixed);
        }

        if (longitude) {
            // Convertir virgule en point pour la base de données
            const lngFixed = parseFloat(longitude.toString().replace(',', '.')).toString();
            formData.set('lieu[longitude]', lngFixed);
            console.log('🔧 Longitude corrigée:', longitude, '=>', lngFixed);
        }
    }

    /**
     * NOUVELLE MÉTHODE: Valider l'autocomplétion de ville
     */
    validateVilleAutocompletion() {
        const villeSearchInput = document.getElementById('ville-search');
        const form = document.getElementById('lieu-form');

        console.log('🔍 Validation autocomplétion ville...');

        // Vérifier qu'une ville a été saisie
        if (!villeSearchInput || !villeSearchInput.value.trim()) {
            console.log('❌ Aucune ville saisie');
            this.showValidationError('Veuillez sélectionner une ville via l\'autocomplétion.');
            this.highlightErrorField(villeSearchInput);
            return false;
        }

        // Vérifier qu'on a bien les données de ville (champs cachés créés par l'autocomplétion)
        const villeNomField = form.querySelector('input[name="ville_nom"]');
        const villeCodePostalField = form.querySelector('input[name="ville_code_postal"]');

        if (!villeNomField || !villeNomField.value || !villeCodePostalField || !villeCodePostalField.value) {
            console.log('❌ Données de ville manquantes - ville non sélectionnée via autocomplétion');
            console.log('ville_nom:', villeNomField?.value);
            console.log('ville_code_postal:', villeCodePostalField?.value);

            this.showValidationError('Veuillez sélectionner une ville dans la liste des suggestions (pas de saisie libre).');
            this.highlightErrorField(villeSearchInput);
            return false;
        }

        console.log('✅ Validation ville réussie');
        console.log('Ville:', villeNomField.value, '- CP:', villeCodePostalField.value);
        return true;
    }

    /**
     * NOUVELLE MÉTHODE: Afficher un message d'erreur dans la modal
     */
    showValidationError(message) {
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            messagesDiv.innerHTML = `
                <div class="uk-alert uk-alert-danger">
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * NOUVELLE MÉTHODE: Mettre en évidence un champ en erreur
     */
    highlightErrorField(field) {
        if (!field) return;

        field.focus();
        field.style.borderColor = '#dc3545';
        field.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';

        // Retirer le style d'erreur après 3 secondes
        setTimeout(() => {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }, 3000);
    }

    /**
     * Vérifier si la réponse indique un succès
     */
    isSuccessResponse(responseText) {
        // Méthodes pour détecter le succès :
        const hasSuccessMessage = responseText.includes('Lieu créé avec succès') ||
            responseText.includes('success') ||
            responseText.includes('uk-alert-success');

        const hasErrorMessage = responseText.includes('Veuillez sélectionner une ville') ||
            responseText.includes('Une erreur est survenue') ||
            responseText.includes('uk-alert-danger') ||
            responseText.includes('form-error');

        // Si on a explicitement une erreur, c'est un échec
        if (hasErrorMessage) {
            return false;
        }

        // Si on a un message de succès, c'est un succès
        if (hasSuccessMessage) {
            return true;
        }

        // Sinon, vérifier s'il y a des erreurs de formulaire
        const hasFormErrors = responseText.includes('has-error') ||
            responseText.includes('uk-form-danger');

        // C'est un succès s'il n'y a pas d'erreurs de formulaire et qu'on a du HTML (redirection)
        return !hasFormErrors && responseText.includes('<!DOCTYPE html>');
    }

    /**
     * Extraire les données du lieu depuis le formulaire
     */
    extractLieuFromForm(formData) {
        const lieuData = {};

        // Extraire les données du FormData
        for (let [key, value] of formData.entries()) {
            if (key.includes('[nom]')) {
                lieuData.nom = value;
            } else if (key.includes('[rue]')) {
                lieuData.rue = value;
            } else if (key.includes('[campus]')) {
                lieuData.campusId = value;
            } else if (key.includes('[ville]')) {
                lieuData.villeId = value;
            }
            // NOUVEAU: Récupérer les données d'autocomplétion de ville
            else if (key === 'ville_nom') {
                lieuData.villeNom = value;
            } else if (key === 'ville_code_postal') {
                lieuData.codePostal = value;
            } else if (key === 'ville_departement') {
                lieuData.departement = value;
            }
        }

        // AMÉLIORATION: Utiliser les données d'autocomplétion pour remplir ville et codePostal
        if (lieuData.villeNom && !lieuData.ville) {
            lieuData.ville = lieuData.villeNom;
        }
        if (lieuData.codePostal && !lieuData.codePostal) {
            lieuData.codePostal = lieuData.codePostal;
        }

        // Générer un ID temporaire (sera remplacé par le vrai ID plus tard)
        if (!lieuData.id) {
            lieuData.id = 'temp_' + Date.now();
        }

        console.log('🏗️ Données du nouveau lieu extraites:', lieuData);
        return lieuData;
    }

    /**
     * Gérer le succès de la création du lieu
     */
    async handleSuccessfulLieuCreation(nouveauLieu, modal) {
        try {
            // 1. Recharger les données des lieux depuis le serveur
            console.log('🔄 Rechargement des données des lieux...');
            await this.reloadLieuxData();

            // 2. Fermer la modal
            this.closeModal(modal);

            // 3. Sélectionner le campus et filtrer
            if (nouveauLieu.campusId) {
                this.elements.campusSelect.value = nouveauLieu.campusId;
                this.filterLieux();

                // 4. Essayer de sélectionner le nouveau lieu
                setTimeout(() => {
                    this.selectNewlyCreatedLieu(nouveauLieu);
                }, 200);
            }

            // 5. Vider le formulaire de la modal
            this.resetLieuForm();

            console.log('✅ Lieu créé et sélectionné avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de la gestion du succès:', error);
        }
    }

    /**
     * Recharger les données des lieux depuis le serveur
     */
    async reloadLieuxData() {
        try {
            // Faire une requête pour récupérer les nouvelles données
            const response = await fetch(window.location.href, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du rechargement des données');
            }

            const html = await response.text();

            // Extraire les nouvelles données depuis la réponse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const newAppData = tempDiv.querySelector('#app-data');
            if (newAppData) {
                const lieuxString = newAppData.getAttribute('data-lieux');
                if (lieuxString) {
                    this.lieuxData = JSON.parse(lieuxString);
                    console.log('✅ Données des lieux rechargées:', this.lieuxData.length, 'lieux');
                }
            }

        } catch (error) {
            console.error('❌ Erreur rechargement données:', error);
            // En cas d'erreur, on peut essayer de trouver le lieu dans la liste existante
        }
    }

    /**
     * Sélectionner le lieu nouvellement créé
     */
    selectNewlyCreatedLieu(nouveauLieu) {
        // Chercher le lieu par nom (plus fiable que l'ID temporaire)
        const lieuTrouve = this.lieuxData.find(lieu =>
            lieu.nom === nouveauLieu.nom &&
            lieu.campus &&
            lieu.campus.id == nouveauLieu.campusId
        );

        if (lieuTrouve) {
            console.log('🎯 Sélection automatique du nouveau lieu:', lieuTrouve.nom);
            this.elements.lieuSelect.value = lieuTrouve.id;
            this.updateAdresseInfo();
        } else {
            console.warn('❌ Nouveau lieu non trouvé dans les données');
            // Recharger la page en dernier recours
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    /**
     * Fermer la modal
     */
    closeModal(modal) {
        if (modal && typeof UIkit !== 'undefined') {
            // Utiliser UIkit pour fermer la modal
            UIkit.modal(modal).hide();
        } else {
            // Fallback : cacher la modal manuellement
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('uk-open');
            }
        }
        console.log('✅ Modal fermée');
    }

    /**
     * Réinitialiser le formulaire de la modal
     */
    resetLieuForm() {
        const lieuForm = document.getElementById('lieu-form');
        if (lieuForm) {
            lieuForm.reset();

            // Vider aussi les messages d'erreur
            const messagesDiv = document.getElementById('messages');
            if (messagesDiv) {
                messagesDiv.innerHTML = '';
            }
        }
    }

    /**
     * Afficher les erreurs dans la modal
     */
    displayModalErrors(errorContent) {
        const messagesDiv = document.getElementById('messages');
        if (!messagesDiv) return;

        let errorMessage = '';

        if (typeof errorContent === 'string') {
            if (errorContent.includes('<')) {
                // C'est du HTML, extraire les messages d'erreur
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = errorContent;

                // Chercher les messages flash
                const flashMessages = tempDiv.querySelectorAll('.uk-alert-danger, .alert-danger');
                if (flashMessages.length > 0) {
                    flashMessages.forEach(msg => {
                        errorMessage += '<p>' + msg.textContent.trim() + '</p>';
                    });
                } else {
                    // Chercher les erreurs de formulaire
                    const formErrors = tempDiv.querySelectorAll('.uk-form-danger, .has-error, .form-error');
                    if (formErrors.length > 0) {
                        formErrors.forEach(error => {
                            errorMessage += '<p>' + error.textContent.trim() + '</p>';
                        });
                    } else {
                        errorMessage = '<p>Une erreur est survenue lors de la création du lieu.</p>';
                    }
                }
            } else {
                // C'est du texte simple
                errorMessage = '<p>' + errorContent + '</p>';
            }
        } else {
            errorMessage = '<p>Une erreur est survenue lors de la création du lieu.</p>';
        }

        messagesDiv.innerHTML = `<div class="uk-alert uk-alert-danger">${errorMessage}</div>`;
    }

    /**
     * Filtrer les lieux en fonction du campus sélectionné
     */
    filterLieux() {
        const campusId = this.elements.campusSelect.value;

        // Vider la liste des lieux
        this.elements.lieuSelect.innerHTML = '<option value="">Choisir un lieu</option>';
        this.clearAdresseFields();

        if (!campusId || !this.lieuxData.length) {
            return;
        }

        // Filtrer les lieux par campus
        const lieuxFiltres = this.lieuxData.filter(lieu => {
            return lieu.campus && lieu.campus.id == campusId;
        });

        console.log(`Filtrage: ${lieuxFiltres.length} lieux trouvés pour le campus ${campusId}`);

        // Ajouter les lieux filtrés au select
        lieuxFiltres.forEach(lieu => {
            const option = new Option(lieu.nom, lieu.id);
            this.elements.lieuSelect.add(option);
        });
    }

    /**
     * Mettre à jour les informations d'adresse
     */
    updateAdresseInfo() {
        const lieuId = this.elements.lieuSelect.value;

        if (!lieuId) {
            this.clearAdresseFields();
            this.notifyMapUpdate(null);
            return;
        }

        // Trouver le lieu dans les données
        const lieu = this.lieuxData.find(l => l.id == lieuId);

        if (!lieu) {
            console.warn('❌ Lieu non trouvé:', lieuId);
            return;
        }

        console.log('📍 Mise à jour adresse:', lieu.nom);

        // Mettre à jour les champs
        if (this.elements.adresseField) {
            this.elements.adresseField.value = lieu.rue || '';
        }
        if (this.elements.villeField) {
            this.elements.villeField.value = lieu.ville || '';
        }
        if (this.elements.codePostalField) {
            this.elements.codePostalField.value = lieu.codePostal || '';
        }

        // Notifier la carte de la mise à jour
        this.notifyMapUpdate(lieu);
    }

    /**
     * Notifier la carte d'un changement de lieu
     */
    notifyMapUpdate(lieu) {
        console.log('📍 Notification carte pour le lieu:', lieu);

        // Méthode 1: Via l'instance globale
        if (window.sortieMapInstance) {
            // CORRECTION: Passer les coordonnées GPS directement si disponibles
            if (lieu && this.hasGPSCoordinates(lieu)) {
                console.log('🎯 Utilisation coordonnées GPS directes pour la carte');
                window.sortieMapInstance.updateFromCoordinates(lieu);
            } else if (lieu) {
                console.log('🔍 Pas de coordonnées GPS - géocodage de l\'adresse');
                window.sortieMapInstance.updateFromExternalData(lieu);
            } else {
                window.sortieMapInstance.clearMap();
            }
        }

        // Méthode 2: Via un événement personnalisé
        const event = new CustomEvent('sortie:lieuChanged', {
            detail: { lieu: lieu }
        });
        document.dispatchEvent(event);
    }
    hasGPSCoordinates(lieu) {
        // Vérifier dans les données du lieu
        if (lieu.latitude && lieu.longitude) {
            const lat = parseFloat(lieu.latitude);
            const lng = parseFloat(lieu.longitude);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                console.log('✅ Coordonnées GPS trouvées dans lieu:', { lat, lng });
                return true;
            }
        }

        // Sinon, vérifier dans les champs du formulaire
        const latInput = document.querySelector('input[id*="latitude"]');
        const lngInput = document.querySelector('input[id*="longitude"]');

        if (latInput?.value && lngInput?.value) {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                console.log('✅ Coordonnées GPS trouvées dans formulaire:', { lat, lng });
                // Ajouter les coordonnées au lieu pour les passer à la carte
                lieu.latitude = lat;
                lieu.longitude = lng;
                return true;
            }
        }

        console.log('❌ Aucune coordonnée GPS valide trouvée');
        return false;
    }

    /**
     * Vider les champs d'adresse
     */
    clearAdresseFields() {
        if (this.elements.adresseField) this.elements.adresseField.value = '';
        if (this.elements.villeField) this.elements.villeField.value = '';
        if (this.elements.codePostalField) this.elements.codePostalField.value = '';
    }

    /**
     * Gérer la sélection automatique d'un lieu
     */
    handleAutoSelection() {
        if (!this.lieuToSelect) return;

        const lieu = this.lieuxData.find(l => l.id == this.lieuToSelect);
        if (!lieu || !lieu.campus) return;

        console.log('🎯 Sélection automatique du lieu:', lieu.nom);

        // Sélectionner le campus
        this.elements.campusSelect.value = lieu.campus.id;
        this.filterLieux();

        // Puis sélectionner le lieu après un court délai
        setTimeout(() => {
            this.elements.lieuSelect.value = this.lieuToSelect;
            this.updateAdresseInfo();
            console.log('✅ Lieu sélectionné automatiquement');
        }, 100);
    }

    /**
     * Configurer la sauvegarde de session
     */
    setupSessionSave() {
        // Restaurer les données au chargement
        this.loadFromSession();

        // Auto-sauvegarde toutes les 10 secondes
        setInterval(() => this.saveToSession(), 10000);

        // Nettoyer à la soumission
        const submitButtons = this.elements.form?.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons?.forEach(button => {
            button.addEventListener('click', () => {
                setTimeout(() => this.clearSession(), 500);
            });
        });
    }

    /**
     * Sauvegarder le formulaire en session
     */
    saveToSession() {
        if (!this.elements.form) return;

        try {
            const formData = new FormData(this.elements.form);
            const jsonData = {};

            for (let [key, value] of formData.entries()) {
                const field = this.elements.form.querySelector(`[name="${key}"]`);
                if (field && field.type !== 'file') {
                    jsonData[key] = value;
                }
            }

            sessionStorage.setItem('sortie_brouillon', JSON.stringify(jsonData));
        } catch (error) {
            console.error('❌ Erreur sauvegarde session:', error);
        }
    }

    /**
     * Restaurer le formulaire depuis la session
     */
    loadFromSession() {
        if (!this.elements.form) return;

        try {
            const savedData = sessionStorage.getItem('sortie_brouillon');
            if (!savedData) return;

            const data = JSON.parse(savedData);

            Object.keys(data).forEach(key => {
                const field = this.elements.form.querySelector(`[name="${key}"]`);
                if (field && field.type !== 'file') {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = (field.value === data[key]);
                    } else {
                        field.value = data[key];
                    }
                }
            });

            // Après restauration, mettre à jour le filtrage
            if (this.elements.campusSelect.value) {
                this.filterLieux();
                if (this.elements.lieuSelect.value) {
                    this.updateAdresseInfo();
                }
            }

            console.log('✅ Données session restaurées');
        } catch (error) {
            console.error('❌ Erreur restauration session:', error);
        }
    }

    /**
     * Nettoyer la session
     */
    clearSession() {
        sessionStorage.removeItem('sortie_brouillon');
        console.log('🗑️ Session nettoyée');
    }

}

// Initialisation avec gestion des différents événements de chargement
function initSortieForm() {
    if (window.sortieFormInstance) {
        console.log('SortieForm déjà initialisé');
        return;
    }

    window.sortieFormInstance = new SortieForm();
}

// Différentes méthodes d'initialisation pour compatibilité maximale
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSortieForm);
} else {
    initSortieForm();
}

// Pour Turbo
document.addEventListener('turbo:load', initSortieForm);

// Backup window.onload
window.addEventListener('load', initSortieForm);



