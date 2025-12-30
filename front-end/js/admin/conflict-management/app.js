// ========================================================================
// 1. CONFIGURATION
// ========================================================================

const API_BASE_URL = 'http://localhost:8080/api';

let DEFAULT_PLANNING_ID = 1; 
let currentPlanningId = DEFAULT_PLANNING_ID;

const API_ENDPOINTS = {
    getAllConflits: `${API_BASE_URL}/conflits`,
    getConflitById: (id) => `${API_BASE_URL}/conflits/${id}`,
    deleteConflit: (id) => `${API_BASE_URL}/conflits/${id}`,
    deleteAllConflits: `${API_BASE_URL}/conflits`,
    analyseResolution: (planningId) => `${API_BASE_URL}/admin/planning/resolution/analyse/${planningId}`,
    appliquerSolution: `${API_BASE_URL}/admin/planning/resolution/appliquer-solution`,
    resoudreTout: (planningId) => `${API_BASE_URL}/admin/planning/resolution/resoudre-tout/${planningId}`
};

function setCurrentPlanningId(id) {
    currentPlanningId = id;
    DEFAULT_PLANNING_ID = id;
    console.log('Planning ID mis à jour:', currentPlanningId);
}

// récupérer le planning ID depuis les conflits
function detectPlanningId() {
    if (conflits.length > 0) {
        for (const conflit of conflits) {
            if (conflit.sessionsFull && conflit.sessionsFull.length > 0) {
                const session = conflit.sessionsFull[0];
                if (session.planning && session.planning.id) {
                    setCurrentPlanningId(session.planning.id);
                    return session.planning.id;
                }
            }
        }
    }
    return DEFAULT_PLANNING_ID;
}

// ========================================================================
// 2. ÉTAT GLOBAL
// ========================================================================

let conflits = [];
let currentConflitId = null;
let currentPage = 1;
const itemsPerPage = 10;

function setConflits(newConflits) {
    conflits = newConflits;
}

function setCurrentConflitId(id) {
    currentConflitId = id;
}

function setCurrentPage(page) {
    currentPage = page;
}

function getConflitById(id) {
    return conflits.find(c => c.id === id);
}

function removeConflit(conflitId) {
    const index = conflits.findIndex(c => c.id === conflitId);
    if (index !== -1) {
        conflits.splice(index, 1);
    }
}

function clearConflits() {
    conflits = [];
}

// ========================================================================
// 3. FONCTIONS UI
// ========================================================================

