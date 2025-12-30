const API_BASE_URL = 'http://localhost:8080/api';
const API_SALLES = `${API_BASE_URL}/salles`;

let salles = [];
let currentSalleId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredSalles = [];
let currentSort = 'nom';

async function fetchAPI(url, options = {}) {
    try {
        const token = localStorage.getItem('authToken');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Requête API: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers
        });

        console.log(`Réponse API: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            let errorMessage = `Erreur ${response.status}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                const errorText = await response.text();
                if (errorText) errorMessage = errorText;
            }

            if (response.status === 401 || response.status === 403) {
                showToast('error', 'Session expirée', 'Veuillez vous reconnecter');
                setTimeout(() => {
                    window.location.href = '../../interface/authentification/auth.html';
                }, 3000);
            }

            throw new Error(errorMessage);
        }
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}


async function fetchSalles() {
    try {
        showLoading();

        console.log('Récupération des salles depuis:', API_SALLES);
        const data = await fetchAPI(API_SALLES);

        console.log('Données reçues:', data);
        salles = data.map(item => ({
            id: item.id,
            nom: item.nom || 'Sans nom',
            capacite: item.capacite || 0,
            type: item.type || 'salle_cours',
            batiment: item.batiment || 'Non spécifié',
            equipements: item.equipements || []
        }));

        console.log('Salles transformées:', salles);

        updateUI();
        hideLoading();
        return salles;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        hideLoading();

        showEmptyState(`Erreur de connexion: ${error.message}`);
        showToast('error', 'Erreur', `Impossible de charger les salles: ${error.message}`);
        return [];
    }
}

async function createSalle(salleData) {
    try {
        console.log('Création de salle:', salleData);
        const requestData = {
            nom: salleData.nom,
            capacite: salleData.capacite,
            batiment: salleData.batiment,
            type: salleData.type
        };

        console.log('Données envoyées:', requestData);

        const data = await fetchAPI(API_SALLES, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log('Salle créée:', data);
        return data;
    } catch (error) {
        console.error('Erreur création:', error);
        throw error;
    }
}

async function updateSalle(id, salleData) {
    try {
        console.log('Mise à jour salle', id, ':', salleData);

        const requestData = {
            nom: salleData.nom,
            capacite: salleData.capacite,
            batiment: salleData.batiment,
            type: salleData.type
        };

        const data = await fetchAPI(`${API_SALLES}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        console.log('Salle mise à jour:', data);
        return data;
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        throw error;
    }
}

async function deleteSalleAPI(id) {
    try {
        console.log('Suppression salle:', id);

        await fetchAPI(`${API_SALLES}/${id}`, {
            method: 'DELETE'
        });

        console.log('Salle supprimée');
        return true;
    } catch (error) {
        console.error('Erreur suppression:', error);
        throw error;
    }
}