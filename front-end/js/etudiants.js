// ==========================================
// VARIABLES GLOBALES
// ==========================================

let etudiants = [];
let currentEtudiantId = null;
let currentViewMode = 'groupes'; // 'groupes' ou 'liste'
let groupes = {}; // Objet pour organiser les étudiants par groupe

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    loadEtudiants();
    setupEventListeners();
    updateUI();
});

function loadEtudiants() {
    const savedEtudiants = localStorage.getItem('etudiants');
    if (savedEtudiants) {
        etudiants = JSON.parse(savedEtudiants);
    } else {
        // Données d'exemple
        etudiants = [
            {
                id: 1,
                nom: "Ahmed Ben Ali",
                email: "ahmed.benali@email.com",
                telephone: "+216 71 234 567",
                niveau: "Licence",
                groupe: "A1"
            },
            {
                id: 2,
                nom: "Fatma Mahmoud",
                email: "fatma.mahmoud@email.com",
                telephone: "+216 71 234 568",
                niveau: "Master",
                groupe: "B2"
            },
            {
                id: 3,
                nom: "Mohamed Trabelsi",
                email: "mohamed.trabelsi@email.com",
                telephone: "+216 71 234 569",
                niveau: "Licence",
                groupe: "A1"
            },
            {
                id: 4,
                nom: "Sarra Jlassi",
                email: "sarra.jlassi@email.com",
                telephone: "+216 71 234 570",
                niveau: "Doctorat",
                groupe: "C3"
            },
            {
                id: 5,
                nom: "Youssef Karray",
                email: "youssef.karray@email.com",
                telephone: "+216 71 234 571",
                niveau: "Licence",
                groupe: "A2"
            },
            {
                id: 6,
                nom: "Amina Bouaziz",
                email: "amina.bouaziz@email.com",
                telephone: "+216 71 234 572",
                niveau: "Master",
                groupe: "B1"
            },
            {
                id: 7,
                nom: "Houssem Gara",
                email: "houssem.gara@email.com",
                telephone: "+216 71 234 573",
                niveau: "Doctorat",
                groupe: "C1"
            }
        ];
        saveEtudiants();
    }
    organiserParGroupes();
}

function saveEtudiants() {
    localStorage.setItem('etudiants', JSON.stringify(etudiants));
}

// ==========================================
// ORGANISATION PAR GROUPES
// ==========================================

function organiserParGroupes() {
    groupes = {};

    // Grouper les étudiants par groupe
    etudiants.forEach(etudiant => {
        if (!groupes[etudiant.groupe]) {
            groupes[etudiant.groupe] = {
                nom: etudiant.groupe,
                etudiants: [],
                niveaux: new Set(),
                expanded: false
            };
        }
        groupes[etudiant.groupe].etudiants.push(etudiant);
        groupes[etudiant.groupe].niveaux.add(etudiant.niveau);
    });

    // Trier les groupes par ordre alphabétique
    const groupesSorted = {};
    Object.keys(groupes).sort().forEach(key => {
        groupesSorted[key] = groupes[key];
    });

    groupes = groupesSorted;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Bouton ajouter étudiant
    const addBtn = document.getElementById('addEtudiant');
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

    // Formulaire de soumission
    const etudiantForm = document.getElementById('etudiantForm');
    if (etudiantForm) {
        etudiantForm.addEventListener('submit', handleFormSubmit);
    }

    // Confirmation de suppression
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteEtudiant);
    }

    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Changement de vue
    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) {
        viewModeSelect.addEventListener('change', function () {
            currentViewMode = this.value;
            changeViewMode();
        });
    }

    // Fermeture avec Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
        }
    });

    // Overlay des modals
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
                closeDeleteModal();
            }
        });
    });
}

// ==========================================
// GESTION DES VUES
// ==========================================

function changeViewMode() {
    const groupsContainer = document.getElementById('groupsContainer');
    const listViewContainer = document.getElementById('listViewContainer');

    if (currentViewMode === 'groupes') {
        groupsContainer.style.display = 'grid';
        listViewContainer.style.display = 'none';
        renderGroupes();
    } else {
        groupsContainer.style.display = 'none';
        listViewContainer.style.display = 'block';
        renderListe();
    }
}

// ==========================================
// RENDU DES GROUPES
// ==========================================

