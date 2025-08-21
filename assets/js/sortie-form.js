/**
 * Gestionnaire du formulaire de création de sortie - VERSION ES5
 */

function SortieForm() {
    this.lieuxData = [];
    this.lieuToSelect = null;
    this.elements = {};
    this.init();
}

/**
 * Initialisation
 */
SortieForm.prototype.init = function() {
    this.loadData();
    this.getElements();

    if (!this.validateElements()) {
        return;
    }

    this.setupEventListeners();
    this.handleAutoSelection();
    this.setupSessionSave();
};

/**
 * Charger les données depuis le DOM
 */
SortieForm.prototype.loadData = function() {
    var appDataElement = document.getElementById('app-data');
    if (!appDataElement) return;

    try {
        var lieuxString = appDataElement.getAttribute('data-lieux');
        if (lieuxString) {
            this.lieuxData = JSON.parse(lieuxString);
        }

        this.lieuToSelect = appDataElement.getAttribute('data-lieu-to-select');
    } catch (error) {
        console.error('Erreur lors du parsing des données:', error);
    }
};

/**
 * Récupérer les éléments DOM
 */
SortieForm.prototype.getElements = function() {
    this.elements = {
        campusSelect: document.querySelector('select[name*="campus"]'),
        lieuSelect: document.querySelector('select[name*="lieu"]'),
        adresseField: document.getElementById('adresse-field'),
        villeField: document.getElementById('ville-field'),
        codePostalField: document.getElementById('codepostal-field'),
        form: document.getElementById('sortie-form')
    };
};

/**
 * Valider les éléments essentiels
 */
SortieForm.prototype.validateElements = function() {
    var required = ['campusSelect', 'lieuSelect'];
    var self = this;

    for (var i = 0; i < required.length; i++) {
        var elementName = required[i];
        if (!this.elements[elementName]) {
            console.error('Élément requis manquant: ' + elementName);
            return false;
        }
    }
    return true;
};

/**
 * Configuration des événements
 */
SortieForm.prototype.setupEventListeners = function() {
    var self = this;

    // Changement de campus
    this.elements.campusSelect.addEventListener('change', function() {
        self.filterLieux();
    });

    // Changement de lieu
    this.elements.lieuSelect.addEventListener('change', function() {
        self.updateAdresseInfo();
    });

    // Sauvegarde automatique
    if (this.elements.form) {
        var events = ['input', 'change'];
        for (var i = 0; i < events.length; i++) {
            this.elements.form.addEventListener(events[i], function() {
                self.saveToSession();
            });
        }
    }

    this.setupModalEvents();
};

/**
 * Configuration des événements de la modal
 */
SortieForm.prototype.setupModalEvents = function() {
    var lieuForm = document.getElementById('lieu-form');
    var modal = document.getElementById('mon-modal');
    var self = this;

    if (!lieuForm) return;

    // Synchroniser le campus lors de l'ouverture de la modal
    var ajoutLieuBtn = document.getElementById('ajoutLieu');
    if (ajoutLieuBtn) {
        ajoutLieuBtn.addEventListener('click', function() {
            var lieuCampusSelect = lieuForm.querySelector('select[name*="campus"]');
            if (lieuCampusSelect && self.elements.campusSelect.value) {
                lieuCampusSelect.value = self.elements.campusSelect.value;
            }
        });
    }

    // Gestion de la soumission du formulaire lieu
    lieuForm.addEventListener('submit', function(e) {
        var submitButton = e.submitter;
        if (submitButton && submitButton.name && submitButton.name.indexOf('createLieu') !== -1) {
            self.handleLieuFormSubmission(e, lieuForm, modal);
        }
    });
};

/**
 * Gérer la soumission du formulaire lieu
 */
SortieForm.prototype.handleLieuFormSubmission = function(event, lieuForm, modal) {
    event.preventDefault();
    var self = this;

    // Validation de l'autocomplétion
    if (!Forms.validateVilleAutocompletion()) {
        return;
    }

    Forms.submitForm(lieuForm, {
        submitButton: event.submitter
    }).then(function(response) {
        var contentType = response.headers.get('content-type');

        if (contentType && contentType.indexOf('application/json') !== -1) {
            return response.json().then(function(result) {
                if (result.success) {
                    return self.handleSuccessfulLieuCreation(
                        self.extractLieuFromForm(new FormData(lieuForm)),
                        modal
                    );
                } else {
                    Forms.showValidationMessage(result.error);
                }
            });
        } else {
            return response.text().then(function(result) {
                if (Forms.isSuccessResponse(result)) {
                    return self.handleSuccessfulLieuCreation(
                        self.extractLieuFromForm(new FormData(lieuForm)),
                        modal
                    );
                } else {
                    Forms.showValidationMessage(Forms.extractErrorMessage(result));
                }
            });
        }
    }).catch(function(error) {
        Forms.showValidationMessage('Erreur de connexion: ' + error.message);
    });
};