function showLoading(message = 'Chargement...') {
    const loadingIndicator = document.getElementById('globalLoading');
    const loadingMessage = document.getElementById('loadingMessage');

    if (loadingIndicator && loadingMessage) {
        loadingMessage.textContent = message;
        loadingIndicator.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingIndicator = document.getElementById('globalLoading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 5000);
}

function updateUI() {
    detectPlanningId();
    updateStats();
    renderConflitsTable();
}

function updateStats() {
    const totalConflits = conflits.length;
    const conflitsSalles = conflits.filter(c => c.typeApi === 'CONFLIT_SALLE').length;
    const conflitsFormateurs = conflits.filter(c => c.typeApi === 'CONFLIT_FORMATEUR').length;
    const conflitsMateriel = conflits.filter(c => c.typeApi === 'CONFLIT_MATERIEL').length;

    document.getElementById('totalConflits').textContent = totalConflits;
    document.getElementById('conflitsSalles').textContent = conflitsSalles;
    document.getElementById('conflitsFormateurs').textContent = conflitsFormateurs;
    document.getElementById('conflitsMateriel').textContent = conflitsMateriel;
}
function renderConflitsTable() {
    const tbody = document.getElementById('conflitsTableBody');
    const tableCount = document.getElementById('tableCount');
    const pagination = document.getElementById('tablePagination');

    if (!tbody) return;

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filterType')?.value || '';
    const severiteFilter = document.getElementById('filterSeverite')?.value || '';

    let filteredConflits = conflits.filter(conflit => {
        if (searchTerm) {
            const searchStr = `
                ${conflit.description || ''}
                ${conflit.typeDisplay || ''}
                ${conflit.severiteDisplay || ''}
            `.toLowerCase();

            if (!searchStr.includes(searchTerm)) return false;
        }
        if (typeFilter && conflit.typeApi !== typeFilter) return false;
        if (severiteFilter && conflit.severiteNum !== parseInt(severiteFilter)) return false;

        return true;
    });

    const totalItems = filteredConflits.length;
    tableCount.textContent = `${totalItems} conflit${totalItems !== 1 ? 's' : ''} trouvé${totalItems !== 1 ? 's' : ''}`;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageConflits = filteredConflits.slice(startIndex, endIndex);

    if (pageConflits.length === 0) {
        if (conflits.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-database"></i>
                            <h3>Aucun conflit dans la base de données</h3>
                            <p>Les conflits détectés automatiquement apparaîtront ici</p>
                            <button class="btn btn-sm btn-primary" onclick="refreshConflits()">
                                <i class="fas fa-sync-alt"></i> Actualiser
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-content">
                            <i class="fas fa-search"></i>
                            <h3>Aucun conflit ne correspond aux critères</h3>
                            <button class="btn btn-sm btn-primary" onclick="resetFilters()">
                                <i class="fas fa-redo"></i> Réinitialiser les filtres
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    pageConflits.forEach(conflit => {
        const severiteClass = `severite-${conflit.severiteLabel}`;

        html += `
            <tr class="${severiteClass}">
                <td><strong>#${conflit.id}</strong></td>
                <td>
                    <span class="type-badge type-${conflit.typeApi.toLowerCase()}">
                        ${conflit.typeDisplay}
                    </span>
                </td>
                <td>
                    <div class="conflit-info">
                        <h4>${conflit.description}</h4>
                        ${conflit.sessions && conflit.sessions.length > 0 ? `
                            <div class="sessions-list">
                                <small>Sessions concernées: ${conflit.sessions.join(', ')}</small>
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <span class="severite-badge ${severiteClass}">
                        ${conflit.severiteDisplay}
                    </span>
                </td>
                <td>${conflit.creneauDisplay}</td>
                <td>${conflit.dateFormatted}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn details" onclick="viewConflitDetails(${conflit.id})" title="Voir détails">
                            <i class="fas fa-file-alt"></i>
                        </button>
                        <button class="action-btn solutions" onclick="showSolutions(${conflit.id})" title="Voir les solutions">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${conflit.id}, '${conflit.description.replace(/'/g, "\\'")}', )" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('tablePagination');
    if (!pagination || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(conflits.length / itemsPerPage);

    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        renderConflitsTable();
    }
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterSeverite').value = '';
    setCurrentPage(1);
    renderConflitsTable();
}

function showEmptyState(message) {
    const tbody = document.getElementById('conflitsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-content">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>${message}</h3>
                        <p>Vérifiez la connexion au serveur Spring Boot</p>
                        <button class="btn btn-sm btn-primary" onclick="refreshConflits()">
                            <i class="fas fa-redo"></i> Réessayer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================================================
// 4. FONCTIONS API
// ========================================================================

async function loadConflitsFromAPI() {
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

    
        planningId: apiConflit.planningId ?? null,

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

async function deleteConflit(conflitId) {
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

async function confirmDeleteAll() {
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

function deleteAllConflits() {
    if (conflits.length === 0) {
        showToast('info', 'Information', 'Aucun conflit à supprimer');
        return;
    }
    document.getElementById('conflitsCount').textContent = conflits.length;
    document.getElementById('deleteAllModal').classList.add('active');
}

// ========================================================================
// 5. GESTION DES MODALS
// ========================================================================

function viewConflitDetails(conflitId) {
    console.log('Ouverture des détails pour le conflit:', conflitId);

    const conflit = getConflitById(conflitId);
    if (!conflit) {
        showToast('error', 'Erreur', 'Conflit non trouvé');
        return;
    }

    setCurrentConflitId(conflitId);
    document.getElementById('modalConflitTitle').textContent = `Détails du Conflit #${conflit.id}`;

    const typeBadge = document.getElementById('modalConflitType');
    const severiteBadge = document.getElementById('modalConflitSeverite');

    if (typeBadge) {
        typeBadge.textContent = conflit.typeDisplay;
    }

    if (severiteBadge) {
        severiteBadge.textContent = conflit.severiteDisplay;
        severiteBadge.className = `conflit-severite-badge severite-${conflit.severiteLabel}`;
    }

    const idElement = document.getElementById('modalConflitId');
    const dateElement = document.getElementById('modalConflitDate');
    const descriptionElement = document.getElementById('modalConflitDescription');
    const creneauElement = document.getElementById('modalConflitCreneau');

    if (idElement) idElement.textContent = conflit.id;
    if (dateElement) dateElement.textContent = conflit.dateFormatted;
    if (descriptionElement) descriptionElement.textContent = conflit.description;
    if (creneauElement) creneauElement.textContent = conflit.creneauDisplay;

    const sessionsContainer = document.getElementById('modalSessionsConflit');
    if (sessionsContainer) {
        if (conflit.sessions && conflit.sessions.length > 0) {
            sessionsContainer.innerHTML = conflit.sessions.map((session, index) => `
                <div class="conflict-item">
                    <strong>Session ${index + 1}:</strong> ${session}
                </div>
            `).join('');
        } else {
            sessionsContainer.innerHTML = '<div class="conflict-item">Aucune session spécifiée</div>';
        }
    }

    document.getElementById('conflitModal').classList.add('active');
}

// ======================================================================
// FONCTION showSolutions 
// ======================================================================
async function showSolutions(conflitId) {
    console.log('Ouverture des solutions pour le conflit:', conflitId);

    const conflit = getConflitById(conflitId);
    if (!conflit) {
        showToast('error', 'Erreur', 'Conflit non trouvé');
        return;
    }

    setCurrentConflitId(conflitId);

    // ==================================================================
    //1. RÉCUPÉRATION FIABLE DU PLANNING ID
    // ==================================================================
    let planningId =
        conflit.planningId ??
        conflit.sessionsFull?.[0]?.planningId ??
        currentPlanningId ??
        DEFAULT_PLANNING_ID;

    if (!planningId) {
        console.error(' Impossible de déterminer le planningId:', conflit);
        showToast(
            'error',
            'Erreur de données',
            'Aucun planning associé à ce conflit.'
        );
        return;
    }

    // Mettre à jour le planning global
    setCurrentPlanningId(planningId);

    console.log('Planning ID utilisé:', planningId);

    // ==================================================================
    // 2. PRÉPARATION DU MODAL
    // ==================================================================
    const titleElement = document.getElementById('solutionsModalTitle');
    if (titleElement) {
        titleElement.textContent = `Solutions pour : ${conflit.typeDisplay}`;
    }

    const solutionsGrid = document.getElementById('solutionsGrid');
    if (!solutionsGrid) {
        console.error('Élément solutionsGrid introuvable');
        return;
    }

    solutionsGrid.innerHTML = `
        <div class="loading-solutions">
            <i class="fas fa-spinner fa-spin"></i>
            Chargement des solutions...
        </div>
    `;

    // ==================================================================
    // 3. APPEL API AVEC LE BON PLANNING ID
    // ==================================================================
    try {
        showLoading('Analyse des solutions disponibles...');

        const url = API_ENDPOINTS.analyseResolution(planningId);
        console.log(' Appel API:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log(' Résultat analyse complète:', result);

        // ==================================================================
        // 4. EXTRACTION DU CONFLIT DANS LA RÉPONSE
        // ==================================================================
        const conflitData = result.conflits?.find(c => c.id === conflitId);

        console.log('Conflit trouvé dans la réponse:', conflitData);
        console.log('Solutions reçues:', conflitData?.solutions);

        if (!conflitData) {
            solutionsGrid.innerHTML = `
                <div class="no-solutions">
                    <i class="fas fa-info-circle"></i>
                    <h3>Conflit non trouvé dans l'analyse</h3>
                    <p>Le conflit #${conflitId} n'a pas été trouvé dans la réponse du serveur.</p>
                </div>
            `;
            document.getElementById('solutionsModal').classList.add('active');
            return;
        }

        if (!Array.isArray(conflitData.solutions) || conflitData.solutions.length === 0) {
            solutionsGrid.innerHTML = `
                <div class="no-solutions">
                    <i class="fas fa-info-circle"></i>
                    <h3>Aucune solution disponible</h3>
                    <p>Ce conflit ne peut pas être résolu automatiquement.</p>
                    <p class="text-muted">Type: ${conflitData.type}</p>
                </div>
            `;
            document.getElementById('solutionsModal').classList.add('active');
            return;
        }

        // ==================================================================
        // 5. AFFICHAGE DES SOLUTIONS
        // ==================================================================
        console.log(` Affichage de ${conflitData.solutions.length} solution(s)`);
        afficherSolutionsDetaillees(conflitData.solutions, conflitId);

    } catch (error) {
        console.error(' Erreur chargement solutions:', error);

        solutionsGrid.innerHTML = `
            <div class="no-solutions error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
                <p class="text-muted">Vérifiez la console pour plus de détails</p>
            </div>
        `;

        showToast('error', 'Erreur', 'Impossible de charger les solutions');

    } finally {
        hideLoading();
        document.getElementById('solutionsModal').classList.add('active');
    }
}


// FONCTION CORRIGÉE POUR AFFICHER LES SOLUTIONS
function afficherSolutionsDetaillees(solutions, conflitId) {
    const solutionsGrid = document.getElementById('solutionsGrid');

    solutionsGrid.innerHTML = '';

    solutions.forEach((solution, index) => {
        const solutionCard = document.createElement('div');
        solutionCard.className = 'solution-card-enhanced';
        solutionCard.dataset.solutionId = `solution-${conflitId}-${index}`;
        solutionCard.dataset.conflitId = conflitId;
        solutionCard.dataset.solutionType = solution.type;
        solutionCard.dataset.solutionData = JSON.stringify(solution.data || {});

        let impactClass = 'impact-faible';
        if (solution.impact && typeof solution.impact === 'string') {
            const impact = solution.impact.toLowerCase();
            if (impact.includes('élevé')) impactClass = 'impact-eleve';
            else if (impact.includes('moyen')) impactClass = 'impact-moyen';
        }

        const isApplicable = solution.applicable !== false;

        solutionCard.innerHTML = `
            <div class="solution-selection">
                <input type="checkbox" 
                       class="solution-checkbox" 
                       id="checkbox-${conflitId}-${index}"
                       data-solution-index="${index}"
                       ${!isApplicable ? 'disabled' : ''}>
                <label for="checkbox-${conflitId}-${index}" class="checkbox-label"></label>
            </div>
            <div class="solution-header-enhanced">
                <div class="solution-icon-enhanced">
                    <i class="${solution.icon || 'fas fa-lightbulb'}"></i>
                </div>
                <div class="solution-info">
                    <h3 class="solution-title">${solution.label || solution.title}</h3>
                    <span class="solution-impact ${impactClass}">
                        Impact: ${solution.impact || 'Variable'}
                    </span>
                </div>
            </div>
            <div class="solution-body-enhanced">
                <p class="solution-description">${solution.description}</p>
                
                ${solution.data && solution.data.options ? `
                    <div class="solution-options">
                        <h4><i class="fas fa-cog"></i> Options disponibles:</h4>
                        <ul>
                            ${renderSolutionOptions(solution.data.options, solution.type)}
                        </ul>
                    </div>
                ` : ''}
                
                ${!isApplicable ? `
                    <div class="solution-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Solution non applicable automatiquement</span>
                    </div>
                ` : ''}
            </div>
            <div class="solution-footer-enhanced">
                <button 
                    class="btn btn-sm ${isApplicable ? 'btn-success' : 'btn-secondary'}" 
                    onclick="appliquerSolutionUnique(${conflitId}, '${solution.type}', ${index})"
                    ${!isApplicable ? 'disabled' : ''}
                >
                    <i class="fas ${isApplicable ? 'fa-check' : 'fa-ban'}"></i>
                    ${isApplicable ? 'Appliquer seule' : 'Non applicable'}
                </button>
            </div>
        `;

        solutionsGrid.appendChild(solutionCard);
    });

    document.querySelectorAll('.solution-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleSolutionCard(this);
        });
    });

    updateSelectionCount();
}

function renderSolutionOptions(options, type) {
    if (!options || options.length === 0) return '';

    const limitedOptions = options.slice(0, 5);

    return limitedOptions.map(option => {
        let optionText = '';

        switch (type) {
            case 'CHANGER_FORMATEUR':
                optionText = `${option.nom || 'Formateur'} - ${option.specialite || 'N/A'}`;
                break;
            case 'CHANGER_SALLE':
                optionText = `${option.nom || 'Salle'} (Capacité: ${option.capacite || 'N/A'}, ${option.batiment || 'N/A'})`;
                break;
            case 'CHANGER_CRENEAU':
            case 'CHANGER_CRENEAU_COMPLET':
                optionText = `${option.jour || ''} ${option.heureDebut || ''} - ${option.heureFin || ''}`;
                break;
            default:
                optionText = option.nom || option.label || JSON.stringify(option);
        }

        return `<li><i class="fas fa-check-circle"></i> ${optionText}</li>`;
    }).join('') + (options.length > 5 ? `<li><i>... et ${options.length - 5} autre(s)</i></li>` : '');
}

function toggleSolutionCard(checkbox) {
    const card = checkbox.closest('.solution-card-enhanced');
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    updateSelectionCount();
}

function updateSelectionCount() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:not(:disabled)');
    const checkedCount = document.querySelectorAll('.solution-checkbox:checked').length;

    const countElement = document.getElementById('selectedCount');
    const applyBtn = document.getElementById('applySelectedBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');

    if (countElement) {
        countElement.textContent = `${checkedCount} solution(s) sélectionnée(s)`;
    }

    if (applyBtn) {
        applyBtn.disabled = checkedCount === 0;
    }

    if (selectAllBtn && deselectAllBtn) {
        if (checkedCount === checkboxes.length && checkboxes.length > 0) {
            selectAllBtn.style.display = 'none';
            deselectAllBtn.style.display = 'inline-flex';
        } else {
            selectAllBtn.style.display = 'inline-flex';
            deselectAllBtn.style.display = 'none';
        }
    }
}

function selectAllSolutions() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        toggleSolutionCard(checkbox);
    });
}

function deselectAllSolutions() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        toggleSolutionCard(checkbox);
    });
}

