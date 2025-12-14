// ==========================================
// INITIALISATION DES ÉLÉMENTS DÉCORATIFS
// ==========================================

function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    
    // Ajouter les éléments décoratifs manquants
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

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let equipements = [];
let currentEquipementId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredEquipements = [];
let currentFilter = 'all';
let currentSort = 'nom';

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDecorations();
    initializeApp();
    loadEquipements();
    setupEventListeners();
});

function initializeApp() {
    // Charger les données depuis localStorage si disponibles
    const savedEquipements = localStorage.getItem('equipements');
    if (savedEquipements) {
        equipements = JSON.parse(savedEquipements);
        updateUI();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Bouton ajouter équipement
    const addBtn = document.getElementById('addEquipement');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }

    // Fermeture des modals
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    // Fermeture au clic sur l'overlay
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
                closeDeleteModal();
            }
        });
    });

    // Formulaire de soumission
    const equipementForm = document.getElementById('equipementForm');
    if (equipementForm) {
        equipementForm.addEventListener('submit', handleFormSubmit);
    }

    // Confirmation de suppression
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteEquipement);
    }

    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Filtres
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            applyFilters();
        });
    });

    // Tri
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFilters();
        });
    }

    // Pagination
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(-1));
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(1));
    }
}

// ==========================================
// GESTION DES ÉQUIPEMENTS
// ==========================================

function loadEquipements() {
    // Données de démonstration (à remplacer par un appel API)
    if (equipements.length === 0) {
        equipements = [
            {
                id: 1,
                nom: "Ordinateur portable Dell",
                type: "Ordinateur",
                quantite: 15,
                etat: "bon"
            },
            {
                id: 2,
                nom: "Projecteur Epson",
                type: "Projecteur",
                quantite: 8,
                etat: "neuf"
            },
            {
                id: 3,
                nom: "Tablettes Samsung",
                type: "Tablette",
                quantite: 20,
                etat: "bon"
            },
            {
                id: 4,
                nom: "Imprimante HP LaserJet",
                type: "Imprimante",
                quantite: 3,
                etat: "a-reparer"
            },
            {
                id: 5,
                nom: "Switch réseau Cisco",
                type: "Réseau",
                quantite: 5,
                etat: "neuf"
            },
            {
                id: 6,
                nom: "Système audio JBL",
                type: "Audio",
                quantite: 2,
                etat: "hs"
            }
        ];
        saveEquipements();
    }
    updateUI();
}

function saveEquipements() {
    localStorage.setItem('equipements', JSON.stringify(equipements));
}

// ==========================================
// GESTION DES MODALS
// ==========================================

function openAddModal() {
    currentEquipementId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un équipement';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';
    document.getElementById('equipementForm').reset();
    
    document.getElementById('equipementModal').classList.add('active');
}

