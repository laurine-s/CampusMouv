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

    /**
     * Gérer la soumission du formulaire lieu
     */
    async handleLieuFormSubmission(event, lieuForm, modal) {
        event.preventDefault();

        const formData = new FormData(lieuForm);
        const submitButton = event.submitter;

        // Ajouter le bouton cliqué aux données
        if (submitButton) {
            formData.append(submitButton.name, submitButton.value);
        }

        try {
            console.log('📤 Envoi des données du lieu...');

            // Envoyer la requête AJAX
            const response = await fetch(lieuForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.text();
            console.log('📥 Réponse reçue');

            // Analyser la réponse pour voir si c'est un succès
            if (this.isSuccessResponse(result)) {
                console.log('✅ Lieu créé avec succès');

                // Récupérer les données du nouveau lieu depuis le formulaire
                const nouveauLieu = this.extractLieuFromForm(formData);

                // Mettre à jour les données et la sélection
                await this.handleSuccessfulLieuCreation(nouveauLieu, modal);

            } else {
                console.log('❌ Erreur lors de la création');
                // Afficher les erreurs dans la modal
                this.displayModalErrors(result);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la soumission:', error);
            this.displayModalErrors(`Erreur de connexion: ${error.message}`);
        }
    }

    /**
     * Vérifier si la réponse indique un succès
     */
    isSuccessResponse(responseText) {
        // Méthodes pour détecter le succès :
        // 1. Rechercher un message de succès
        // 2. Vérifier si on a une redirection (nouveau HTML)
        // 3. Vérifier l'absence d'erreurs de formulaire

        const hasSuccessMessage = responseText.includes('Lieu créé avec succès') ||
            responseText.includes('success');
        const hasFormErrors = responseText.includes('has-error') ||
            responseText.includes('form-error') ||
            responseText.includes('uk-form-danger');

        return hasSuccessMessage || (!hasFormErrors && responseText.includes('<!DOCTYPE html>'));
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
        }

        // Générer un ID temporaire (sera remplacé par le vrai ID plus tard)
        lieuData.id = 'temp_' + Date.now();

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
        if (messagesDiv) {
            // Extraire les messages d'erreur du HTML retourné
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = errorContent;

            // Chercher les erreurs de formulaire
            const errors = tempDiv.querySelectorAll('.uk-form-danger, .has-error, .form-error');

            if (errors.length > 0) {
                let errorHtml = '<div class="uk-alert uk-alert-danger">';
                errors.forEach(error => {
                    errorHtml += '<p>' + error.textContent + '</p>';
                });
                errorHtml += '</div>';
                messagesDiv.innerHTML = errorHtml;
            } else {
                messagesDiv.innerHTML = '<div class="uk-alert uk-alert-danger">Une erreur est survenue lors de la création du lieu.</div>';
            }
        }
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
        // Méthode 1: Via l'instance globale
        if (window.sortieMapInstance) {
            if (lieu) {
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