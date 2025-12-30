const API_BASE_URL = 'http://localhost:8080/api';
const API_MATERIELS = `${API_BASE_URL}/materiels`;

let equipements = [];
let currentEquipementId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredEquipements = [];
let currentFilter = 'all';
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
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

async function fetchEquipements() {
    try {
        showLoading();

        console.log('Récupération des équipements depuis:', API_MATERIELS);
        const data = await fetchAPI(API_MATERIELS);

        console.log('Données reçues:', data);
        equipements = data.map(item => ({
            id: item.id,
            nom: item.nom || 'Sans nom',
            type: item.type || 'Autre',
            quantite: item.quantiteDisponible || 0,
            etat: item.etat || 'bon'
        }));

        console.log('Équipements transformés:', equipements);

        updateUI();
        hideLoading();
        return equipements;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        hideLoading();
        showEmptyState(`Erreur de connexion: ${error.message}`);

        showToast('error', 'Erreur', `Impossible de charger les équipements: ${error.message}`);
        return [];
    }
}

async function createEquipement(equipementData) {
    try {
        console.log('Création d\'équipement:', equipementData);

        const data = await fetchAPI(API_MATERIELS, {
            method: 'POST',
            body: JSON.stringify({
                nom: equipementData.nom,
                type: equipementData.type,
                quantiteDisponible: equipementData.quantite,
                etat: equipementData.etat
            })
        });

        console.log('Équipement créé:', data);
        return data;
    } catch (error) {
        console.error('Erreur création:', error);
        throw error;
    }
}

async function updateEquipement(id, equipementData) {
    try {
        console.log('Mise à jour équipement', id, ':', equipementData);

        const data = await fetchAPI(`${API_MATERIELS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                id: id,
                nom: equipementData.nom,
                type: equipementData.type,
                quantiteDisponible: equipementData.quantite,
                etat: equipementData.etat
            })
        });

        console.log('Équipement mis à jour:', data);
        return data;
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        throw error;
    }
}

async function deleteEquipementAPI(id) {
    try {
        console.log('Suppression équipement:', id);

        const result = await fetchAPI(`${API_MATERIELS}/${id}`, {
            method: 'DELETE'
        });

        console.log('Équipement supprimé');
        return result || true;
    } catch (error) {
        console.error('Erreur suppression:', error);
        throw error;
    }
}
window.equipements = equipements;
window.currentEquipementId = currentEquipementId;
window.currentPage = currentPage;
window.itemsPerPage = itemsPerPage;
window.filteredEquipements = filteredEquipements;
window.currentFilter = currentFilter;
window.currentSort = currentSort;

window.fetchEquipements = fetchEquipements;
window.createEquipement = createEquipement;
window.updateEquipement = updateEquipement;
window.deleteEquipementAPI = deleteEquipementAPI;
