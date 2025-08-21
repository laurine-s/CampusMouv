/**
 * Gestionnaire de validation et utilitaires pour les formulaires - VERSION ES5
 */

var Forms = {
    /**
     * Afficher un message de validation
     */
    showValidationMessage: function(message, type) {
        if (typeof type === 'undefined') type = 'error';

        var messageDiv = document.getElementById('validation-message');

        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'validation-message';

            var form = document.getElementById('lieu-form') || document.querySelector('form');
            if (form && form.firstChild) {
                form.insertBefore(messageDiv, form.firstChild);
            }
        }

        var className = type === 'error' ? 'uk-alert-danger' : 'uk-alert-success';
        messageDiv.className = 'uk-alert ' + className;
        messageDiv.style.cssText = 'padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 14px;';

        messageDiv.textContent = message;
        messageDiv.style.display = 'block';

        // Auto-masquer après 5 secondes pour les erreurs
        if (type === 'error') {
            setTimeout(function() {
                if (messageDiv) {
                    messageDiv.style.display = 'none';
                }
            }, 5000);
        }
    },

    /**
     * Masquer le message de validation
     */
    hideValidationMessage: function() {
        var messageDiv = document.getElementById('validation-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    },

    /**
     * Valider qu'une ville a été sélectionnée via l'autocomplétion
     */
    validateVilleAutocompletion: function() {
        var villeSearchInput = document.getElementById('ville-search');
        var form = document.getElementById('lieu-form');

        // Vérifier qu'une ville a été saisie
        if (!villeSearchInput || !villeSearchInput.value.trim()) {
            this.showValidationMessage('Veuillez sélectionner une ville via l\'autocomplétion.');
            Utils.highlightError(villeSearchInput);
            return false;
        }

        // Vérifier qu'on a les données de ville (champs cachés créés par l'autocomplétion)
        var villeNomField = form ? form.querySelector('input[name="ville_nom"]') : null;
        var villeCodePostalField = form ? form.querySelector('input[name="ville_code_postal"]') : null;

        if (!villeNomField || !villeNomField.value || !villeCodePostalField || !villeCodePostalField.value) {
            this.showValidationMessage('Veuillez sélectionner une ville dans la liste des suggestions (pas de saisie libre).');
            Utils.highlightError(villeSearchInput);
            return false;
        }

        return true;
    },

    /**
     * Valider les champs requis d'un formulaire
     */
    validateRequiredFields: function() {
        var villeSearchInput = document.getElementById('ville-search');

        // Vérifier qu'une ville a été sélectionnée
        if (!villeSearchInput || !villeSearchInput.value.trim()) {
            this.showValidationMessage('Veuillez sélectionner une ville dans la liste des suggestions.');
            Utils.highlightError(villeSearchInput);
            return false;
        }

        // Vérifier qu'on a les données de ville
        var form = document.getElementById('lieu-form');
        var villeNomField = form ? form.querySelector('input[name="ville_nom"]') : null;
        var villeCodePostalField = form ? form.querySelector('input[name="ville_code_postal"]') : null;

        if (!villeNomField || !villeNomField.value || !villeCodePostalField || !villeCodePostalField.value) {
            this.showValidationMessage('Veuillez sélectionner une ville dans la liste des suggestions (pas de saisie libre).');
            Utils.highlightError(villeSearchInput);
            return false;
        }

        return true;
    },

    /**
     * Configurer la validation d'un formulaire
     */
    setupValidation: function(formId) {
        var form = document.getElementById(formId);
        var self = this;

        if (!form) return;

        // Écouter l'événement 'invalid' des champs
        var villeSelect = form.querySelector('select[id*="ville"]');
        if (villeSelect) {
            villeSelect.addEventListener('invalid', function(e) {
                e.preventDefault();
                self.showValidationMessage('Veuillez sélectionner une ville dans la liste des suggestions.');

                var villeSearchInput = document.getElementById('ville-search');
                Utils.highlightError(villeSearchInput);
            });
        }

        // Validation avant soumission
        form.addEventListener('submit', function(e) {
            if (!self.validateRequiredFields()) {
                e.preventDefault();
                return false;
            }
        });

        // Masquer les erreurs lors de la saisie
        var inputs = form.querySelectorAll('input, select, textarea');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('input', function() {
                self.hideValidationMessage();

                // Retirer le style d'erreur
                this.style.borderColor = '';
                this.style.boxShadow = '';
            });
        }
    },

    /**
     * Préparer les données d'un FormData pour l'envoi
     */
    prepareFormData: function(form) {
        var formData = new FormData(form);

        // S'assurer que les coordonnées sont correctement formatées
        var hasCoords = Coordinates.ensureInFormData(formData);

        if (!hasCoords) {
            throw new Error('Coordonnées GPS manquantes ou invalides');
        }

        // Corriger le format des coordonnées (virgule -> point)
        var latitude = formData.get('lieu[latitude]');
        var longitude = formData.get('lieu[longitude]');

        if (latitude) {
            formData.set('lieu[latitude]', Coordinates.formatForDatabase(latitude));
        }

        if (longitude) {
            formData.set('lieu[longitude]', Coordinates.formatForDatabase(longitude));
        }

        return formData;
    },

    /**
     * Soumettre un formulaire en AJAX
     */
    submitForm: function(form, options) {
        if (typeof options === 'undefined') options = {};
        var self = this;

        return new Promise(function(resolve, reject) {
            try {
                var formData = self.prepareFormData(form);

                // Ajouter le bouton de soumission si spécifié
                if (options.submitButton && options.submitButton.name) {
                    formData.set(options.submitButton.name, options.submitButton.value || '1');
                }

                Utils.fetchData(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }).then(function(response) {
                    resolve(response);
                }).catch(function(error) {
                    reject(new Error('Erreur lors de la soumission: ' + error.message));
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Vérifier si une réponse indique un succès
     */
    isSuccessResponse: function(responseText) {
        var hasSuccessMessage = responseText.indexOf('Lieu créé avec succès') !== -1 ||
            responseText.indexOf('success') !== -1 ||
            responseText.indexOf('uk-alert-success') !== -1;

        var hasErrorMessage = responseText.indexOf('Veuillez sélectionner une ville') !== -1 ||
            responseText.indexOf('Une erreur est survenue') !== -1 ||
            responseText.indexOf('uk-alert-danger') !== -1 ||
            responseText.indexOf('form-error') !== -1;

        if (hasErrorMessage) return false;
        if (hasSuccessMessage) return true;

        var hasFormErrors = responseText.indexOf('has-error') !== -1 ||
            responseText.indexOf('uk-form-danger') !== -1;

        return !hasFormErrors && responseText.indexOf('<!DOCTYPE html>') !== -1;
    },

    /**
     * Extraire un message d'erreur depuis une réponse HTML
     */
    extractErrorMessage: function(htmlContent) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Chercher les messages flash
        var flashMessages = tempDiv.querySelectorAll('.uk-alert-danger, .alert-danger');
        if (flashMessages.length > 0) {
            return flashMessages[0].textContent.trim();
        }

        // Chercher les erreurs de formulaire
        var formErrors = tempDiv.querySelectorAll('.uk-form-danger, .has-error, .form-error');
        if (formErrors.length > 0) {
            return formErrors[0].textContent.trim();
        }

        return 'Une erreur est survenue lors du traitement.';
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Forms;
} else {
    window.Forms = Forms;
}