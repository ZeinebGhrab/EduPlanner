function showLoading() {
    document.getElementById('loadingState').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function showEmptyState(message = null) {
    const tbody = document.getElementById('equipementsTableBody');
    if (!tbody) return;

    let content = `
        <tr class="empty-state">
            <td colspan="5">
                <div class="empty-content">
                    <i class="fas fa-laptop"></i>
                    <h3>Aucun équipement trouvé</h3>
    `;

    if (message) {
        content += `<p style="color: #DC2626; margin: 10px 0;"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
    } else {
        content += `<p>Aucun équipement ne correspond à vos critères</p>`;
    }

    content += `
                    <button class="btn btn-primary" onclick="document.getElementById('addEquipement').click()">
                        <i class="fas fa-plus"></i>
                        Ajouter un équipement
                    </button>
                </div>
            </td>
        </tr>
    `;

    tbody.innerHTML = content;
}

function updateUI() {
    updateStats();
    applyFilters();
}

function updateStats() {
    const totalEquipements = equipements.length;
    const equipementsDisponibles = equipements.filter(e => e.etat === 'neuf' || e.etat === 'bon').length;
    const totalTypes = [...new Set(equipements.map(e => e.type))].length;
    const aReparer = equipements.filter(e => e.etat === 'a-reparer').length;
    document.getElementById('totalEquipements').textContent = totalEquipements;
    document.getElementById('equipementsDisponibles').textContent = equipementsDisponibles;
    document.getElementById('typesEquipements').textContent = totalTypes;
    document.getElementById('aReparer').textContent = aReparer;
}

function applyFilters() {
    let filtered = [...equipements];
    if (currentFilter !== 'all') {
        filtered = filtered.filter(e => {
            if (currentFilter === 'disponible') {
                return e.etat === 'neuf' || e.etat === 'bon';
            } else if (currentFilter === 'a-reparer') {
                return e.etat === 'a-reparer';
            }
            return true;
        });
    }
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'nom':
                return a.nom.localeCompare(b.nom);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'quantite':
                return b.quantite - a.quantite;
            case 'etat':
                return a.etat.localeCompare(b.etat);
            default:
                return 0;
        }
    });

    filteredEquipements = filtered;
    renderEquipements();
    updatePagination();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredEquipements = equipements.filter(e => {
        return e.nom.toLowerCase().includes(searchTerm) ||
            e.type.toLowerCase().includes(searchTerm) ||
            (e.etat && e.etat.toLowerCase().includes(searchTerm));
    });

    currentPage = 1;
    renderEquipements();
    updatePagination();
}

function renderEquipements() {
    const tbody = document.getElementById('equipementsTableBody');
    if (!tbody) return;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEquipements = filteredEquipements.slice(startIndex, endIndex);

    if (pageEquipements.length === 0) {
        showEmptyState();
        return;
    }

    tbody.innerHTML = pageEquipements.map(equipement => {
        let quantiteClass = 'disponible';
        let quantiteText = `${equipement.quantite} unité${equipement.quantite !== 1 ? 's' : ''}`;

        if (equipement.quantite === 0) {
            quantiteClass = 'epuise';
            quantiteText = 'Épuisé';
        } else if (equipement.quantite < 5) {
            quantiteClass = 'limite';
            quantiteText = `${equipement.quantite} unité${equipement.quantite !== 1 ? 's' : ''} (Limité)`;
        }
        let etatText = '';
        switch (equipement.etat) {
            case 'neuf':
                etatText = 'Neuf';
                break;
            case 'bon':
                etatText = 'Bon';
                break;
            case 'a-reparer':
                etatText = 'À réparer';
                break;
            case 'hs':
                etatText = 'Hors service';
                break;
            default:
                etatText = equipement.etat;
        }
        const nomEscaped = equipement.nom.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <tr>
                <td>
                    <div class="equipement-info">
                        <div class="equipement-details">
                            <h4>${equipement.nom}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="type-badge">${equipement.type}</span>
                </td>
                <td>
                    <div class="quantite-indicator ${quantiteClass}">
                        ${quantiteText}
                    </div>
                </td>
                <td>
                    <span class="etat-badge ${equipement.etat}">
                        ${etatText}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${equipement.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${equipement.id}, '${nomEscaped}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
function updatePagination() {
    const totalPages = Math.ceil(filteredEquipements.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (!pageNumbers) return;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    let pagesHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesHTML += `
                <button class="page-number ${i === currentPage ? 'active' : ''}" 
                        onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHTML += '<span style="padding: 0 0.5rem;">...</span>';
        }
    }

    pageNumbers.innerHTML = pagesHTML || '<button class="page-number active">1</button>';
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredEquipements.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderEquipements();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderEquipements();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(type, title, message) {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(toast);
    toast.style.animation = 'slideInRight 0.4s ease-out';
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('Aucun token d\'authentification trouvé');
    }
}
function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    const decorations = `
        <!-- Diamond -->
        <div class="deco-diamond"></div>
        
        <!-- Circles -->
        <div class="deco-circle"></div>
        <div class="deco-circle-2"></div>
        <div class="deco-circle-3"></div>
        
        <!-- Plus signs -->
        <div class="deco-plus"></div>
        <div class="deco-plus-2"></div>
        <div class="deco-plus-3"></div>
        
        <!-- Grid patterns -->
        <div class="grid-pattern"></div>
        <div class="grid-pattern-2"></div>
        
        <!-- Lines -->
        <div class="line-deco line-deco-1"></div>
        <div class="line-deco line-deco-2"></div>
        <div class="line-deco line-deco-3"></div>
        <div class="line-deco line-deco-4"></div>
    `;

    bgShapes.innerHTML += decorations;
}
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.goToPage = goToPage;