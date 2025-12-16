import { getAuthHeaders, API_BASE_URL } from '../../shared/config.js'

export async function fetchEtudiantProfile() {
    const res = await fetch(`${API_BASE_URL}/etudiant/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Non authentifié');
    return res.json();
}