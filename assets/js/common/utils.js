/**
 * Utilitaires généraux réutilisables
 */

const Utils = {
    /**
     * Attendre qu'une condition soit remplie avec timeout
     */
    waitFor(condition, callback, maxAttempts = 50) {
        let attempts = 0;

        const check = () => {
            attempts++;

            if (condition()) {
                callback();
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(check, 100);
            } else {
                console.error('Timeout atteint pour la condition');
            }
        };

        check();
    },

    /**
     * Debounce une fonction
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Nettoyer les suggestions d'autocomplétion
     */
    hideSuggestions(type) {
        const container = document.getElementById(`${type}-suggestions`);
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    },

    /**
     * Afficher un message de chargement
     */
    showLoading(type, message = 'Recherche en cours...') {
        const container = document.getElementById(`${type}-suggestions`);
        if (container) {
            container.innerHTML = `<div class="loading">${message}</div>`;
            container.style.display = 'block';
        }
    },

    /**
     * Afficher un message d'erreur
     */
    showError(type, message = 'Erreur de connexion') {
        const container = document.getElementById(`${type}-suggestions`);
        if (container) {
            container.innerHTML = `<div class="loading">${message}</div>`;
            container.style.display = 'block';
        }
    },

    /**
     * Initialisation sécurisée du DOM
     */
    initializeWhenReady(initFunction) {
        const init = () => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initFunction);
            } else {
                initFunction();
            }
        };

        init();

        // Support Turbo/SPA
        document.addEventListener('turbo:load', initFunction);
        window.addEventListener('load', initFunction);
    },

    /**
     * Créer des champs cachés dans un formulaire
     */
    createHiddenFields(form, fields) {
        if (!form) return;

        fields.forEach(field => {
            // Supprimer l'ancien champ s'il existe
            const existing = form.querySelector(`input[name="${field.name}"]`);
            if (existing) {
                existing.remove();
            }

            // Créer le nouveau champ
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = field.name;
            hiddenField.value = field.value;
            form.appendChild(hiddenField);
        });
    },

    /**
     * Mettre en évidence un champ en erreur
     */
    highlightError(field, duration = 3000) {
        if (!field) return;

        field.focus();
        field.style.borderColor = '#dc3545';
        field.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';

        setTimeout(() => {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }, duration);
    },

    /**
     * Faire une requête fetch avec gestion d'erreur
     */
    async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response;
        } catch (error) {
            console.error('Erreur de requête:', error);
            throw error;
        }
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}