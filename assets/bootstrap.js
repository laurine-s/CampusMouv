import { startStimulusApp } from '@symfony/stimulus-bundle';
import LieuController from './controllers/lieu_controller.js'; // <-- import direct

const app = startStimulusApp(); // démarre Stimulus
app.register('lieu', LieuController); // <-- enregistre ton contrôleur sous le nom "lieu"