function renderGroupes() {
    const container = document.getElementById('groupsContainer');

    if (Object.keys(groupes).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-content">
                    <i class="fas fa-user-plus"></i>
                    <h3>Aucun groupe d'étudiants</h3>
                    <p>Commencez par ajouter votre premier étudiant</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addEtudiant').click()">
                        <i class="fas fa-plus"></i>
                        Ajouter un étudiant
                    </button>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    Object.values(groupes).forEach(groupe => {
        const niveauxList = Array.from(groupe.niveaux).join(', ');
        const isExpanded = groupe.expanded ? 'expanded' : '';
        const isEmpty = groupe.etudiants.length === 0 ? 'empty-group' : '';

        html += `
            <div class="group-card ${isExpanded} ${isEmpty}" data-groupe="${groupe.nom}">
                <div class="group-header" onclick="toggleGroup('${groupe.nom}')">
                    <div>
                        <h3>
                            <i class="fas fa-users"></i>
                            Groupe ${groupe.nom}
                        </h3>
                        <div class="badge">${groupe.etudiants.length} étudiant${groupe.etudiants.length > 1 ? 's' : ''}</div>
                    </div>
                    ${groupe.etudiants.length > 0 ? `
                    <div class="group-actions">
                        <button class="group-toggle">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
                
                <div class="group-content">
                    <div class="group-stats">
                        <div class="stat-item">
                            <i class="fas fa-user-graduate"></i>
                            <span>${groupe.etudiants.length} étudiant${groupe.etudiants.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-layer-group"></i>
                            <span>${groupe.niveaux.size} niveau${groupe.niveaux.size > 1 ? 'x' : ''}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${niveauxList}</span>
                        </div>
                    </div>
                    
                    <div class="etudiants-list">
                        ${groupe.etudiants.length > 0 ? groupe.etudiants.map(etudiant => `
                            <div class="etudiant-item" data-id="${etudiant.id}">
                                <div class="etudiant-info">
                                    <h4>${etudiant.nom}</h4>
                                    <p>${etudiant.email} • ${etudiant.telephone}</p>
                                </div>
                                <div class="etudiant-niveau niveau-${etudiant.niveau.toLowerCase()}">
                                    ${etudiant.niveau}
                                </div>
                                <div class="etudiant-actions">
                                    <button class="action-btn edit" onclick="event.stopPropagation(); openEditModal(${etudiant.id})" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="event.stopPropagation(); openDeleteModal(${etudiant.id}, '${etudiant.nom}')" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="empty-content" style="padding: 2rem 0;">
                                <i class="fas fa-user-slash"></i>
                                <p>Aucun étudiant dans ce groupe</p>
                                <button class="btn btn-primary btn-sm" onclick="openAddModal()">
                                    <i class="fas fa-plus"></i>
                                    Ajouter un étudiant
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==========================================
// RENDU DE LA LISTE
// ==========================================

function renderListe() {
    const tbody = document.getElementById('listeTableBody');

    if (etudiants.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="6">
                    <div class="empty-content">
                        <i class="fas fa-user-plus"></i>
                        <h3>Aucun étudiant enregistré</h3>
                        <p>Commencez par ajouter votre premier étudiant</p>
                        <button class="btn btn-primary" onclick="openAddModal()">
                            <i class="fas fa-plus"></i>
                            Ajouter un étudiant
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = etudiants.map(etudiant => `
        <tr>
            <td>
                <div class="formateur-info">
                    <div class="formateur-details">
                        <h4>${etudiant.nom}</h4>
                    </div>
                </div>
            </td>
            <td>${etudiant.email}</td>
            <td>${etudiant.telephone}</td>
            <td>${etudiant.niveau}</td>
            <td>${etudiant.groupe}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="openEditModal(${etudiant.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal(${etudiant.id}, '${etudiant.nom}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function toggleGroup(groupeNom) {
    groupes[groupeNom].expanded = !groupes[groupeNom].expanded;
    renderGroupes();
}

function updateUI() {
    updateStats();
    organiserParGroupes();

    if (currentViewMode === 'groupes') {
        renderGroupes();
    } else {
        renderListe();
    }
}

function updateStats() {
    const totalEtudiants = etudiants.length;
    const totalNiveaux = new Set(etudiants.map(e => e.niveau)).size;
    const totalGroupes = new Set(etudiants.map(e => e.groupe)).size;

    // Trouver le niveau le plus représenté
    const niveauxCount = {};
    etudiants.forEach(etudiant => {
        niveauxCount[etudiant.niveau] = (niveauxCount[etudiant.niveau] || 0) + 1;
    });

    let niveauPrincipal = 'Aucun';
    let maxCount = 0;
    for (const [niveau, count] of Object.entries(niveauxCount)) {
        if (count > maxCount) {
            maxCount = count;
            niveauPrincipal = niveau;
        }
    }

    // Mettre à jour les statistiques
    document.getElementById('totalEtudiants').textContent = totalEtudiants;
    document.getElementById('totalNiveaux').textContent = totalNiveaux;
    document.getElementById('totalGroupes').textContent = totalGroupes;
    document.getElementById('niveauPrincipal').textContent = niveauPrincipal;
}

// ==========================================
// GESTION DES MODALS
// ==========================================

function openAddModal() {
    currentEtudiantId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un étudiant';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';
    document.getElementById('etudiantForm').reset();
    document.getElementById('etudiantModal').classList.add('active');
}

function openEditModal(id) {
    const etudiant = etudiants.find(e => e.id === id);
    if (!etudiant) return;

    currentEtudiantId = id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'étudiant';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';

    document.getElementById('nom').value = etudiant.nom;
    document.getElementById('email').value = etudiant.email;
    document.getElementById('telephone').value = etudiant.telephone;
    document.getElementById('niveau').value = etudiant.niveau;
    document.getElementById('groupe').value = etudiant.groupe;

    document.getElementById('etudiantModal').classList.add('active');
}

function closeModal() {
    document.getElementById('etudiantModal').classList.remove('active');
}

function openDeleteModal(id, nom) {
    currentEtudiantId = id;
    document.getElementById('deleteEtudiantName').textContent = nom;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentEtudiantId = null;
}

// ==========================================
// GESTION DU FORMULAIRE
// ==========================================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const etudiantData = {
        nom: formData.get('nom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        niveau: formData.get('niveau'),
        groupe: formData.get('groupe')
    };

    if (currentEtudiantId) {
        const index = etudiants.findIndex(e => e.id === currentEtudiantId);
        if (index !== -1) {
            etudiants[index] = { ...etudiants[index], ...etudiantData };
            showToast('success', 'Succès', 'Étudiant modifié avec succès');
        }
    } else {
        etudiantData.id = Date.now();
        etudiants.push(etudiantData);
        showToast('success', 'Succès', 'Étudiant ajouté avec succès');
    }

    saveEtudiants();
    updateUI();
    closeModal();
}

// ==========================================
// SUPPRESSION
// ==========================================

function deleteEtudiant() {
    if (!currentEtudiantId) return;

    const index = etudiants.findIndex(e => e.id === currentEtudiantId);
    if (index !== -1) {
        const etudiantNom = etudiants[index].nom;
        etudiants.splice(index, 1);
        saveEtudiants();
        updateUI();
        closeDeleteModal();
        showToast('success', 'Succès', `${etudiantNom} a été supprimé`);
    }
}

// ==========================================
// RECHERCHE
// ==========================================

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm === '') {
        organiserParGroupes();
        renderGroupes();
        return;
    }

    // Filtrer les étudiants
    const etudiantsFiltres = etudiants.filter(etudiant => {
        return etudiant.nom.toLowerCase().includes(searchTerm) ||
            etudiant.email.toLowerCase().includes(searchTerm) ||
            etudiant.niveau.toLowerCase().includes(searchTerm) ||
            etudiant.groupe.toLowerCase().includes(searchTerm) ||
            etudiant.telephone.includes(searchTerm);
    });

    // Réorganiser par groupes pour l'affichage
    const groupesFiltres = {};
    etudiantsFiltres.forEach(etudiant => {
        if (!groupesFiltres[etudiant.groupe]) {
            groupesFiltres[etudiant.groupe] = {
                nom: etudiant.groupe,
                etudiants: [],
                niveaux: new Set()
            };
        }
        groupesFiltres[etudiant.groupe].etudiants.push(etudiant);
        groupesFiltres[etudiant.groupe].niveaux.add(etudiant.niveau);
    });

    // Afficher les résultats
    const container = document.getElementById('groupsContainer');

    if (Object.keys(groupesFiltres).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-content">
                    <i class="fas fa-search"></i>
                    <h3>Aucun résultat trouvé</h3>
                    <p>Aucun étudiant ne correspond à votre recherche</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    Object.values(groupesFiltres).forEach(groupe => {
        const niveauxList = Array.from(groupe.niveaux).join(', ');

        html += `
            <div class="group-card expanded" data-groupe="${groupe.nom}">
                <div class="group-header" onclick="toggleGroup('${groupe.nom}')">
                    <div>
                        <h3>
                            <i class="fas fa-users"></i>
                            Groupe ${groupe.nom}
                        </h3>
                        <div class="badge">${groupe.etudiants.length} étudiant${groupe.etudiants.length > 1 ? 's' : ''} trouvé${groupe.etudiants.length > 1 ? 's' : ''}</div>
                    </div>
                </div>
                
                <div class="group-content">
                    <div class="group-stats">
                        <div class="stat-item">
                            <i class="fas fa-search"></i>
                            <span>Résultats de recherche</span>
                        </div>
                    </div>
                    
                    <div class="etudiants-list">
                        ${groupe.etudiants.map(etudiant => `
                            <div class="etudiant-item" data-id="${etudiant.id}">
                                <div class="etudiant-info">
                                    <h4>${etudiant.nom}</h4>
                                    <p>${etudiant.email} • ${etudiant.telephone}</p>
                                </div>
                                <div class="etudiant-niveau niveau-${etudiant.niveau.toLowerCase()}">
                                    ${etudiant.niveau}
                                </div>
                                <div class="etudiant-actions">
                                    <button class="action-btn edit" onclick="event.stopPropagation(); openEditModal(${etudiant.id})" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="event.stopPropagation(); openDeleteModal(${etudiant.id}, '${etudiant.nom}')" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==========================================
// NOTIFICATIONS TOAST
// ==========================================

function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 5000);
}

// ==========================================
// FONCTIONS EXPOSÉES GLOBALEMENT
// ==========================================

// Exposer les fonctions nécessaires au HTML
window.toggleGroup = toggleGroup;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.openAddModal = openAddModal;