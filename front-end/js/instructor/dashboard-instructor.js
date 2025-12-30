import { 
    fetchFormateurProfile, 
    fetchStatistiques,
    fetchSessionsByDate,
    fetchUpcomingSessions,
    logout
} from './shared/api-utils.js';

import { 
    animateNumber,
    showNotification,
    getStatusClass,
    getStatusIcon,
    getDayName,
    getMonthName,
    getTodayISO
} from './shared/ui-helpers.js';

import { updateUserUI } from '../shared/config.js';

let currentFormateur = null;
let todaySessions = [];
let upcomingSessions = [];


document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadFormateurInfo();
        await loadStatistics();
        await loadTodaySessions();
        await loadUpcomingSessions();
        initializeUserMenu();

        setInterval(async () => {
            await loadStatistics();
            await loadTodaySessions();
        }, 300000);
    } catch (err) {
        console.error('Erreur initialisation dashboard:', err);
        showNotification('Erreur de chargement des données', 'error');
    }
});

async function loadFormateurInfo() {
    try {
        currentFormateur = await fetchFormateurProfile();
        updateUserUI(currentFormateur);
    } catch (err) {
        console.error(err);
        logout();
    }
}


async function loadStatistics() {
    if (!currentFormateur) return;
    try {
        const stats = await fetchStatistiques(currentFormateur.id);
        updateStatCard(0, stats.sessionsAVenir || 0);
        updateStatCard(1, stats.sessionsTerminees || 0);
        updateStatCard(2, stats.etudiantsActifs || 0);
    } catch (err) {
        console.error(err);
        [0, 1, 2].forEach(i => updateStatCard(i, 0));
    }
}

function updateStatCard(index, value) {
    const statCards = document.querySelectorAll('.stat-card .stat-number');
    if (statCards[index]) animateNumber(statCards[index], value);
}

async function loadTodaySessions() {
    if (!currentFormateur) return;
    try {
        const today = getTodayISO();
        todaySessions = await fetchSessionsByDate(currentFormateur.id, today);
        console.log(todaySessions);
        displayTodaySessions(todaySessions);
    } catch (err) {
        console.error(err);
        displayTodaySessions([]);
    }
}

function displayTodaySessions(sessions) {
    const list = document.querySelector('.sessions-list');
    if (!list) return;

    if (sessions.length === 0) {
        list.innerHTML = `<div class="no-sessions"><i class="fas fa-calendar-day"></i><p>Aucune session aujourd'hui</p></div>`;
        return;
    }

    list.innerHTML = sessions.map(createSessionCard).join('');
}

function createSessionCard(session) {
    const statusClass = getStatusClass(session.statut);
    const statusLabel = session.statut || 'Planifié';
    const statusIcon = getStatusIcon(session.statut);

    return `
        <div class="session-card ${statusClass}">
            <div class="session-time">
                <span class="time"></span>
                <span class="duration">${(session.creneauxHoraires || []).join(', ')}</span>
            </div>
            <div class="session-details">
                <h4>${session.nomCours || 'Module non défini'}</h4>
                <div class="session-meta">
                    <span class="location"><i class="fas fa-map-marker-alt"></i> ${session.salleNom || 'Salle non définie'}</span>
                    <span class="students"><i class="fas fa-users"></i> ${session.etudiants.length || 0} étudiants</span>
                </div>
            </div>
            <div class="session-status">
                <span class="status-badge ${statusClass}"><i class="${statusIcon}"></i> ${statusLabel}</span>
            </div>
        </div>
    `;
}

async function loadUpcomingSessions() {
    if (!currentFormateur) return;
    try {
        upcomingSessions = await fetchUpcomingSessions(currentFormateur.id, 3);
        console.log(upcomingSessions);
        displayUpcomingSessions(upcomingSessions);
    } catch (err) {
        console.error(err);
        displayUpcomingSessions([]);
    }
}

function displayUpcomingSessions(sessions) {
    const list = document.querySelector('.upcoming-list');
    if (!list) return;

    if (sessions.length === 0) {
        list.innerHTML = `<div class="no-sessions"><i class="fas fa-calendar-times"></i><p>Aucune session à venir</p></div>`;
        return;
    }

    list.innerHTML = sessions.map(createUpcomingCard).join('');
}

function createUpcomingCard(session) {
    const date = new Date(session.date);
    return `
        <div class="upcoming-card">
            <div class="upcoming-date">
                <span class="day">${getDayName(date)}</span>
                <span class="date">${date.getDate()}</span>
                <span class="month">${getMonthName(date)}</span>
            </div>
            <div class="upcoming-details">
                <h4>${session.nomCours || 'Module non défini'}</h4>
                <p>${(session.creneauxHoraires || []).join(', ')} • ${session.salleNom || 'Salle TBD'}</p>
                <span class="group">${session.groupeNom || 'Groupe'} • ${session.etudiants?.length || 0} étudiants</span>
            </div>
        </div>
    `;
}


function initializeUserMenu() {
    const menu = document.querySelector('.user-menu');
    if (!menu) return;
    menu.addEventListener('click', e => { e.stopPropagation(); toggleUserDropdown(); });
    document.addEventListener('click', () => closeUserDropdown());
}

function toggleUserDropdown() {
    const menu = document.querySelector('.user-menu');
    if (!menu) return;
    let dropdown = document.querySelector('.user-dropdown');
    if (dropdown) { dropdown.remove(); return; }
    dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `<a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>`;
    menu.appendChild(dropdown);
}

function closeUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
}
