

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let contraintes = [];
let currentContrainteId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredContraintes = [];
let currentFilter = 'all';
let currentSort = 'type';


// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadContraintes();
    setupEventListeners();
    updateElementsSelect();
});

function initializeApp() {
    // Charger les données depuis localStorage si disponibles
    const savedContraintes = localStorage.getItem('contraintes');
    if (savedContraintes) {
        contraintes = JSON.parse(savedContraintes);
        updateUI();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Bouton ajouter contrainte
    const addBtn = document.getElementById('addContrainte');
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
    const contrainteForm = document.getElementById('contrainteForm');
    if (contrainteForm) {
        contrainteForm.addEventListener('submit', handleFormSubmit);
    }

    // Confirmation de suppression
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteContrainte);
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

    // Changement de type pour mettre à jour les éléments
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', updateElementsSelect);
    });

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ==========================================
// GESTION DES CONTRAINTES
// ==========================================

function loadContraintes() {
    // Données de démonstration (à remplacer par un appel API)
    if (contraintes.length === 0) {
        contraintes = [
            {
                id: 1,
                type: "formateur",
                element: "Dr. Martin Dubois",
                description: "Indisponible pour formations externes",
                date_debut: "2024-01-15",
                date_fin: "2024-06-15",
                jours: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
                heure_debut: "08:00",
                heure_fin: "17:00",
                priorite: "elevee",
                statut: "active"
            },
            {
                id: 2,
                type: "etudiant",
                element: "Groupe Débutants",
                description: "Pas disponible le vendredi après-midi",
                date_debut: "2024-01-01",
                date_fin: "2024-12-31",
                jours: ["vendredi"],
                heure_debut: "13:00",
                heure_fin: "18:00",
                priorite: "moyenne",
                statut: "active"
            },
            {
                id: 3,
                type: "salle",
                element: "Salle A101",
                description: "Maintenance préventive mensuelle",
                date_debut: "2024-02-01",
                date_fin: "2024-12-01",
                jours: ["lundi"],
                heure_debut: "08:00",
                heure_fin: "10:00",
                priorite: "critique",
                statut: "active"
            },
            {
                id: 4,
                type: "creneau",
                element: "Lundi matin",
                description: "Réunion hebdomadaire d'équipe",
                date_debut: "2024-01-01",
                date_fin: "2024-12-31",
                jours: ["lundi"],
                heure_debut: "09:00",
                heure_fin: "10:30",
                priorite: "elevee",
                statut: "active"
            }
        ];
        saveContraintes();
    }
    updateUI();
}

function saveContraintes() {
    localStorage.setItem('contraintes', JSON.stringify(contraintes));
}

// ==========================================
// GESTION DES MODALS
// ==========================================

function openAddModal() {
    currentContrainteId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter une contrainte';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';
    document.getElementById('contrainteForm').reset();
    
    // Réinitialiser les jours
    const joursCheckboxes = document.querySelectorAll('input[name="jour"]');
    joursCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateElementsSelect();
    document.getElementById('contrainteModal').classList.add('active');
}

