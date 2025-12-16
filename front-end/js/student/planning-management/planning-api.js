import { API_BASE_URL, getAuthHeaders, updateUserUI } from '../../shared/config.js';
import { fetchEtudiantProfile } from '../shared/api-utils.js'; 

// Récupérer toutes les sessions/planning de l'étudiant connecté
export async function fetchPlanning() {
    try {
        // Récupérer l'ID de l'étudiant connecté
        const etudiant = await fetchEtudiantProfile();
        updateUserUI(etudiant);
        const etudiantId = etudiant.id;

        const response = await fetch(`${API_BASE_URL}/etudiants/${etudiantId}/planning`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const sessions = await response.json();
        return sessions;
    } catch (error) {
        console.error('Erreur lors de la récupération du planning:', error);
        return [];
    }
}
