import { getAuthHeaders, API_BASE_URL, updateUserUI } from '../../shared/config.js'
import { fetchEtudiantProfile } from '../shared/api-utils.js';

async function fetchFormations() {
    try {

        const etudiant = await fetchEtudiantProfile();
        updateUserUI(etudiant);
        const etudiantId = etudiant.id;

        const SESSIONS_API = `${API_BASE_URL}/etudiants/${etudiantId}/sessions`;
        const response = await fetch(SESSIONS_API, { headers: getAuthHeaders() });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const formations = await response.json();
        console.log(formations);
        return formations;
    } catch (error) {
        console.error('Erreur lors de la récupération des formations:', error);
        return [];
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Non défini';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function getStatusText(statut) {
    const statusMap = {
        'EN_COURS': 'En cours',
        'TERMINEE': 'Terminée',
        'A_VENIR': 'À venir'
    };
    return statusMap[statut] || statut;
}

function createFormationCard(formation) {
    const statusText = getStatusText(formation.statut);
    const statusClass = formation.statut === 'TERMINEE' ? 'completed' : 'active';

    return `
        <div class="formation-card ${statusClass}" data-id="${formation.id}" data-status="${formation.statut}">
            <div class="formation-header">
                <div class="formation-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            
            <div class="formation-content">
                <h3>${formation.titre}</h3>
                <p class="formation-description">${formation.nomGroupe}</p>
                
                <div class="formation-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>${formation.nomFormateur}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${formation.heureDebut} - ${formation.heureFin}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(formation.date)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let allFormations = [];

function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {

            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            const formationCards = document.querySelectorAll('.formation-card');

            formationCards.forEach(card => {
                const cardStatus = card.dataset.status;

                let shouldShow = true;

                if (filter === 'active') {
                    shouldShow = cardStatus === 'EN_COURS';
                } else if (filter === 'completed') {
                    shouldShow = cardStatus === 'TERMINEE';
                } else if (filter === 'upcoming') {
                    shouldShow = cardStatus === 'A_VENIR';
                } else if (filter === 'coming') {
                    shouldShow = cardStatus === 'PLANIFIEE';
                }

                card.style.display = shouldShow ? 'flex' : 'none';
            });

            updateFilterCounts(allFormations);
        });
    });
}



function updateFilterCounts(formations) {
    const counts = {
        active: formations.filter(f => f.statut === 'EN_COURS').length,
        completed: formations.filter(f => f.statut === 'TERMINEE').length,
        upcoming: formations.filter(f => f.statut === 'A_VENIR').length,
        coming: formations.filter(f => f.statut === 'PLANIFIEE').length
    };

    document.querySelectorAll('.filter-tab').forEach(tab => {
        const filter = tab.dataset.filter;
        const badge = tab.querySelector('.tab-badge');
        if (badge) {
            badge.textContent = counts[filter] || 0;
        }
    });
}


async function displayFormations() {
    const formationsGrid = document.querySelector('.formations-grid');
    if (!formationsGrid) return;

    formationsGrid.innerHTML = '<div class="loading">Chargement des formations...</div>';
    allFormations = await fetchFormations();
    formationsGrid.innerHTML = '';

    if (allFormations.length === 0) {
        formationsGrid.innerHTML = '<div class="no-data">Aucune formation disponible.</div>';
        return;
    }

    allFormations.forEach(f => formationsGrid.innerHTML += createFormationCard(f));
    updateFilterCounts(allFormations);
    initializeFilters();


    setTimeout(() => {
        document.querySelectorAll('.formation-card').forEach(card => {
            card.style.animationPlayState = 'running';
        });
    }, 100);
}

document.addEventListener('DOMContentLoaded', displayFormations);
