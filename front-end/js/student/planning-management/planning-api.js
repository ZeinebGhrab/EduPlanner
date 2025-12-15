// Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Fonction pour récupérer le planning
async function fetchPlanning() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/etudiant/planning`);

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

// Fonction pour formater une date au format YYYY-MM-DD
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Exporter les fonctions pour une utilisation externe
window.planningAPI = {
    fetchPlanning,
    formatDateForAPI
};