import { initAvailabilityManagement } from './availability.js';
import { fetchFormateurProfile } from '../shared/api-utils.js';
import { updateUserUI, showNotification } from '../shared/ui-helpers.js';
import './calendar.js'; 

// Initialisation après DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Récupérer le profil du formateur
        const formateur = await fetchFormateurProfile();
        
        // Afficher le nom dans l'interface
        updateUserUI(formateur);

        // Initialiser la gestion des disponibilités
        initAvailabilityManagement(formateur.id);

        // Le code du calendrier s'exécutera automatiquement via calendar.js
    } catch (err) {
        console.error('Erreur initialisation:', err);
        showNotification('Erreur lors du chargement des données', 'error');
    }
});