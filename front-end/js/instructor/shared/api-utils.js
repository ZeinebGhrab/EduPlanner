import { API_BASE_URL, getAuthHeaders } from '../../shared/config.js'


export function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '../authentification/auth.html';
}

export async function fetchFormateurProfile() {
    const res = await fetch(`${API_BASE_URL}/formateur/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Non authentifié');
    return res.json();
}

export async function fetchGroupes() {
    const res = await fetch(`${API_BASE_URL}/groupes`, { headers: getAuthHeaders() });
    return res.ok ? res.json() : [];
}

export async function fetchSalles() {
    const res = await fetch(`${API_BASE_URL}/salles`, { headers: getAuthHeaders() });
    return res.ok ? res.json() : [];
}

export async function fetchSessions(formateurId) {
    const res = await fetch(`${API_BASE_URL}/sessions/formateur/${formateurId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur chargement sessions');
    return res.json();
}

export async function fetchSessionsByDate(formateurId, date) {
    const res = await fetch(`${API_BASE_URL}/sessions/formateur/${formateurId}?date=${date}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur chargement sessions');
    return res.json();
}

export async function fetchUpcomingSessions(formateurId, limit = 3) {
    const res = await fetch(`${API_BASE_URL}/sessions/formateur/${formateurId}/upcoming?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur sessions à venir');
    return res.json();
}

export async function fetchSessionsWithFilters(formateurId, filters = {}) {
    let url = `${API_BASE_URL}/sessions/formateur/${formateurId}/filter?`;
    if (filters.groupeId) url += `groupeId=${filters.groupeId}&`;
    if (filters.salleId) url += `salleId=${filters.salleId}&`;
    if (filters.statut) url += `statut=${filters.statut}&`;
    if (filters.dateDebut) url += `dateDebut=${filters.dateDebut}&`;
    if (filters.dateFin) url += `dateFin=${filters.dateFin}&`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur récupération sessions');
    return res.json();
}

export async function updateSession(sessionId, sessionData) {
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    if (!res.ok) throw new Error('Erreur lors de l\'update de la session');
    return res.json();
}

export async function fetchDisponibilites(formateurId) {
    const res = await fetch(`${API_BASE_URL}/disponibilites/formateur/${formateurId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur récupération disponibilités');
    return res.json();
}

export async function createDisponibilite(disponibiliteData) {
    const res = await fetch(`${API_BASE_URL}/disponibilites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(disponibiliteData)
    });
    if (!res.ok) throw new Error('Erreur création disponibilité');
    return res.json();
}

export async function updateDisponibilite(disponibiliteId, disponibiliteData) {
    const res = await fetch(`${API_BASE_URL}/disponibilites/${disponibiliteId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(disponibiliteData)
    });
    if (!res.ok) throw new Error('Erreur modification disponibilité');
    return res.json();
}

export async function deleteDisponibilite(disponibiliteId) {
    const res = await fetch(`${API_BASE_URL}/disponibilites/${disponibiliteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Erreur suppression disponibilité');
    return res.ok;
}

export async function fetchMateriels() {
    const res = await fetch(`${API_BASE_URL}/materiels`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur récupération matériel');
    return res.json();
}

export async function fetchPlannings() {
    const res = await fetch(`${API_BASE_URL}/plannings`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur chargement plannings');
    return res.json();
}

export async function fetchStatistiques(formateurId) {
    const res = await fetch(`${API_BASE_URL}/formateurs/${formateurId}/statistiques`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Erreur statistiques');
    return res.json();
}
