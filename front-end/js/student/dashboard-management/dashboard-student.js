import { fetchStatistiques, fetchGroupes, fetchSessionsVenir, fetchPlanning } from './api-config.js';
import { updateStatistics } from './modules/statistics.js';
import { displayUpcomingSessions } from './modules/planning.js';
import { displayGroups } from './modules/groups.js';
import { displayNextSessions } from './modules/sessions.js';
import './modules/styles.js';

// ----------------------
// Configuration des sections
// ----------------------
const sectionsConfig = {
    statistics: { fetch: fetchStatistiques, render: updateStatistics, default: null },
    planning: { fetch: fetchPlanning, render: displayUpcomingSessions, default: [] },
    groups: { fetch: fetchGroupes, render: displayGroups, default: [] },
    sessions: { fetch: fetchSessionsVenir, render: displayNextSessions, default: [] },
};

// ----------------------
// État global
// ----------------------
let dashboardData = {
    stats: null,
    planning: null,
    groupes: null,
    sessions: null,
};

let isLoading = false;

// ----------------------
// Chargement de toutes les données
// ----------------------
async function loadAllData() {
    const fetchPromises = Object.entries(sectionsConfig).map(async ([key, config]) => {
        try {
            const result = await config.fetch();
            dashboardData[key] = result ?? config.default;
        } catch (err) {
            console.warn(`Erreur fetch ${key}:`, err);
            dashboardData[key] = config.default;
        }
    });
    await Promise.all(fetchPromises);
}

// ----------------------
// Rendu de toutes les sections
// ----------------------
function renderAllSections() {
    Object.entries(sectionsConfig).forEach(([key, config]) => {
        const data = dashboardData[key];
        if (data !== null && data !== undefined) {
            try { config.render(data); } 
            catch (err) { console.error(`Erreur rendu ${key}:`, err); }
        }
    });
}

// ----------------------
// État de chargement
// ----------------------
function showLoadingState() {
    const selectors = ['.schedule-cards', '#groupsContainer', '.sessions-container'];
    selectors.forEach(sel => {
        const container = document.querySelector(sel);
        if (container) container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Chargement en cours...</p>
            </div>
        `;
    });
}

function hideLoadingState() {
    document.querySelectorAll('.loading-state').forEach(el => el.remove());
}

// ----------------------
// Gestion des erreurs
// ----------------------
function showErrorState(error) {
    const container = document.querySelector('.dashboard-main');
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur de chargement</h3>
            <p>Impossible de charger certaines données du dashboard.</p>
            <button onclick="location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Réessayer
            </button>
        </div>
    `;
    container.prepend(errorDiv);
}

// ----------------------
// Rafraîchissement global ou par section
// ----------------------
async function refreshDashboard() {
    if (isLoading) return;
    isLoading = true;
    showLoadingState();

    try {
        await loadAllData();
        renderAllSections();
    } catch (error) {
        showErrorState(error);
    } finally {
        isLoading = false;
        hideLoadingState();
    }
}

async function refreshSection(sectionName) {
    const config = sectionsConfig[sectionName];
    if (!config) return console.warn(`⚠️ Section inconnue: ${sectionName}`);

    try {
        const result = await config.fetch();
        dashboardData[sectionName] = result ?? config.default;
        config.render(dashboardData[sectionName]);
    } catch (err) {
        console.error(`Erreur rafraîchissement ${sectionName}:`, err);
    }
}

// ----------------------
// Initialisation au chargement
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = { refreshDashboard, refreshSection };
    refreshDashboard();
});

// ----------------------
// Rafraîchissement automatique
// ----------------------
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
if (AUTO_REFRESH_INTERVAL > 0) {
    setInterval(() => {
        if (!isLoading) refreshDashboard();
    }, AUTO_REFRESH_INTERVAL);
}

export { dashboardData, refreshDashboard, refreshSection };
