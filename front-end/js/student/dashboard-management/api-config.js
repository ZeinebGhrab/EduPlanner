import { API_BASE_URL, getAuthHeaders, updateUserUI } from '../../shared/config.js';
import { fetchEtudiantProfile } from '../shared/api-utils.js'; 

// Récupérer toutes les statistiques de l'étudiant connecté
export async function fetchStatistiques() {
    try {
        // Récupérer l'ID de l'étudiant connecté
        const etudiant = await fetchEtudiantProfile();
        updateUserUI(etudiant);
        const etudiantId = etudiant.id;

        const response = await fetch(`${API_BASE_URL}/etudiants/${etudiantId}/statistiques`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const sessions = await response.json();
        return sessions;
    } catch (error) {
        console.error('Erreur lors de la récupération du statistique:', error);
        return [];
    }
}


// Récupérer toutes les groupes de l'étudiant connecté
export async function fetchGroupes() {
    try {
        // Récupérer l'ID de l'étudiant connecté
        const etudiant = await fetchEtudiantProfile();
        const etudiantId = etudiant.id;

        const response = await fetch(`${API_BASE_URL}/etudiants/${etudiantId}/groupes`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const sessions = await response.json();
        return sessions;
    } catch (error) {
        console.error('Erreur lors de la récupération du groupes:', error);
        return [];
    }
}

// Récupérer toutes les sessions à venir de l'étudiant connecté
export async function fetchSessionsVenir() {
    try {
        // Récupérer l'ID de l'étudiant connecté
        const etudiant = await fetchEtudiantProfile();
        const etudiantId = etudiant.id;

        const response = await fetch(`${API_BASE_URL}/etudiants/${etudiantId}/sessions/a-venir`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const sessions = await response.json();
        return sessions;
    } catch (error) {
        console.error('Erreur lors de la récupération du sessions à venir:', error);
        return [];
    }
}


// Récupérer toutes les planning de l'étudiant connecté
export async function fetchPlanning() {
    try {
        // Récupérer l'ID de l'étudiant connecté
        const etudiant = await fetchEtudiantProfile();
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