/**
 * Extraire les données du lieu depuis le formulaire
 */
SortieForm.prototype.extractLieuFromForm = function(formData) {
    var lieuData = {};

    // Approche compatible ES5 pour parcourir FormData
    var keys = ['lieu[nom]', 'lieu[rue]', 'lieu[campus]', 'ville_nom', 'ville_code_postal', 'ville_departement'];

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = formData.get(key);

        if (value) {
            if (key.indexOf('[nom]') !== -1) lieuData.nom = value;
            else if (key.indexOf('[rue]') !== -1) lieuData.rue = value;
            else if (key.indexOf('[campus]') !== -1) lieuData.campusId = value;
            else if (key === 'ville_nom') lieuData.villeNom = value;
            else if (key === 'ville_code_postal') lieuData.codePostal = value;
            else if (key === 'ville_departement') lieuData.departement = value;
        }
    }

    if (lieuData.villeNom && !lieuData.ville) {
        lieuData.ville = lieuData.villeNom;
    }

    return lieuData;
};

/**
 * Gérer le succès de la création du lieu
 */
SortieForm.prototype.handleSuccessfulLieuCreation = function(nouveauLieu, modal) {
    var self = this;

    return this.reloadLieuxData().then(function() {
        self.closeModal(modal);

        if (nouveauLieu.campusId) {
            self.elements.campusSelect.value = nouveauLieu.campusId;
            self.filterLieux();

            setTimeout(function() {
                self.selectNewlyCreatedLieu(nouveauLieu);
            }, 200);
        }

        self.resetLieuForm();
    }).catch(function(error) {
        console.error('Erreur lors de la gestion du succès:', error);
    });
};

/**
 * Recharger les données des lieux
 */
SortieForm.prototype.reloadLieuxData = function() {
    var self = this;

    return Utils.fetchData(window.location.href, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(function(response) {
        return response.text();
    }).then(function(html) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        var newAppData = tempDiv.querySelector('#app-data');
        if (newAppData) {
            var lieuxString = newAppData.getAttribute('data-lieux');
            if (lieuxString) {
                self.lieuxData = JSON.parse(lieuxString);
            }
        }
    }).catch(function(error) {
        console.error('Erreur rechargement données:', error);
    });
};

/**
 * Sélectionner le lieu nouvellement créé
 */
SortieForm.prototype.selectNewlyCreatedLieu = function(nouveauLieu) {
    var lieuTrouve = null;

    for (var i = 0; i < this.lieuxData.length; i++) {
        var lieu = this.lieuxData[i];
        if (lieu.nom === nouveauLieu.nom && lieu.campus && lieu.campus.id == nouveauLieu.campusId) {
            lieuTrouve = lieu;
            break;
        }
    }

    if (lieuTrouve) {
        this.elements.lieuSelect.value = lieuTrouve.id;
        this.updateAdresseInfo();
    } else {
        setTimeout(function() {
            window.location.reload();
        }, 1000);
    }
};

/**
 * Fermer la modal
 */
SortieForm.prototype.closeModal = function(modal) {
    if (modal && typeof UIkit !== 'undefined') {
        UIkit.modal(modal).hide();
    } else if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('uk-open');
    }
};

/**
 * Réinitialiser le formulaire de la modal
 */
SortieForm.prototype.resetLieuForm = function() {
    var lieuForm = document.getElementById('lieu-form');
    if (lieuForm) {
        lieuForm.reset();
        Forms.hideValidationMessage();
    }
};

/**
 * Filtrer les lieux par campus
 */
SortieForm.prototype.filterLieux = function() {
    var campusId = this.elements.campusSelect.value;

    this.elements.lieuSelect.innerHTML = '<option value="">Choisir un lieu</option>';
    this.clearAdresseFields();

    if (!campusId || !this.lieuxData.length) {
        return;
    }

    var lieuxFiltres = [];
    for (var i = 0; i < this.lieuxData.length; i++) {
        var lieu = this.lieuxData[i];
        if (lieu.campus && lieu.campus.id == campusId) {
            lieuxFiltres.push(lieu);
        }
    }

    for (var j = 0; j < lieuxFiltres.length; j++) {
        var lieu = lieuxFiltres[j];
        var option = new Option(lieu.nom, lieu.id);
        this.elements.lieuSelect.add(option);
    }
};

/**
 * Mettre à jour les informations d'adresse
 */