// FONCTION CORRIGÉE POUR APPLIQUER PLUSIEURS SOLUTIONS
async function applySelectedSolutions() {
    const selectedCheckboxes = document.querySelectorAll('.solution-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        showToast('warning', 'Attention', 'Aucune solution sélectionnée');
        return;
    }

    const confirmation = confirm(
        `Appliquer ${selectedCheckboxes.length} solution(s) ?`
    );
    if (!confirmation) return;

    try {
        showLoading('Application des solutions...');

        for (const checkbox of selectedCheckboxes) {
            const card = checkbox.closest('.solution-card-enhanced');
            const solutionData = JSON.parse(card.dataset.solutionData || '{}');
            const solutionType = card.dataset.solutionType;
            const conflitId = parseInt(card.dataset.conflitId);

            //CONSTRUIRE LE BON FORMAT
            const payload = {
                conflitId: conflitId,
                solutionType: solutionType,
                solutionData: solutionData
            };

            await fetch(API_ENDPOINTS.appliquerSolution, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }

        showToast('success', 'Succès', 'Solutions appliquées avec succès');
        document.getElementById('solutionsModal').classList.remove('active');
        await refreshConflits();

    } catch (error) {
        console.error(error);
        showToast('error', 'Erreur', 'Impossible d’appliquer les solutions');
    } finally {
        hideLoading();
    }
}


async function appliquerSolutionUnique(conflitId, solutionType, solutionIndex) {
    try {
        const card = document.querySelector(
            `[data-solution-id="solution-${conflitId}-${solutionIndex}"]`
        );

        if (!card) {
            throw new Error('Carte solution introuvable');
        }

        // 1. Récupérer les données de la solution
        const rawData = JSON.parse(card.dataset.solutionData || '{}');
        console.log(" Données brutes de la solution:", rawData);


        // 3. Construire le payload EXACTEMENT comme le backend l'attend
        let solutionData = {
        };

        //  CAS CHANGER_CRENEAU
        if (solutionType === 'CHANGER_CRENEAU' || solutionType === 'CHANGER_CRENEAU_COMPLET') {
            solutionData.nouveauCreneauId = rawData.options?.[0]?.id;
        }

        //  CAS CHANGER_FORMATEUR
        if (solutionType === 'CHANGER_FORMATEUR') {
            solutionData.formateurId = rawData.options?.[0]?.id;
        }

        // DEBUG AVANT ENVOI
        console.log(" STRUCTURE RÉELLE DU RESULT :", {
            conflitId: parseInt(conflitId),
            solutionType: solutionType,
            solutionData
        });

        const payload = {
            conflitId: parseInt(conflitId),
            solutionType: solutionType,
            solutionData: solutionData
        };

        // 4. Copier toutes les données dans solutionData
        Object.keys(rawData).forEach(key => {
            payload.solutionData[key] = rawData[key];
        });

        // 5. Afficher pour debug
        console.log('Payload envoyé au backend:', JSON.stringify(payload, null, 2));

        // 6. Envoyer la requête
        const response = await fetch(API_ENDPOINTS.appliquerSolution, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // 7. Traiter la réponse
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur backend:', errorData);
            throw new Error(errorData.message || 'Erreur lors de l\'application de la solution');
        }

        const result = await response.json();
        console.log('Réponse du backend:', result);

        // 8. Afficher le succès
        showToast('success', 'Succès', result.message || 'Solution appliquée avec succès');

        // 9. Fermer le modal et rafraîchir
        setTimeout(() => {
            document.getElementById('solutionsModal').classList.remove('active');
            refreshConflits();
        }, 1500);

    } catch (error) {
        console.error(' Erreur:', error);
        showToast('error', 'Erreur', error.message);
    }
}

// ========================================================================
// 8. FONCTION POUR APPLIQUER TOUTES LES SOLUTIONS D'UN CONFLIT
// ========================================================================

/**
 * FONCTION POUR APPLIQUER TOUTES LES SOLUTIONS D'UN CONFLIT
 */
async function appliquerToutesSolutions() {
    if (!currentConflitId) {
        showToast('warning', 'Attention', 'Aucun conflit sélectionné');
        return;
    }

    const conflit = getConflitById(currentConflitId);
    if (!conflit) {
        showToast('error', 'Erreur', 'Conflit introuvable');
        return;
    }

    // Confirmation de l'utilisateur
    const confirmation = confirm(
        `Voulez-vous appliquer TOUTES les solutions disponibles pour ce conflit ?\n\n` +
        `Conflit: ${conflit.description}\n` +
        `Type: ${conflit.typeDisplay}\n\n` +
        `Toutes les solutions applicables seront exécutées successivement.`
    );

    if (!confirmation) return;

    try {
        showLoading('Application de toutes les solutions...');

        // ==================================================================
        // 1. RÉCUPÉRATION DU PLANNING ID
        // ==================================================================
        let planningId =
            conflit.planningId ??
            conflit.sessionsFull?.[0]?.planningId ??
            currentPlanningId ??
            DEFAULT_PLANNING_ID;

        if (!planningId) {
            throw new Error('Impossible de déterminer le planning ID');
        }

        // ==================================================================
        // 2. RÉCUPÉRATION DES SOLUTIONS DISPONIBLES
        // ==================================================================
        console.log(' Récupération des solutions pour le planning:', planningId);
        const url = API_ENDPOINTS.analyseResolution(planningId);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('Résultat analyse complète:', result);

        // ==================================================================
        // 3. TROUVER LE CONFLIT DANS LA RÉPONSE
        // ==================================================================
        const conflitData = result.conflits?.find(c => c.id === currentConflitId);
        
        if (!conflitData) {
            showToast('error', 'Erreur', 'Conflit non trouvé dans l\'analyse');
            return;
        }

        if (!Array.isArray(conflitData.solutions) || conflitData.solutions.length === 0) {
            showToast('info', 'Information', 'Aucune solution disponible pour ce conflit');
            return;
        }

        console.log(`${conflitData.solutions.length} solution(s) trouvée(s)`);

        // ==================================================================
        // 4. FILTRER LES SOLUTIONS APPLICABLES
        // ==================================================================
        const solutionsApplicables = conflitData.solutions.filter(
            solution => solution.applicable !== false
        );

        if (solutionsApplicables.length === 0) {
            showToast('warning', 'Attention', 'Aucune solution applicable');
            return;
        }

        console.log(`${solutionsApplicables.length} solution(s) applicable(s)`);

        // ==================================================================
        // 5. APPLIQUER CHAQUE SOLUTION SUCCESSIVEMENT
        // ==================================================================
        const resultats = [];
        let solutionsAppliquees = 0;
        let solutionsEchouees = 0;

        for (let i = 0; i < solutionsApplicables.length; i++) {
            const solution = solutionsApplicables[i];
            
            try {
                showLoading(`Application de la solution ${i + 1}/${solutionsApplicables.length}...`);
                
                console.log(`🔄 Application de la solution ${i + 1}:`, solution.type);

                let solutionData = {};
                
                if (solution.data) {
                    Object.keys(solution.data).forEach(key => {
                        solutionData[key] = solution.data[key];
                    });
                }


                if (solution.type === 'CHANGER_CRENEAU' || solution.type === 'CHANGER_CRENEAU_COMPLET') {
                    if (solution.data?.options?.[0]?.id) {
                        solutionData.nouveauCreneauId = solution.data.options[0].id;
                    }
                } else if (solution.type === 'CHANGER_FORMATEUR') {
                    if (solution.data?.options?.[0]?.id) {
                        solutionData.formateurId = solution.data.options[0].id;
                    }
                } else if (solution.type === 'CHANGER_SALLE') {
                    if (solution.data?.options?.[0]?.id) {
                        solutionData.salleId = solution.data.options[0].id;
                    }
                }

                const payload = {
                    conflitId: currentConflitId,
                    solutionType: solution.type,
                    solutionData: solutionData
                };

                console.log(' Payload envoyé:', JSON.stringify(payload, null, 2));

                // Appliquer la solution via l'API
                const response = await fetch(API_ENDPOINTS.appliquerSolution, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    solutionsAppliquees++;
                    resultats.push({
                        index: i + 1,
                        type: solution.type,
                        label: solution.label || solution.type,
                        status: 'SUCCÈS',
                        message: result.message
                    });
                    
                    console.log(`Solution ${i + 1} appliquée avec succès`);
                } else {
                    solutionsEchouees++;
                    resultats.push({
                        index: i + 1,
                        type: solution.type,
                        label: solution.label || solution.type,
                        status: 'ÉCHEC',
                        message: result.message || 'Échec inconnu'
                    });
                    
                    console.warn(`Solution ${i + 1} a échoué`);
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                solutionsEchouees++;
                resultats.push({
                    index: i + 1,
                    type: solution.type,
                    label: solution.label || solution.type,
                    status: 'ERREUR',
                    message: error.message
                });
                
                console.error(`Erreur sur la solution ${i + 1}:`, error);
                continue;
            }
        }

        // ==================================================================
        // 6. AFFICHER LE RÉCAPITULATIF
        // ==================================================================
        hideLoading();
        
        let messageFinal = '';
        if (solutionsAppliquees > 0) {
            messageFinal += `${solutionsAppliquees} solution(s) appliquée(s) avec succès. `;
        }
        if (solutionsEchouees > 0) {
            messageFinal += `${solutionsEchouees} solution(s) ont échoué. `;
        }

        console.log('RÉCAPITULATIF DES SOLUTIONS:');
        resultats.forEach(r => {
            console.log(`${r.status} - ${r.label}: ${r.message}`);
        });

        if (solutionsAppliquees > 0) {
            await refreshConflits();
            

            document.getElementById('solutionsModal').classList.remove('active');
            
            showToast('success', 'Résumé', messageFinal);

            setTimeout(() => {
                afficherRecapitulatifSolutions(resultats);
            }, 1000);
            
        } else {
            showToast('error', 'Échec', 'Aucune solution n\'a pu être appliquée');
        }

    } catch (error) {
        console.error('Erreur lors de l\'application de toutes les solutions:', error);
        showToast('error', 'Erreur', error.message || 'Erreur lors de l\'application des solutions');
        hideLoading();
    }
}

// ========================================================================
// 9. FONCTION POUR AFFICHER LE RÉCAPITULATIF DÉTAILLÉ
// ========================================================================


function afficherRecapitulatifSolutions(resultats) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'recapModal';
    
    let recapHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content modal-medium">
            <div class="modal-header">
                <h2 class="modal-title">
                    <i class="fas fa-list-check"></i>
                    Récapitulatif des solutions appliquées
                </h2>
                <button class="modal-close" onclick="document.getElementById('recapModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="recap-container">
                    <div class="recap-summary">
                        <div class="summary-stat">
                            <div class="stat-value">${resultats.filter(r => r.status.includes('SUCCÈS')).length}</div>
                            <div class="stat-label">Succès</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">${resultats.filter(r => r.status.includes('ÉCHEC')).length}</div>
                            <div class="stat-label">Échecs</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">${resultats.filter(r => r.status.includes('ERREUR')).length}</div>
                            <div class="stat-label">Erreurs</div>
                        </div>
                    </div>
                    
                    <div class="recap-details">
                        <h3><i class="fas fa-clipboard-list"></i> Détails des solutions:</h3>
                        <div class="solutions-list">
    `;
    
    resultats.forEach((resultat, index) => {
        const statusClass = resultat.status.includes('SUCCÈS') ? 'success' : 
                          resultat.status.includes('ÉCHEC') ? 'warning' : 'error';
        
        recapHTML += `
            <div class="solution-result ${statusClass}">
                <div class="result-header">
                    <span class="result-index">${resultat.index}.</span>
                    <span class="result-type">${resultat.label}</span>
                    <span class="result-status ${statusClass}">${resultat.status}</span>
                </div>
                <div class="result-message">${resultat.message}</div>
            </div>
        `;
    });
    
    recapHTML += `
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="document.getElementById('recapModal').remove()">
                    <i class="fas fa-check"></i>
                    Fermer
                </button>
                <button type="button" class="btn btn-secondary" onclick="refreshConflits(); document.getElementById('recapModal').remove()">
                    <i class="fas fa-sync-alt"></i>
                    Actualiser les conflits
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = recapHTML;
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    modal.querySelector('.modal-overlay').addEventListener('click', function() {
        modal.remove();
    });
}

// ========================================================================
// 10. METTRE À JOUR L'EXPORTATION GLOBALE
// ========================================================================


// Vérifier que la fonction est exposée
console.log('Fonction appliquerToutesSolutions exposée globalement');

function closeModal() {
    document.getElementById('conflitModal').classList.remove('active');
    setCurrentConflitId(null);
}

function closeAllModals() {
    document.getElementById('conflitModal').classList.remove('active');
    document.getElementById('solutionsModal').classList.remove('active');
    document.getElementById('solutionAppliedModal')?.classList.remove('active');
    document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('deleteAllModal').classList.remove('active');
    setCurrentConflitId(null);
}

function openDeleteModal(conflitId, description) {
    setCurrentConflitId(conflitId);
    document.getElementById('deleteConflitName').textContent = description;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    setCurrentConflitId(null);
}

function closeDeleteAllModal() {
    document.getElementById('deleteAllModal').classList.remove('active');
}

function closeSolutionsModal() {
    document.getElementById('solutionsModal').classList.remove('active');
}

async function confirmDelete() {
    if (!currentConflitId) return;

    try {
        await deleteConflit(currentConflitId);
        closeDeleteModal();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        closeDeleteModal();
    }
}

// ========================================================================
// 6. INITIALISATION
// ========================================================================

async function refreshConflits() {
    try {
        showLoading('Actualisation des conflits depuis la base de données...');
        await loadConflitsFromAPI();
        setCurrentPage(1);
        updateUI();
        showToast('success', 'Actualisation', 'Conflits actualisés depuis la base de données');
    } catch (error) {
        console.error('Erreur lors de l\'actualisation:', error);
        showToast('error', 'Erreur', 'Impossible d\'actualiser les conflits');
    } finally {
        hideLoading();
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const filterSeverite = document.getElementById('filterSeverite');

    if (searchInput) searchInput.addEventListener('input', debounce(renderConflitsTable, 300));
    if (filterType) filterType.addEventListener('change', renderConflitsTable);
    if (filterSeverite) filterSeverite.addEventListener('change', renderConflitsTable);

    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('closeDeleteAllModal')?.addEventListener('click', closeDeleteAllModal);
    document.getElementById('cancelDeleteAll')?.addEventListener('click', closeDeleteAllModal);
    document.getElementById('closeSolutionsModal')?.addEventListener('click', closeSolutionsModal);
    document.getElementById('cancelSolutionsBtn')?.addEventListener('click', closeSolutionsModal);
    document.getElementById('confirmDelete')?.addEventListener('click', confirmDelete);
    document.getElementById('confirmDeleteAll')?.addEventListener('click', confirmDeleteAll);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
}

async function initializeApp() {
    try {
        setupEventListeners();

        showLoading('Chargement des conflits depuis la base de données...');
        await loadConflitsFromAPI();

        updateUI();
        console.log('Application initialisée avec succès');

    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showToast('error', 'Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez que Spring Boot est démarré.');
        showEmptyState('Erreur de connexion au serveur');

    } finally {
        hideLoading();
    }
}

// ========================================================================
// 7. RÉSOLUTION AUTOMATIQUE DE TOUS LES CONFLITS
// ========================================================================

async function resoudreTousConflits() {
    if (conflits.length === 0) {
        showToast('info', 'Information', 'Aucun conflit à résoudre');
        return;
    }

    const planningId = currentPlanningId || DEFAULT_PLANNING_ID;

    const confirmation = confirm(
        `Voulez-vous résoudre automatiquement TOUS les conflits ?\n\n` +
        `${conflits.length} conflit(s) seront traités.\n` +
        `Planning ID: ${planningId}\n\n` +
        `Cette action modifiera le planning et ne peut pas être annulée.`
    );

    if (!confirmation) return;

    try {
        showLoading('Résolution automatique en cours...');

        const response = await fetch(API_ENDPOINTS.resoudreTout(planningId), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            showToast('success', 'Succès', result.message || 'Conflits résolus avec succès');

            await loadConflitsFromAPI();
            updateUI();
        } else {
            showToast('error', 'Erreur', result.message || 'Échec de la résolution automatique');
        }

    } catch (error) {
        console.error('Erreur lors de la résolution automatique:', error);
        showToast('error', 'Erreur', 'Impossible de résoudre les conflits automatiquement');
    } finally {
        hideLoading();
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeApp);


window.viewConflitDetails = viewConflitDetails;
window.showSolutions = showSolutions;
window.refreshConflits = refreshConflits;
window.deleteAllConflits = deleteAllConflits;
window.openDeleteModal = openDeleteModal;
window.resetFilters = resetFilters;
window.changePage = changePage;
window.selectAllSolutions = selectAllSolutions;
window.deselectAllSolutions = deselectAllSolutions;
window.applySelectedSolutions = applySelectedSolutions;
window.appliquerSolutionUnique = appliquerSolutionUnique;
window.resoudreTousConflits = resoudreTousConflits;
window.appliquerToutesSolutions = appliquerToutesSolutions;
function onPlanningChange(planningId) {
    setCurrentPlanningId(parseInt(planningId));
    refreshConflits();
}

window.onPlanningChange = onPlanningChange;