function openEditModal(id) {
    const contrainte = contraintes.find(c => c.id === id);
    if (!contrainte) return;

    currentContrainteId = id;
    document.getElementById('modalTitle').textContent = 'Modifier la contrainte';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';

    // Remplir le formulaire
    document.getElementById('description').value = contrainte.description;
    document.getElementById('date_debut').value = contrainte.date_debut;
    document.getElementById('date_fin').value = contrainte.date_fin;
    document.getElementById('heure_debut').value = contrainte.heure_debut || '';
    document.getElementById('heure_fin').value = contrainte.heure_fin || '';
    document.getElementById('priorite').value = contrainte.priorite;
    document.getElementById('statut').value = contrainte.statut;

    // Cocher le type
    const typeRadio = document.querySelector(`input[name="type"][value="${contrainte.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    // Mettre à jour les éléments et sélectionner le bon
    updateElementsSelect();
    setTimeout(() => {
        const elementSelect = document.getElementById('element');
        if (elementSelect) {
            elementSelect.value = contrainte.element;
        }
    }, 100);

    // Cocher les jours
    const joursCheckboxes = document.querySelectorAll('input[name="jour"]');
    joursCheckboxes.forEach(checkbox => {
        checkbox.checked = contrainte.jours.includes(checkbox.value);
    });

    document.getElementById('contrainteModal').classList.add('active');
}

function closeModal() {
    document.getElementById('contrainteModal').classList.remove('active');
}

function openDeleteModal(id, description) {
    currentContrainteId = id;
    document.getElementById('deleteContrainteName').textContent = description;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentContrainteId = null;
}

// ==========================================
// GESTION DES ÉLÉMENTS
// ==========================================

function updateElementsSelect() {
    const typeRadio = document.querySelector('input[name="type"]:checked');
    const elementSelect = document.getElementById('element');
    
    if (!typeRadio || !elementSelect) return;

    // Vider les options actuelles
    elementSelect.innerHTML = '<option value="">Choisir un élément...</option>';

    let elements = [];
    switch(typeRadio.value) {
        case 'formateur':
            elements = formateurs;
            break;
        case 'etudiant':
            elements = etudiants;
            break;
        case 'salle':
            elements = salles;
            break;
        case 'creneau':
            elements = creneaux;
            break;
    }

    // Ajouter les nouvelles options
    elements.forEach(element => {
        const option = document.createElement('option');
        option.value = element.nom;
        option.textContent = element.nom;
        elementSelect.appendChild(option);
    });
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
        showToast('error', 'Erreur', 'Veuillez sélectionner un type de contrainte');
        return;
    }

    // Récupérer les jours cochés
    const jours = [];
    const joursCheckboxes = document.querySelectorAll('input[name="jour"]:checked');
    joursCheckboxes.forEach(checkbox => {
        jours.push(checkbox.value);
    });

    const contrainteData = {
        type: typeInput.value,
        element: formData.get('element'),
        description: formData.get('description'),
        date_debut: formData.get('date_debut'),
        date_fin: formData.get('date_fin'),
        jours: jours,
        heure_debut: formData.get('heure_debut') || null,
        heure_fin: formData.get('heure_fin') || null,
        priorite: formData.get('priorite'),
        statut: formData.get('statut')
    };

    if (currentContrainteId) {
        // Mise à jour
        const index = contraintes.findIndex(c => c.id === currentContrainteId);
        if (index !== -1) {
            contraintes[index] = { ...contraintes[index], ...contrainteData };
            showToast('success', 'Succès', 'Contrainte modifiée avec succès');
        }
    } else {
        // Ajout
        contrainteData.id = Date.now();
        contraintes.push(contrainteData);
        showToast('success', 'Succès', 'Contrainte ajoutée avec succès');
    }

    saveContraintes();
    updateUI();
    closeModal();
}

// ==========================================
// SUPPRESSION
// ==========================================

function deleteContrainte() {
    if (!currentContrainteId) return;

    const index = contraintes.findIndex(c => c.id === currentContrainteId);
    if (index !== -1) {
        const contrainteDescription = contraintes[index].description;
        contraintes.splice(index, 1);
        saveContraintes();
        updateUI();
        closeDeleteModal();
        showToast('success', 'Succès', `Contrainte "${contrainteDescription}" a été supprimée`);
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
    const totalContraintes = contraintes.length;
    const contraintesFormateurs = contraintes.filter(c => c.type === 'formateur').length;
    const contraintesEtudiants = contraintes.filter(c => c.type === 'etudiant').length;
    const contraintesSalles = contraintes.filter(c => c.type === 'salle').length;
    const contraintesCreneaux = contraintes.filter(c => c.type === 'creneau').length;

    // Mettre à jour les cartes de statistiques
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) statNumbers[0].textContent = contraintesFormateurs;
    if (statNumbers[1]) statNumbers[1].textContent = contraintesEtudiants;
    if (statNumbers[2]) statNumbers[2].textContent = contraintesSalles;
    if (statNumbers[3]) statNumbers[3].textContent = contraintesCreneaux;
}

function applyFilters() {
    let filtered = [...contraintes];

    // Appliquer le filtre de type
    if (currentFilter !== 'all') {
        filtered = filtered.filter(c => c.type === currentFilter);
    }

    // Appliquer le tri
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'type':
                return a.type.localeCompare(b.type);
            case 'nom':
                return a.element.localeCompare(b.element);
            case 'date':
                return new Date(a.date_debut) - new Date(b.date_debut);
            case 'priorite':
                const priorites = { 'faible': 0, 'moyenne': 1, 'elevee': 2, 'critique': 3 };
                return priorites[b.priorite] - priorites[a.priorite];
            default:
                return 0;
        }
    });

    filteredContraintes = filtered;
    renderContraintes();
    updatePagination();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredContraintes = contraintes.filter(c => {
        return c.element.toLowerCase().includes(searchTerm) ||
               c.description.toLowerCase().includes(searchTerm) ||
               c.type.toLowerCase().includes(searchTerm);
    });

    currentPage = 1;
    renderContraintes();
    updatePagination();
}

function renderContraintes() {
    const tbody = document.getElementById('contraintesTableBody');
    if (!tbody) return;

    // Calculer les indices de pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageContraintes = filteredContraintes.slice(startIndex, endIndex);

    if (pageContraintes.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Aucune contrainte trouvée</h3>
                        <p>Aucune contrainte ne correspond à vos critères de recherche</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageContraintes.map(contrainte => {
        // Formater la période
        const dateDebut = new Date(contrainte.date_debut).toLocaleDateString('fr-FR');
        const dateFin = new Date(contrainte.date_fin).toLocaleDateString('fr-FR');
        const periode = `${dateDebut} - ${dateFin}`;

        // Formater les jours
        const joursAbrev = {
            'lundi': 'Lun',
            'mardi': 'Mar',
            'mercredi': 'Mer',
            'jeudi': 'Jeu',
            'vendredi': 'Ven',
            'samedi': 'Sam',
            'dimanche': 'Dim'
        };
        const joursFormatted = contrainte.jours.map(j => joursAbrev[j]).join(', ');

        return `
            <tr>
                <td>
                    <span class="type-badge ${contrainte.type}">
                        ${contrainte.type.charAt(0).toUpperCase() + contrainte.type.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="contrainte-info">
                        <div class="contrainte-details">
                            <h4>${contrainte.element}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    <p>${contrainte.description}</p>
                    ${joursFormatted ? `<small><strong>Jours:</strong> ${joursFormatted}</small>` : ''}
                    ${contrainte.heure_debut ? `<br><small><strong>Heures:</strong> ${contrainte.heure_debut} - ${contrainte.heure_fin}</small>` : ''}
                </td>
                <td>
                    <div class="periode-info">
                        ${periode}
                    </div>
                </td>
                <td>
                    <span class="priorite-badge ${contrainte.priorite}">
                        ${contrainte.priorite.charAt(0).toUpperCase() + contrainte.priorite.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="statut-badge ${contrainte.statut}">
                        ${contrainte.statut === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${contrainte.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${contrainte.id}, '${contrainte.description}')" title="Supprimer">
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
    const totalPages = Math.ceil(filteredContraintes.length / itemsPerPage);
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

export function changePage(direction) {
    const totalPages = Math.ceil(filteredContraintes.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderContraintes();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderContraintes();
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
        if (form && form.id === 'contrainteForm') {
            e.preventDefault();
        }
    }
});
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
// INITIALISATION PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDecorations();
    initializeApp();
    loadContraintes();
    setupEventListeners();
    updateElementsSelect();
});

// ... (le reste du code JavaScript reste identique)