SortieForm.prototype.updateAdresseInfo = function() {
    var lieuId = this.elements.lieuSelect.value;

    if (!lieuId) {
        this.clearAdresseFields();
        this.notifyMapUpdate(null);
        return;
    }

    var lieu = null;
    for (var i = 0; i < this.lieuxData.length; i++) {
        if (this.lieuxData[i].id == lieuId) {
            lieu = this.lieuxData[i];
            break;
        }
    }

    if (!lieu) return;

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

    this.notifyMapUpdate(lieu);
};

/**
 * Notifier la carte d'un changement
 */
SortieForm.prototype.notifyMapUpdate = function(lieu) {
    // Via l'instance globale
    if (window.sortieMapInstance) {
        if (lieu && this.hasGPSCoordinates(lieu)) {
            window.sortieMapInstance.updateFromCoordinates(lieu);
        } else if (lieu) {
            window.sortieMapInstance.updateFromExternalData(lieu);
        } else {
            window.sortieMapInstance.clearMap();
        }
    }

    // Via événement personnalisé
    var event = new CustomEvent('sortie:lieuChanged', {
        detail: { lieu: lieu }
    });
    document.dispatchEvent(event);
};

/**
 * Vérifier si on a des coordonnées GPS
 */
SortieForm.prototype.hasGPSCoordinates = function(lieu) {
    // Vérifier dans les données du lieu
    if (lieu.latitude && lieu.longitude) {
        var lat = parseFloat(lieu.latitude);
        var lng = parseFloat(lieu.longitude);

        if (Coordinates.validate(lat, lng)) {
            return true;
        }
    }

    // Vérifier dans les champs du formulaire
    var coords = Coordinates.getFromForm();
    if (coords) {
        lieu.latitude = coords.latitude;
        lieu.longitude = coords.longitude;
        return true;
    }

    return false;
};

/**
 * Vider les champs d'adresse
 */
SortieForm.prototype.clearAdresseFields = function() {
    var fields = [this.elements.adresseField, this.elements.villeField, this.elements.codePostalField];

    for (var i = 0; i < fields.length; i++) {
        if (fields[i]) {
            fields[i].value = '';
        }
    }
};

/**
 * Sélection automatique d'un lieu
 */
SortieForm.prototype.handleAutoSelection = function() {
    if (!this.lieuToSelect) return;

    var lieu = null;
    for (var i = 0; i < this.lieuxData.length; i++) {
        if (this.lieuxData[i].id == this.lieuToSelect) {
            lieu = this.lieuxData[i];
            break;
        }
    }

    if (!lieu || !lieu.campus) return;

    var self = this;
    this.elements.campusSelect.value = lieu.campus.id;
    this.filterLieux();

    setTimeout(function() {
        self.elements.lieuSelect.value = self.lieuToSelect;
        self.updateAdresseInfo();
    }, 100);
};

/**
 * Gestion de la session
 */
SortieForm.prototype.setupSessionSave = function() {
    var self = this;

    this.loadFromSession();
    setInterval(function() {
        self.saveToSession();
    }, 10000);

    var submitButtons = this.elements.form ? this.elements.form.querySelectorAll('button[type="submit"], input[type="submit"]') : null;
    if (submitButtons) {
        for (var i = 0; i < submitButtons.length; i++) {
            submitButtons[i].addEventListener('click', function() {
                setTimeout(function() {
                    self.clearSession();
                }, 500);
            });
        }
    }
};

SortieForm.prototype.saveToSession = function() {
    if (!this.elements.form) return;

    try {
        var jsonData = {};
        var inputs = this.elements.form.querySelectorAll('input, select, textarea');

        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            if (input.name && input.type !== 'file') {
                jsonData[input.name] = input.value;
            }
        }

        sessionStorage.setItem('sortie_brouillon', JSON.stringify(jsonData));
    } catch (error) {
        console.error('Erreur sauvegarde session:', error);
    }
};

SortieForm.prototype.loadFromSession = function() {
    if (!this.elements.form) return;

    try {
        var savedData = sessionStorage.getItem('sortie_brouillon');
        if (!savedData) return;

        var data = JSON.parse(savedData);
        var self = this;

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var field = self.elements.form.querySelector('[name="' + key + '"]');
                if (field && field.type !== 'file') {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = (field.value === data[key]);
                    } else {
                        field.value = data[key];
                    }
                }
            }
        }

        if (this.elements.campusSelect.value) {
            this.filterLieux();
            if (this.elements.lieuSelect.value) {
                this.updateAdresseInfo();
            }
        }
    } catch (error) {
        console.error('Erreur restauration session:', error);
    }
};

SortieForm.prototype.clearSession = function() {
    sessionStorage.removeItem('sortie_brouillon');
};

/**
 * Initialisation
 */
function initSortieForm() {
    if (window.sortieFormInstance) return;
    window.sortieFormInstance = new SortieForm();
}

Utils.initializeWhenReady(initSortieForm);