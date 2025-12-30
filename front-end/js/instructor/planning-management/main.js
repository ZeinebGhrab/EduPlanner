import { initAvailabilityManagement } from './availability.js';
import { fetchFormateurProfile } from '../shared/api-utils.js';
import { showNotification } from '../shared/ui-helpers.js';
import { updateUserUI } from '../../shared/config.js';
import './calendar.js'; 


document.addEventListener('DOMContentLoaded', async () => {
    try {

        const formateur = await fetchFormateurProfile();

        updateUserUI(formateur);

        initAvailabilityManagement(formateur.id);

    } catch (err) {
        console.error('Erreur initialisation:', err);
        showNotification('Erreur lors du chargement des données', 'error');
    }
});