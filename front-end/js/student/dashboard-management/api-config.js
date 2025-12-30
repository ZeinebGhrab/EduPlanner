import { API_BASE_URL, getAuthHeaders, updateUserUI } from '../../shared/config.js';
import { fetchEtudiantProfile } from '../shared/api-utils.js'; 


export async function fetchStatistiques() {
    try {

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


export async function fetchGroupes() {
    try {

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

export async function fetchSessionsVenir() {
    try {

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

export async function fetchPlanning() {
    try {

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