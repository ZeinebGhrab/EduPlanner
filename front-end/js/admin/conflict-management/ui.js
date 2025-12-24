import { conflits, currentPage, setCurrentPage, itemsPerPage } from './state.js';

export function updateUI() {
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

export function renderConflitsTable() {
    const tbody = document.getElementById('conflitsTableBody');
    const tableCount = document.getElementById('tableCount');
    const pagination = document.getElementById('tablePagination');

    if (!tbody) return;

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filterType')?.value || '';
    const severiteFilter = document.getElementById('filterSeverite')?.value || '';

    // Filtrer les conflits
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

    // Rendu des lignes du tableau
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
                        <button class="action-btn delete" onclick="openDeleteModal(${conflit.id}, '${conflit.description.replace(/'/g, "\\'")}')" title="Supprimer">
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

export function changePage(page) {
    const totalPages = Math.ceil(conflits.length / itemsPerPage);

    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        renderConflitsTable();
    }
}

export function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterSeverite').value = '';
    setCurrentPage(1);
    renderConflitsTable();
}

export function showEmptyState(message) {
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

export function showToast(type, title, message) {
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

export function showLoading(message = 'Chargement...') {
    const loadingIndicator = document.getElementById('globalLoading');
    const loadingMessage = document.getElementById('loadingMessage');

    if (loadingIndicator && loadingMessage) {
        loadingMessage.textContent = message;
        loadingIndicator.style.display = 'flex';
    }
}

export function hideLoading() {
    const loadingIndicator = document.getElementById('globalLoading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

export function debounce(func, wait) {
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