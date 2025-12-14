// ==========================================
// VARIABLES GLOBALES
// ==========================================

let formateurs = [];
let currentFormateurId = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredFormateurs = [];
let currentFilter = 'all';
let currentSort = 'nom';

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadFormateurs();
    setupEventListeners();
});

function initializeApp() {
    // Charger les données depuis localStorage si disponibles
    const savedFormateurs = localStorage.getItem('formateurs');
    if (savedFormateurs) {
        formateurs = JSON.parse(savedFormateurs);
        updateUI();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Bouton ajouter formateur
    const addBtn = document.getElementById('addFormateur');
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
    const formateurForm = document.getElementById('formateurForm');
    if (formateurForm) {
        formateurForm.addEventListener('submit', handleFormSubmit);
    }

    // Confirmation de suppression
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteFormateur);
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

    // Gestion des checkboxes de jours (désactiver les horaires si le jour n'est pas coché)
    const joursCheckboxes = document.querySelectorAll('.jour-header input[type="checkbox"]');
    joursCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const jourName = this.value.toLowerCase();
            const debutInput = document.querySelector(`input[name="${jourName}_debut"]`);
            const finInput = document.querySelector(`input[name="${jourName}_fin"]`);
            
            if (debutInput && finInput) {
                debutInput.disabled = !this.checked;
                finInput.disabled = !this.checked;
            }
        });
    });
}

// ==========================================
// GESTION DES FORMATEURS
// ==========================================

function loadFormateurs() {
    // Données de démonstration (à remplacer par un appel API)
    if (formateurs.length === 0) {
        formateurs = [
            {
                id: 1,
                nom: "Dr. Martin Dubois",
                email: "martin.dubois@formapro.com",
                telephone: "+216 71 234 567",
                specialites: ["Java", "Spring", "SQL"],
                disponibilites: {
                    lundi: { actif: true, debut: "08:00", fin: "17:00" },
                    mardi: { actif: true, debut: "08:00", fin: "17:00" },
                    mercredi: { actif: true, debut: "08:00", fin: "17:00" },
                    jeudi: { actif: true, debut: "08:00", fin: "17:00" },
                    vendredi: { actif: true, debut: "08:00", fin: "17:00" },
                    samedi: { actif: false, debut: "08:00", fin: "12:00" }
                },
                statut: "actif",
                heuresPlanifiees: 28
            },
            {
                id: 2,
                nom: "Prof. Sophie Laurent",
                email: "sophie.laurent@formapro.com",
                telephone: "+216 71 234 568",
                specialites: ["Python", "DevOps", "Cloud"],
                disponibilites: {
                    lundi: { actif: true, debut: "09:00", fin: "18:00" },
                    mardi: { actif: true, debut: "09:00", fin: "18:00" },
                    mercredi: { actif: true, debut: "09:00", fin: "18:00" },
                    jeudi: { actif: false, debut: "08:00", fin: "17:00" },
                    vendredi: { actif: true, debut: "09:00", fin: "18:00" },
                    samedi: { actif: true, debut: "09:00", fin: "13:00" }
                },
                statut: "actif",
                heuresPlanifiees: 24
            },
            {
                id: 3,
                nom: "Dr. Ahmed Ben Salem",
                email: "ahmed.bensalem@formapro.com",
                telephone: "+216 71 234 569",
                specialites: ["JavaScript", "React", "Angular"],
                disponibilites: {
                    lundi: { actif: true, debut: "08:00", fin: "16:00" },
                    mardi: { actif: true, debut: "08:00", fin: "16:00" },
                    mercredi: { actif: true, debut: "08:00", fin: "16:00" },
                    jeudi: { actif: true, debut: "08:00", fin: "16:00" },
                    vendredi: { actif: true, debut: "08:00", fin: "16:00" },
                    samedi: { actif: false, debut: "08:00", fin: "12:00" }
                },
                statut: "actif",
                heuresPlanifiees: 32
            }
        ];
        saveFormateurs();
    }
    updateUI();
}

function saveFormateurs() {
    localStorage.setItem('formateurs', JSON.stringify(formateurs));
}

