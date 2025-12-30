let etudiants = [];
let groupes = [];
let currentEtudiantId = null;
let currentViewMode = 'groupes';
const SPRING_API_URL = 'http://localhost:8080';

const API_ENDPOINTS = {
    etudiants: `${SPRING_API_URL}/api/etudiants`,
    groupes: `${SPRING_API_URL}/api/groupes`,
    health: `${SPRING_API_URL}/actuator/health`
};
async function initializeApp() {
    if (document.readyState !== 'complete') {
        await new Promise(resolve => window.addEventListener('load', resolve));
    }

    removeAllToasts();
    closeAllModals();
    setupEventListeners();
    setupModalListeners();

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.visibility = 'hidden';
        mainContent.style.display = 'block';
    }

    const groupsContainer = document.getElementById('groupsContainer');
    if (groupsContainer) {
        groupsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Chargement des données...</h3>
                    <p>Connexion au serveur en cours</p>
                </div>
            </div>
        `;
    }

    try {
        const isAPIAvailable = await checkAPIConnection();
        if (isAPIAvailable) {
            await loadDataFromAPI();
        } else {
            console.error('API non disponible.');
        }
        updateUI();
        updateConnectionStatus();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        updateUI();
        updateConnectionStatus();
    }

    if (mainContent) {
        setTimeout(() => {
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
            mainContent.style.transition = 'opacity 0.3s ease-in-out';
        }, 100);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
async function loadDataFromAPI() {
    try {
        const etudiantsData = await apiRequest(API_ENDPOINTS.etudiants);
        etudiants = Array.isArray(etudiantsData) ? etudiantsData : [];
    } catch (etudiantError) { etudiants = []; }

    try {
        const groupesData = await apiRequest(API_ENDPOINTS.groupes);
        groupes = Array.isArray(groupesData) ? groupesData : [];
    } catch (groupeError) { groupes = []; }
}
function updateConnectionStatus() {
    let statusContainer = document.getElementById('connectionStatus');
    if (!statusContainer) {
        const header = document.querySelector('.page-header');
        if (header) {
            statusContainer = document.createElement('div');
            statusContainer.id = 'connectionStatus';
            statusContainer.className = 'connection-status-indicator';
            header.insertBefore(statusContainer, header.firstChild);
        }
    }
}
window.etudiants = etudiants;
window.groupes = groupes;
window.API_ENDPOINTS = API_ENDPOINTS;
window.initializeApp = initializeApp;