function openEditModal(id) {
    const equipement = equipements.find(e => e.id === id);
    if (!equipement) return;

    currentEquipementId = id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'équipement';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';

    // Remplir le formulaire
    document.getElementById('nom').value = equipement.nom;
    document.getElementById('quantite').value = equipement.quantite;

    // Cocher le type
    const typeRadio = document.querySelector(`input[name="type"][value="${equipement.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    // Cocher l'état
    const etatRadio = document.querySelector(`input[name="etat"][value="${equipement.etat}"]`);
    if (etatRadio) etatRadio.checked = true;

    document.getElementById('equipementModal').classList.add('active');
}

function closeModal() {
    document.getElementById('equipementModal').classList.remove('active');
}

function openDeleteModal(id, nom) {
    currentEquipementId = id;
    document.getElementById('deleteEquipementName').textContent = nom;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentEquipementId = null;
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    
    // Récupérer le type sélectionné
    const typeInput = document.querySelector('input[name="type"]:checked');
    if (!typeInput) {
        showToast('error', 'Erreur', 'Veuillez sélectionner un type d\'équipement');
        return;
    }

    // Récupérer l'état sélectionné
    const etatInput = document.querySelector('input[name="etat"]:checked');
    if (!etatInput) {
        showToast('error', 'Erreur', 'Veuillez sélectionner un état');
        return;
    }

    const equipementData = {
        nom: formData.get('nom'),
        type: typeInput.value,
        quantite: parseInt(formData.get('quantite')),
        etat: etatInput.value
    };

    if (currentEquipementId) {
        // Mise à jour
        const index = equipements.findIndex(e => e.id === currentEquipementId);
        if (index !== -1) {
            equipements[index] = { ...equipements[index], ...equipementData };
            showToast('success', 'Succès', 'Équipement modifié avec succès');
        }
    } else {
        // Ajout
        equipementData.id = Date.now();
        equipements.push(equipementData);
        showToast('success', 'Succès', 'Équipement ajouté avec succès');
    }

    saveEquipements();
    updateUI();
    closeModal();
}

// ==========================================
// SUPPRESSION
// ==========================================

function deleteEquipement() {
    if (!currentEquipementId) return;

    const index = equipements.findIndex(e => e.id === currentEquipementId);
    if (index !== -1) {
        const equipementNom = equipements[index].nom;
        equipements.splice(index, 1);
        saveEquipements();
        updateUI();
        closeDeleteModal();
        showToast('success', 'Succès', `${equipementNom} a été supprimé`);
    }
}

// ==========================================
// AFFICHAGE
// ==========================================

function updateUI() {
    updateStats();
    applyFilters();
}

function updateStats() {
    const totalEquipements = equipements.length;
    const equipementsDisponibles = equipements.filter(e => e.etat === 'neuf' || e.etat === 'bon').length;
    const totalTypes = [...new Set(equipements.map(e => e.type))].length;
    const aReparer = equipements.filter(e => e.etat === 'a-reparer').length;

    // Mettre à jour les cartes de statistiques
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) statNumbers[0].textContent = totalEquipements;
    if (statNumbers[1]) statNumbers[1].textContent = equipementsDisponibles;
    if (statNumbers[2]) statNumbers[2].textContent = totalTypes;
    if (statNumbers[3]) statNumbers[3].textContent = aReparer;
}

function applyFilters() {
    let filtered = [...equipements];

    // Appliquer le filtre d'état
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

    // Appliquer le tri
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
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredEquipements = equipements.filter(e => {
        return e.nom.toLowerCase().includes(searchTerm) ||
               e.type.toLowerCase().includes(searchTerm);
    });

    currentPage = 1;
    renderEquipements();
    updatePagination();
}

function renderEquipements() {
    const tbody = document.getElementById('equipementsTableBody');
    if (!tbody) return;

    // Calculer les indices de pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEquipements = filteredEquipements.slice(startIndex, endIndex);

    if (pageEquipements.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-content">
                        <i class="fas fa-laptop"></i>
                        <h3>Aucun équipement trouvé</h3>
                        <p>Aucun équipement ne correspond à vos critères de recherche</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageEquipements.map(equipement => {
        let quantiteClass = 'disponible';
        let quantiteText = 'Disponible';
        if (equipement.quantite === 0) {
            quantiteClass = 'epuise';
            quantiteText = 'Épuisé';
        } else if (equipement.quantite < 5) {
            quantiteClass = 'limite';
            quantiteText = 'Limité';
        }

        let etatText = '';
        switch(equipement.etat) {
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
        }

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
                        ${equipement.quantite} unités
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
                        <button class="action-btn delete" onclick="openDeleteModal(${equipement.id}, '${equipement.nom}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// PAGINATION
// ==========================================

function updatePagination() {
    const totalPages = Math.ceil(filteredEquipements.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (!pageNumbers) return;

    // Mettre à jour les boutons
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    // Générer les numéros de page
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

// ==========================================
// UTILITAIRES
// ==========================================

function showToast(type, title, message) {
    // Supprimer les toasts existants
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

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// Fermer le modal avec la touche Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Empêcher la soumission du formulaire avec Enter (sauf dans textarea)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const form = e.target.closest('form');
        if (form && form.id === 'equipementForm') {
            e.preventDefault();
        }
    }
});