// ==========================================
// GESTION DES MODALS
// ==========================================

function openAddModal() {
    currentFormateurId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un formateur';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';
    document.getElementById('formateurForm').reset();
    
    // Réinitialiser les checkboxes de disponibilités
    const joursCheckboxes = document.querySelectorAll('.jour-header input[type="checkbox"]');
    joursCheckboxes.forEach(checkbox => {
        if (checkbox.id !== 'samedi') {
            checkbox.checked = true;
        }
        checkbox.dispatchEvent(new Event('change'));
    });
    
    document.getElementById('formateurModal').classList.add('active');
}

function openEditModal(id) {
    const formateur = formateurs.find(f => f.id === id);
    if (!formateur) return;

    currentFormateurId = id;
    document.getElementById('modalTitle').textContent = 'Modifier le formateur';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';

    // Remplir le formulaire
    document.getElementById('nom').value = formateur.nom;
    document.getElementById('email').value = formateur.email;
    document.getElementById('telephone').value = formateur.telephone;

    // Cocher les spécialités
    const specialitesCheckboxes = document.querySelectorAll('input[name="specialite"]');
    specialitesCheckboxes.forEach(checkbox => {
        checkbox.checked = formateur.specialites.includes(checkbox.value);
    });

    // Remplir les disponibilités
    Object.keys(formateur.disponibilites).forEach(jour => {
        const dispo = formateur.disponibilites[jour];
        const checkbox = document.getElementById(jour);
        if (checkbox) {
            checkbox.checked = dispo.actif;
            checkbox.dispatchEvent(new Event('change'));
        }
        
        const debutInput = document.querySelector(`input[name="${jour}_debut"]`);
        const finInput = document.querySelector(`input[name="${jour}_fin"]`);
        if (debutInput) debutInput.value = dispo.debut;
        if (finInput) finInput.value = dispo.fin;
    });

    document.getElementById('formateurModal').classList.add('active');
}

function closeModal() {
    document.getElementById('formateurModal').classList.remove('active');
}

function openDeleteModal(id, nom) {
    currentFormateurId = id;
    document.getElementById('deleteFormateurName').textContent = nom;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentFormateurId = null;
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    
    // Récupérer les spécialités cochées
    const specialites = [];
    const specialitesCheckboxes = document.querySelectorAll('input[name="specialite"]:checked');
    specialitesCheckboxes.forEach(checkbox => {
        specialites.push(checkbox.value);
    });

    if (specialites.length === 0) {
        showToast('error', 'Erreur', 'Veuillez sélectionner au moins une spécialité');
        return;
    }

    // Récupérer les disponibilités
    const disponibilites = {};
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    jours.forEach(jour => {
        const checkbox = document.getElementById(jour);
        disponibilites[jour] = {
            actif: checkbox ? checkbox.checked : false,
            debut: formData.get(`${jour}_debut`) || '08:00',
            fin: formData.get(`${jour}_fin`) || '17:00'
        };
    });

    const formateurData = {
        nom: formData.get('nom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        specialites: specialites,
        disponibilites: disponibilites,
        statut: 'actif',
        heuresPlanifiees: 0
    };

    if (currentFormateurId) {
        // Mise à jour
        const index = formateurs.findIndex(f => f.id === currentFormateurId);
        if (index !== -1) {
            formateurs[index] = { ...formateurs[index], ...formateurData };
            showToast('success', 'Succès', 'Formateur modifié avec succès');
        }
    } else {
        // Ajout
        formateurData.id = Date.now();
        formateurs.push(formateurData);
        showToast('success', 'Succès', 'Formateur ajouté avec succès');
    }

    saveFormateurs();
    updateUI();
    closeModal();
}

// ==========================================
// SUPPRESSION
// ==========================================

function deleteFormateur() {
    if (!currentFormateurId) return;

    const index = formateurs.findIndex(f => f.id === currentFormateurId);
    if (index !== -1) {
        const formateurNom = formateurs[index].nom;
        formateurs.splice(index, 1);
        saveFormateurs();
        updateUI();
        closeDeleteModal();
        showToast('success', 'Succès', `${formateurNom} a été supprimé`);
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
    const totalFormateurs = formateurs.length;
    const formateursActifs = formateurs.filter(f => f.statut === 'actif').length;
    const totalSpecialites = [...new Set(formateurs.flatMap(f => f.specialites))].length;
    const totalHeures = formateurs.reduce((sum, f) => sum + (f.heuresPlanifiees || 0), 0);

    // Mettre à jour les cartes de statistiques
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) statNumbers[0].textContent = totalFormateurs;
    if (statNumbers[1]) statNumbers[1].textContent = formateursActifs;
    if (statNumbers[2]) statNumbers[2].textContent = totalSpecialites;
    if (statNumbers[3]) statNumbers[3].textContent = totalHeures + 'h';
}

function applyFilters() {
    let filtered = [...formateurs];

    // Appliquer le filtre de statut
    if (currentFilter !== 'all') {
        filtered = filtered.filter(f => {
            const joursDisponibles = Object.values(f.disponibilites).filter(d => d.actif).length;
            if (currentFilter === 'disponible') {
                return joursDisponibles >= 4;
            } else if (currentFilter === 'occupe') {
                return joursDisponibles < 4;
            }
            return true;
        });
    }

    // Appliquer le tri
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'nom':
                return a.nom.localeCompare(b.nom);
            case 'specialite':
                return a.specialites[0]?.localeCompare(b.specialites[0] || '') || 0;
            case 'disponibilite':
                const dispA = Object.values(a.disponibilites).filter(d => d.actif).length;
                const dispB = Object.values(b.disponibilites).filter(d => d.actif).length;
                return dispB - dispA;
            default:
                return 0;
        }
    });

    filteredFormateurs = filtered;
    renderFormateurs();
    updatePagination();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredFormateurs = formateurs.filter(f => {
        return f.nom.toLowerCase().includes(searchTerm) ||
               f.email.toLowerCase().includes(searchTerm) ||
               f.specialites.some(s => s.toLowerCase().includes(searchTerm));
    });

    currentPage = 1;
    renderFormateurs();
    updatePagination();
}

