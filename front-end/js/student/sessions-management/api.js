// Configuration de l'API
const API_BASE_URL = 'http://localhost:8080/api';
const SESSIONS_API = `${API_BASE_URL}/sessions/etudiant`;

// Fonction pour récupérer toutes les formations
async function fetchFormations() {
    try {
        const response = await fetch(SESSIONS_API);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const formations = await response.json();
        return formations;
    } catch (error) {
        console.error('Erreur lors de la récupération des formations:', error);
        return [];
    }
}

// Fonction pour formater la date
function formatDate(dateString) {
    if (!dateString) return 'Non défini';

    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric'
    });
}

// Fonction pour convertir le statut
function getStatusText(statut) {
    const statusMap = {
        'EN_COURS': 'En cours',
        'TERMINEE': 'Terminée',
        'A_VENIR': 'À venir'
    };
    return statusMap[statut] || statut;
}

// Fonction pour générer une carte de formation HTML
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
                <p class="formation-description">${formation.description}</p>
                
                <div class="formation-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>${formation.nomFormateur}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${formation.duree} heures</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(formation.dateDebut)} - ${formatDate(formation.dateFin)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour afficher toutes les formations
async function displayFormations() {
    const formationsGrid = document.querySelector('.formations-grid');
    if (!formationsGrid) return;

    // Afficher un indicateur de chargement
    formationsGrid.innerHTML = '<div class="loading">Chargement des formations...</div>';

    // Récupérer les données
    const formations = await fetchFormations();

    // Vider le contenu
    formationsGrid.innerHTML = '';

    if (formations.length === 0) {
        formationsGrid.innerHTML = '<div class="no-data">Aucune formation disponible.</div>';
        return;
    }

    // Créer et ajouter les cartes
    formations.forEach(formation => {
        const cardHTML = createFormationCard(formation);
        formationsGrid.innerHTML += cardHTML;
    });

    // Mettre à jour les compteurs des filtres
    updateFilterCounts(formations);
}

// Fonction pour mettre à jour les compteurs des filtres
function updateFilterCounts(formations) {
    const counts = {
        active: formations.filter(f => f.statut === 'EN_COURS').length,
        completed: formations.filter(f => f.statut === 'TERMINEE').length,
        upcoming: formations.filter(f => f.statut === 'A_VENIR').length
    };

    // Mettre à jour les badges
    document.querySelectorAll('.tab-badge').forEach(badge => {
        const filter = badge.closest('.filter-tab').dataset.filter;
        if (counts[filter]) {
            badge.textContent = counts[filter];
        }
    });
}

// Variables globales pour partager entre fichiers
let allFormations = [];

// Fonction pour initialiser les filtres après chargement
function initializeFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const formationCards = document.querySelectorAll('.formation-card');

    filterTabs.forEach(tab => {
        // Supprime les anciens écouteurs
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);

        newTab.addEventListener('click', function () {
            const filter = this.dataset.filter;

            // Mise à jour des tabs actives
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Filtrage des cartes
            formationCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'flex';
                } else {
                    const cardStatus = card.dataset.status;
                    const shouldShow = filter === 'active' ? cardStatus === 'EN_COURS' :
                        filter === 'completed' ? cardStatus === 'TERMINEE' :
                            filter === 'upcoming' ? cardStatus === 'A_VENIR' : true;

                    card.style.display = shouldShow ? 'flex' : 'none';
                }
            });
        });
    });
}

// Fonction pour afficher toutes les formations
async function displayFormations() {
    const formationsGrid = document.querySelector('.formations-grid');
    if (!formationsGrid) return;

    // Afficher un indicateur de chargement
    formationsGrid.innerHTML = '<div class="loading">Chargement des formations...</div>';

    // Récupérer les données
    allFormations = await fetchFormations();

    // Vider le contenu
    formationsGrid.innerHTML = '';

    if (allFormations.length === 0) {
        formationsGrid.innerHTML = '<div class="no-data">Aucune formation disponible.</div>';
        return;
    }

    // Créer et ajouter les cartes
    allFormations.forEach(formation => {
        const cardHTML = createFormationCard(formation);
        formationsGrid.innerHTML += cardHTML;
    });

    // Mettre à jour les compteurs des filtres
    updateFilterCounts(allFormations);

    // Initialiser les filtres APRÈS avoir créé les cartes
    initializeFilters();

    // Lancer les animations
    setTimeout(() => {
        document.querySelectorAll('.formation-card').forEach(card => {
            card.style.animationPlayState = 'running';
        });
    }, 100);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    // Afficher les formations au chargement
    displayFormations();
});

// Exporter les fonctions pour formations.js
window.formationsAPI = {
    fetchFormations,
    displayFormations,
    allFormations
};