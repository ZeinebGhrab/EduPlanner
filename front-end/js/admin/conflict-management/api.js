import { showLoading, hideLoading, showToast, updateUI } from './ui.js';
import { API_ENDPOINTS } from './config.js';
import { setConflits, removeConflit, clearConflits, conflits } from './state.js';

export async function loadConflitsFromAPI() {
    try {
        console.log('Chargement des conflits depuis:', API_ENDPOINTS.getAllConflits);

        const response = await fetch(API_ENDPOINTS.getAllConflits, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('Aucun conflit trouvé dans la base de données');
                setConflits([]);
                return;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const conflitsData = await response.json();
        console.log(`${conflitsData.length} conflits reçus de l'API`);
        
        const transformedConflits = conflitsData.map(conflit => transformConflitFromAPI(conflit));
        setConflits(transformedConflits);

    } catch (error) {
        console.error('Erreur lors du chargement depuis l\'API:', error);
        setConflits([]);
        throw error;
    }
}

function transformConflitFromAPI(apiConflit) {
    const getSeveriteLabel = (severiteNum) => {
        switch (severiteNum) {
            case 1: return 'critique';
            case 2: return 'majeur';
            case 3: return 'mineur';
            default: return 'mineur';
        }
    };

    const getSeveriteDisplay = (severiteNum) => {
        switch (severiteNum) {
            case 1: return 'Critique';
            case 2: return 'Majeur';
            case 3: return 'Mineur';
            default: return 'Mineur';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatJour = (jour) => {
        const jours = {
            'MONDAY': 'Lundi', 'TUESDAY': 'Mardi', 'WEDNESDAY': 'Mercredi',
            'THURSDAY': 'Jeudi', 'FRIDAY': 'Vendredi', 'SATURDAY': 'Samedi', 'SUNDAY': 'Dimanche',
            'LUNDI': 'Lundi', 'MARDI': 'Mardi', 'MERCREDI': 'Mercredi',
            'JEUDI': 'Jeudi', 'VENDREDI': 'Vendredi', 'SAMEDI': 'Samedi', 'DIMANCHE': 'Dimanche'
        };
        return jours[jour?.toUpperCase()] || jour;
    };

    let creneauDisplay = 'Non spécifié';
    if (apiConflit.creneau) {
        const jour = formatJour(apiConflit.creneau.jourSemaine);
        creneauDisplay = `${jour} ${apiConflit.creneau.heureDebut || ''} - ${apiConflit.creneau.heureFin || ''}`;
    }

    let sessionsList = [];
    if (apiConflit.sessionsImpliquees && Array.isArray(apiConflit.sessionsImpliquees)) {
        sessionsList = apiConflit.sessionsImpliquees.map(session =>
            session.nom || session.code || `Session #${session.id}`
        );
    }

    const getTypeDisplay = (typeApi) => {
        const types = {
            'CONFLIT_SALLE': 'Conflit de salle',
            'CONFLIT_FORMATEUR': 'Conflit de formateur',
            'CONFLIT_MATERIEL': 'Conflit de matériel',
            'CONFLIT_GROUPE': 'Conflit de groupe',
            'CHEVAUCHEMENT_SESSION': 'Chevauchement de sessions',
            'CONTRAINTE_NON_RESPECTEE': 'Contrainte non respectée'
        };
        return types[typeApi] || typeApi;
    };

    const severiteNum = apiConflit.severite || 3;
    const severiteLabel = getSeveriteLabel(severiteNum);

    return {
        id: apiConflit.id,
        typeApi: apiConflit.type,
        typeDisplay: getTypeDisplay(apiConflit.type),
        severiteNum: severiteNum,
        severiteLabel: severiteLabel,
        severiteDisplay: getSeveriteDisplay(severiteNum),
        description: apiConflit.description || 'Conflit détecté',
        dateDetection: apiConflit.dateDetection,
        dateFormatted: formatDate(apiConflit.dateDetection),
        creneau: apiConflit.creneau,
        creneauDisplay: creneauDisplay,
        sessions: sessionsList,
        sessionsFull: apiConflit.sessionsImpliquees || []
    };
}

export async function deleteConflit(conflitId) {
    try {
        showLoading('Suppression du conflit...');

        const response = await fetch(API_ENDPOINTS.deleteConflit(conflitId), {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        removeConflit(conflitId);
        updateUI();
        showToast('success', 'Succès', 'Conflit supprimé de la base de données');

    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showToast('error', 'Erreur', 'Erreur lors de la suppression du conflit');
        throw error;
    } finally {
        hideLoading();
    }
}

export async function confirmDeleteAll() {
    try {
        showLoading('Suppression de tous les conflits...');

        const response = await fetch(API_ENDPOINTS.deleteAllConflits, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        clearConflits();
        updateUI();
        showToast('success', 'Succès', 'Tous les conflits ont été supprimés de la base de données');

    } catch (error) {
        console.error('Erreur lors de la suppression de tous les conflits:', error);
        showToast('error', 'Erreur', 'Erreur lors de la suppression des conflits');
    } finally {
        hideLoading();
    }
}

export async function deleteAllConflits() {
    if (conflits.length === 0) {
        showToast('info', 'Information', 'Aucun conflit à supprimer');
        return;
    }
    document.getElementById('conflitsCount').textContent = conflits.length;
    document.getElementById('deleteAllModal').classList.add('active');
}