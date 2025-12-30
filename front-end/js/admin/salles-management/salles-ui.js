function showLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'flex';
    }
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
}
function hideLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
}
function showEmptyState(message = null) {
    const tbody = document.getElementById('sallesTableBody');
    if (!tbody) return;

    let content = `
        <tr class="empty-state">
            <td colspan="6">
                <div class="empty-content">
                    <i class="fas fa-door-closed"></i>
                    <h3>Aucune salle enregistrée</h3>
    `;

    if (message) {
        content += `<p style="color: #DC2626; margin: 10px 0;"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
    } else {
        content += `<p>Commencez par ajouter votre première salle</p>`;
    }

    content += `
                    <button class="btn btn-primary" onclick="document.getElementById('addSalle').click()">
                        <i class="fas fa-plus"></i>
                        Ajouter une salle
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
    const totalSalles = salles.length;
    const sallesDisponibles = salles.length;
    const capaciteTotale = salles.reduce((sum, salle) => sum + (salle.capacite || 0), 0);
    const types = {};
    salles.forEach(salle => {
        types[salle.type] = (types[salle.type] || 0) + 1;
    });
    let typePrincipal = '-';
    let maxCount = 0;
    for (const [type, count] of Object.entries(types)) {
        if (count > maxCount) {
            maxCount = count;
            typePrincipal = getTypeLabel(type);
        }
    }
    const totalElement = document.getElementById('totalSalles');
    const disponiblesElement = document.getElementById('sallesDisponibles');
    const capaciteElement = document.getElementById('capaciteTotale');
    const typeElement = document.getElementById('typePrincipal');

    if (totalElement) totalElement.textContent = totalSalles;
    if (disponiblesElement) disponiblesElement.textContent = sallesDisponibles;
    if (capaciteElement) capaciteElement.textContent = capaciteTotale;
    if (typeElement) typeElement.textContent = typePrincipal;
}
function getTypeLabel(type) {
    const typeLabels = {
        'salle_cours': 'Salle Cours',
        'amphitheatre': 'Amphithéâtre',
        'salle_informatique': 'Informatique',
        'laboratoire': 'Laboratoire',
        'salle_reunion': 'Réunion',
        'autre': 'Autre'
    };
    return typeLabels[type] || type;
}
function applyFilters() {
    let filtered = [...salles];
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'nom':
                return a.nom.localeCompare(b.nom);
            case 'capacite':
                return b.capacite - a.capacite;
            case 'type':
                return a.type.localeCompare(b.type);
            default:
                return 0;
        }
    });

    filteredSalles = filtered;
    renderSalles();
    updatePagination();
}
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredSalles = salles.filter(salle => {
        return salle.nom.toLowerCase().includes(searchTerm) ||
            salle.type.toLowerCase().includes(searchTerm) ||
            salle.batiment.toLowerCase().includes(searchTerm);
    });

    currentPage = 1;
    renderSalles();
    updatePagination();
}

function renderSalles() {
    const tbody = document.getElementById('sallesTableBody');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageSalles = filteredSalles.slice(startIndex, endIndex);

    if (pageSalles.length === 0) {
        showEmptyState();
        return;
    }

    tbody.innerHTML = pageSalles.map(salle => {
        const typeLabel = getTypeLabel(salle.type);
        const disponibilite = 'Disponible';
        const nomEscaped = salle.nom.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        return `
            <tr>
                <td>
                    <div class="salle-info">
                        <div class="salle-details">
                            <h4>${salle.nom}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="capacite-indicator">
                        ${salle.capacite} places
                    </div>
                </td>
                <td>
                    <span class="type-badge">${typeLabel}</span>
                </td>
                <td>
                    <span class="batiment-badge">${salle.batiment}</span>
                </td>
                <td>
                    <span class="disponibilite-badge disponible">
                        ${disponibilite}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${salle.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${salle.id}, '${nomEscaped}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePagination() {
    const totalPages = Math.ceil(filteredSalles.length / itemsPerPage);
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
    const totalPages = Math.ceil(filteredSalles.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderSalles();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderSalles();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    if (!bgShapes) return;

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
window.goToPage = goToPage;