function renderFormateurs() {
    const tbody = document.getElementById('formateursTableBody');
    if (!tbody) return;

    // Calculer les indices de pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageFormateurs = filteredFormateurs.slice(startIndex, endIndex);

    if (pageFormateurs.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-content">
                        <i class="fas fa-user-plus"></i>
                        <h3>Aucun formateur trouvé</h3>
                        <p>Aucun formateur ne correspond à vos critères de recherche</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageFormateurs.map(formateur => {
        const joursDisponibles = Object.values(formateur.disponibilites).filter(d => d.actif).length;
        
        let disponibiliteClass = 'disponible';
        let disponibiliteText = 'Disponible';
        if (joursDisponibles < 3) {
            disponibiliteClass = 'occupe';
            disponibiliteText = 'Occupé';
        } else if (joursDisponibles < 5) {
            disponibiliteClass = 'partiel';
            disponibiliteText = 'Partiel';
        }

        return `
            <tr>
                <td>
                    <div class="formateur-info">
                        <div class="formateur-details">
                            <h4>${formateur.nom}</h4>
                        </div>
                    </div>
                </td>
                <td>
                    ${formateur.specialites.map(s => 
                        `<span class="specialite-badge">${s}</span>`
                    ).join(' ')}
                </td>
                <td>${formateur.email}</td>
                <td>${formateur.telephone}</td>
                <td>
                    <div class="disponibilite-indicator ${disponibiliteClass}">
                        ${disponibiliteText} (${joursDisponibles}j)
                    </div>
                </td>
                <td>
                    <span class="statut-badge ${formateur.statut}">
                        ${formateur.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${formateur.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${formateur.id}, '${formateur.nom}')" title="Supprimer">
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
    const totalPages = Math.ceil(filteredFormateurs.length / itemsPerPage);
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
    const totalPages = Math.ceil(filteredFormateurs.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderFormateurs();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderFormateurs();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ==========================================
// UTILITAIRES
// ==========================================

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
        if (form && form.id === 'formateurForm') {
            e.preventDefault();
        }
    }
});
