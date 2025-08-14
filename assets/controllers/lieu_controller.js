import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['select', 'adresse', 'ville', 'codePostal'];

    connect() {

        this.onChange(); // init
    }

    onChange() {
        const opt = this.selectTarget.selectedOptions[0];
        const ds = opt?.dataset || {};
        this.adresseTarget.value    = ds.adresse    || '';
        this.villeTarget.value      = ds.ville      || '';
        this.codePostalTarget.value = ds.codePostal || '';
    }
}
