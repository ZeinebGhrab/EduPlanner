
let formateurs = [];
let filteredFormateurs = [];
let currentFormateurId = null;
let currentPage = 1;
let searchTerm = '';
let selectedFormateur = null;
const itemsPerPage = 10;


document.addEventListener('DOMContentLoaded', function () {
    console.log('=== INITIALISATION FORMATEURS ===');
    console.log('Fonctions disponibles:');
    console.log('- loadFormateursFromAPI:', typeof loadFormateursFromAPI);
    console.log('- testAPIConnection:', typeof testAPIConnection);
    
    initEventListeners();
    initDisponibilites();
    loadFormateursData();
    
    if (typeof testAPIConnection === 'function') {
        testAPIConnection();
    }
});

// Fonction pour charger les formateurs
async function loadFormateursData() {
    console.log('=== DÉBUT CHARGEMENT FORMATEURS ===');
    
    try {
        if (typeof loadFormateursFromAPI !== 'function') {
            console.error('loadFormateursFromAPI non défini');
            showToast('error', 'Erreur', 'Fonction de chargement non disponible');
            return;
        }
        
        const data = await loadFormateursFromAPI();
        console.log('Données reçues de l\'API:', data);
        
        formateurs = Array.isArray(data) ? [...data] : [];
        filteredFormateurs = [...formateurs];
        currentPage = 1;
        
        console.log(`${formateurs.length} formateur(s) chargé(s)`);
        if (formateurs.length > 0) {
            console.log('Exemple premier formateur:', {
                id: formateurs[0].id,
                nom: formateurs[0].nom,
                prenom: formateurs[0].prenom,
                disponibilitesCount: formateurs[0].disponibilites ? formateurs[0].disponibilites.length : 0,
                disponibilites: formateurs[0].disponibilites
            });
        }
        
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        if (formateurs.length === 0) {
            if (typeof showEmptyState === 'function') {
                showEmptyState();
            }
        }
        
    } catch (error) {
        console.error('Erreur dans loadFormateursData:', error);
        if (typeof showToast === 'function') {
            showToast('error', 'Erreur', 'Impossible de charger les formateurs: ' + error.message);
        }
        if (typeof showEmptyState === 'function') {
            showEmptyState();
        }
    }
    
    console.log('=== FIN CHARGEMENT FORMATEURS ===');
}

function initEventListeners() {
    console.log('Initialisation des événements...');

    // Bouton Ajouter Formateur
    const addBtn = document.getElementById('addFormateur');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
        console.log('Bouton "Ajouter formateur" initialisé');
    }
    
    // Boutons Fermer Modal
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
                if (typeof closeDeleteModal === 'function') closeDeleteModal();
                if (typeof closeDisponibilitesModal === 'function') closeDisponibilitesModal();
            }
        });
    });

    const form = document.getElementById('formateurForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('Formulaire initialisé');
    }
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            searchTerm = e.target.value.toLowerCase();
            filterFormateurs();
        });
        console.log('Recherche initialisée');
    }

    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            applyFilter(filter);
        });
    });

    // Tri
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applySort(this.value);
        });
    }
    const prevBtn = document.getElementById('prevPage');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(-1));
    }

    const nextBtn = document.getElementById('nextPage');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(1));
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
            if (typeof closeDeleteModal === 'function') closeDeleteModal();
            if (typeof closeDisponibilitesModal === 'function') closeDisponibilitesModal();
        }
    });
}

function initDisponibilites() {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    jours.forEach(jour => {
        const checkbox = document.getElementById(jour);
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                const debut = document.getElementById(`${jour}_debut`);
                const fin = document.getElementById(`${jour}_fin`);

                if (debut && fin) {
                    debut.disabled = !this.checked;
                    fin.disabled = !this.checked;

                    if (!this.checked) {
                        debut.value = '';
                        fin.value = '';
                    } else {
                        if (!debut.value) debut.value = '08:00';
                        if (!fin.value) fin.value = jour === 'samedi' ? '12:00' : '17:00';
                    }
                }
            });
        }
    });
}

function filterFormateurs() {
    if (!searchTerm) {
        filteredFormateurs = [...formateurs];
    } else {
        filteredFormateurs = formateurs.filter(formateur => {
            const searchFields = [
                formateur.nom || '',
                formateur.prenom || '',
                formateur.email || '',
                formateur.specialite || '',
                formateur.matricule || '',
                formateur.telephone || ''
            ];

            return searchFields.some(field =>
                field.toLowerCase().includes(searchTerm)
            );
        });
    }

    currentPage = 1;
    if (typeof updateUI === 'function') {
        updateUI();
    }
}

function applyFilter(filterType) {
    console.log('Application filtre:', filterType);

    switch (filterType) {
        case 'actif':
            filteredFormateurs = formateurs.filter(f => f.actif === true);
            break;
        case 'inactif':
            filteredFormateurs = formateurs.filter(f => f.actif === false);
            break;
        case 'all':
        default:
            filteredFormateurs = [...formateurs];
            break;
    }

    currentPage = 1;
    if (typeof updateUI === 'function') {
        updateUI();
    }
}

function applySort(sortBy) {
    console.log('Application tri:', sortBy);

    filteredFormateurs.sort((a, b) => {
        switch (sortBy) {
            case 'nom':
                const nomA = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase();
                const nomB = `${b.nom || ''} ${b.prenom || ''}`.toLowerCase();
                return nomA.localeCompare(nomB);

            case 'specialite':
                return (a.specialite || '').localeCompare(b.specialite || '');

            case 'matricule':
                return (a.matricule || '').localeCompare(b.matricule || '');

            default:
                return 0;
        }
    });

    if (typeof updateUI === 'function') {
        updateUI();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('=== SOUMISSION FORMULAIRE ===');

    if (!validateForm()) return;

    try {
        if (typeof showLoading === 'function') {
            showLoading(true);
        }
        
        const formateurData = collectFormateurData();
        const disponibilitesData = collectDisponibilitesData();
        console.log('Données à sauvegarder:', { 
            formateurId: currentFormateurId,
            formateurData, 
            disponibilitesData 
        });

        let savedFormateur;
        let formateurId;

        if (currentFormateurId) {
            console.log(' Mise à jour du formateur', currentFormateurId);
            
            delete formateurData.id;
            delete formateurData.matricule; 
        
            if (selectedFormateur && selectedFormateur.matricule) {
                formateurData.matricule = selectedFormateur.matricule;
            }
            
            console.log('Données envoyées pour mise à jour:', formateurData);
            
            if (typeof updateFormateur !== 'function') {
                throw new Error('updateFormateur non défini');
            }
        
            savedFormateur = await updateFormateur(currentFormateurId, formateurData);
            formateurId = currentFormateurId;
            
            console.log('Formateur mis à jour:', savedFormateur);
        
            if (typeof saveFormateurDisponibilites === 'function' && disponibilitesData.length > 0) {
                console.log('Sauvegarde des disponibilités...');
                await saveFormateurDisponibilites(formateurId, disponibilitesData);
            } else if (disponibilitesData.length === 0) {
            
                console.log('Aucune disponibilité cochée, suppression des anciennes...');
                if (typeof deleteAllFormateurDisponibilites === 'function') {
                    await deleteAllFormateurDisponibilites(formateurId);
                }
            }

            const updated = updateLocalFormateur(formateurId, {
                ...formateurData,
                id: formateurId,
                disponibilites: disponibilitesData,
                matricule: selectedFormateur ? selectedFormateur.matricule : formateurData.matricule
            });
            
            if (updated) {
                console.log(`Formateur ${formateurId} mis à jour localement`);
            }
            
            if (typeof showToast === 'function') {
                showToast('success', 'Succès', 'Formateur modifié avec succès');
            }
            
        } else {
            console.log('➕ Création d\'un nouveau formateur');
            
            if (typeof createFormateur !== 'function') {
                throw new Error('createFormateur non défini');
            }

            if (!formateurData.matricule || formateurData.matricule.trim() === '') {
                formateurData.matricule = generateMatricule();
            }
            
            console.log('Données envoyées pour création:', formateurData);
            
            savedFormateur = await createFormateur(formateurData);
            
            if (savedFormateur && savedFormateur.id) {
                formateurId = savedFormateur.id;

                if (typeof saveFormateurDisponibilites === 'function' && disponibilitesData.length > 0) {
                    console.log('Sauvegarde des disponibilités pour nouveau formateur:', formateurId);
                    await saveFormateurDisponibilites(formateurId, disponibilitesData);
                }

                const newFormateur = {
                    ...savedFormateur,
                    disponibilites: disponibilitesData
                };
                formateurs.push(newFormateur);
                filteredFormateurs.push(newFormateur);
                
                console.log('Nouveau formateur ajouté localement:', newFormateur);
            }

            if (typeof showToast === 'function') {
                showToast('success', 'Succès', 'Formateur ajouté avec succès');
            }
        }

    
        closeModal();
       
        if (typeof updateUI === 'function') {
            updateUI();
        }

    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        if (typeof showToast === 'function') {
            showToast('error', 'Erreur', 'Impossible de sauvegarder: ' + error.message);
        }
    } finally {
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
    }
}

function updateLocalFormateur(id, newData) {
    const index = formateurs.findIndex(f => f.id === id);
    if (index !== -1) {
        newData.id = id;
        const existingFormateur = formateurs[index];
        if (existingFormateur.matricule && (!newData.matricule || newData.matricule.trim() === '')) {
            newData.matricule = existingFormateur.matricule;
        }

        if (existingFormateur.dateInscription) {
            newData.dateInscription = existingFormateur.dateInscription;
        }

        if (existingFormateur.role) {
            newData.role = existingFormateur.role;
        }

        if (!newData.disponibilites || newData.disponibilites.length === 0) {
            newData.disponibilites = existingFormateur.disponibilites || [];
        }

        formateurs[index] = { ...existingFormateur, ...newData };
        
        const filteredIndex = filteredFormateurs.findIndex(f => f.id === id);
        if (filteredIndex !== -1) {
            filteredFormateurs[filteredIndex] = { ...filteredFormateurs[filteredIndex], ...newData };
        }
        
        console.log(`Formateur ${id} mis à jour localement:`, formateurs[index]);
        return true;
    }
    console.warn(`Formateur ${id} non trouvé pour mise à jour`);
    return false;
}

function validateForm() {
    const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'specialite'];
    const fieldLabels = {
        'nom': 'Nom',
        'prenom': 'Prénom',
        'email': 'Email',
        'telephone': 'Téléphone',
        'specialite': 'Spécialité'
    };

    for (const field of requiredFields) {
        const input = document.getElementById(field);
        if (!input || !input.value.trim()) {
            const label = fieldLabels[field] || field;
            if (typeof showToast === 'function') {
                showToast('error', 'Validation', `Le champ "${label}" est obligatoire`);
            }
            input?.focus();
            return false;
        }
    }

    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (typeof showToast === 'function') {
            showToast('error', 'Validation', 'Adresse email invalide');
        }
        return false;
    }
    
    if (!currentFormateurId) {
        const password = document.getElementById('password').value;
        if (!password || password.length < 6) {
            if (typeof showToast === 'function') {
                showToast('error', 'Validation', 'Le mot de passe doit contenir au moins 6 caractères');
            }
            return false;
        }
    }

    return true;
}

function collectFormateurData() {
    const formData = {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        email: document.getElementById('email').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        specialite: document.getElementById('specialite').value.trim(),
        actif: document.getElementById('actif').value === 'true'
    };

    if (!currentFormateurId) {
        formData.matricule = generateMatricule();
    }

    const password = document.getElementById('password').value;
    if (password && password.trim() !== '') {
        formData.password = password;
    }

    return formData;
}

function collectDisponibilitesData() {
    const disponibilites = [];
    const joursMapping = {
        'lundi': 'LUNDI',
        'mardi': 'MARDI',
        'mercredi': 'MERCREDI',
        'jeudi': 'JEUDI',
        'vendredi': 'VENDREDI',
        'samedi': 'SAMEDI'
    };

    Object.keys(joursMapping).forEach(jourFr => {
        const checkbox = document.getElementById(jourFr);
        const debut = document.getElementById(`${jourFr}_debut`);
        const fin = document.getElementById(`${jourFr}_fin`);

        if (checkbox && checkbox.checked && debut && fin && debut.value && fin.value) {
            disponibilites.push({
                jourSemaine: joursMapping[jourFr],
                heureDebut: formatHeureForAPI(debut.value),
                heureFin: formatHeureForAPI(fin.value),
                estDisponible: true
            });
        }
    });

    console.log('Disponibilités collectées:', disponibilites);
    return disponibilites;
}

function formatHeureForAPI(heure) {
    if (!heure) return '08:00:00';
    
    heure = heure.trim();

    if (heure.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return heure;
    }
    if (heure.match(/^\d{2}:\d{2}$/)) {
        return heure + ':00';
    }
    if (heure.match(/^\d{1,2}:\d{2}$/)) {
        const parts = heure.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
    }
    
    return '08:00:00';
}

async function confirmDelete() {
    if (!currentFormateurId) return;

    try {
        if (typeof showLoading === 'function') {
            showLoading(true);
        }
        
        if (typeof deleteFormateur !== 'function') {
            throw new Error('deleteFormateur non défini');
        }
        
        console.log(' Suppression du formateur', currentFormateurId);
        
        const success = await deleteFormateur(currentFormateurId);
        
        if (success) {
            const index = formateurs.findIndex(f => f.id === currentFormateurId);
            if (index !== -1) {
                formateurs.splice(index, 1);
                
                const filteredIndex = filteredFormateurs.findIndex(f => f.id === currentFormateurId);
                if (filteredIndex !== -1) {
                    filteredFormateurs.splice(filteredIndex, 1);
                }
                
                console.log(`Formateur ${currentFormateurId} supprimé localement`);
            }
            
            if (typeof showToast === 'function') {
                showToast('success', 'Succès', 'Formateur supprimé avec succès');
            }
        }
        
        closeDeleteModal();
        
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        if (typeof showToast === 'function') {
            showToast('error', 'Erreur', 'Impossible de supprimer le formateur: ' + error.message);
        }
    } finally {
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
    }
}

function generateMatricule() {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FRM-${year}${random}`;
}

function resetDisponibilitesForm() {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    jours.forEach(jour => {
        const checkbox = document.getElementById(jour);
        const debut = document.getElementById(`${jour}_debut`);
        const fin = document.getElementById(`${jour}_fin`);

        if (checkbox && debut && fin) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
}

function fillDisponibilitesForm(disponibilites) {
    resetDisponibilitesForm();

    if (!disponibilites || !Array.isArray(disponibilites) || disponibilites.length === 0) {
        console.log('Aucune disponibilité à afficher');
        return;
    }

    console.log('Remplissage du formulaire avec disponibilités:', disponibilites);

    const joursMapping = {
        'LUNDI': 'lundi',
        'MARDI': 'mardi',
        'MERCREDI': 'mercredi',
        'JEUDI': 'jeudi',
        'VENDREDI': 'vendredi',
        'SAMEDI': 'samedi'
    };

    disponibilites.forEach(dispo => {
        if (!dispo.estDisponible) return; 
        
        const jourFr = joursMapping[dispo.jourSemaine];
        if (jourFr) {
            const checkbox = document.getElementById(jourFr);
            const debut = document.getElementById(`${jourFr}_debut`);
            const fin = document.getElementById(`${jourFr}_fin`);

            if (checkbox && debut && fin) {
                checkbox.checked = true;

                checkbox.dispatchEvent(new Event('change'));

                if (dispo.heureDebut) {
                    debut.value = dispo.heureDebut.substring(0, 5);
                }

                if (dispo.heureFin) {
                    fin.value = dispo.heureFin.substring(0, 5);
                }
                
                console.log(`Jour ${jourFr} rempli: ${debut.value} - ${fin.value}`);
            }
        }
    });
}

// Fonctions modales
function openAddModal() {
    console.log('Ouverture modal ajout');

    currentFormateurId = null;
    selectedFormateur = null;

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Ajouter un formateur';

    const submitBtnText = document.getElementById('submitBtnText');
    if (submitBtnText) submitBtnText.textContent = 'Enregistrer';

    const passwordSection = document.getElementById('passwordSection');
    if (passwordSection) {
        passwordSection.style.display = 'block';
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.value = '';
        }
    }

    const form = document.getElementById('formateurForm');
    if (form) {
        form.reset();
        resetDisponibilitesForm();
    }
    
    const modal = document.getElementById('formateurModal');
    if (modal) {
        modal.classList.add('active');
    }
    
    const actifSelect = document.getElementById('actif');
    if (actifSelect) {
        actifSelect.value = 'true';
    }
}

async function openEditModal(id) {
    console.log('Ouverture modal édition pour formateur:', id);

    try {
        const formateur = formateurs.find(f => f.id === id);
        if (!formateur) {
            throw new Error('Formateur non trouvé');
        }

        selectedFormateur = formateur;
        currentFormateurId = id;

        console.log('Formateur trouvé:', {
            id: formateur.id,
            nom: formateur.nom,
            prenom: formateur.prenom,
            email: formateur.email,
            telephone: formateur.telephone,
            specialite: formateur.specialite,
            matricule: formateur.matricule,
            actif: formateur.actif,
            disponibilitesCount: formateur.disponibilites ? formateur.disponibilites.length : 0,
            disponibilites: formateur.disponibilites
        });

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Modifier le formateur';

        const submitBtnText = document.getElementById('submitBtnText');
        if (submitBtnText) submitBtnText.textContent = 'Mettre à jour';

        const passwordSection = document.getElementById('passwordSection');
        if (passwordSection) {
            passwordSection.style.display = 'none';
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.required = false;
                passwordInput.value = '';
                passwordInput.placeholder = 'Laisser vide pour ne pas modifier';
            }
        }

        document.getElementById('nom').value = formateur.nom || '';
        document.getElementById('prenom').value = formateur.prenom || '';
        document.getElementById('email').value = formateur.email || '';
        document.getElementById('telephone').value = formateur.telephone || '';
        document.getElementById('specialite').value = formateur.specialite || '';
        document.getElementById('actif').value = formateur.actif ? 'true' : 'false';

        fillDisponibilitesForm(formateur.disponibilites || []);
        
        const modal = document.getElementById('formateurModal');
        if (modal) {
            modal.classList.add('active');
        }

    } catch (error) {
        console.error('Erreur ouverture modal édition:', error);
        if (typeof showToast === 'function') {
            showToast('error', 'Erreur', 'Impossible de charger le formateur');
        }
    }
}

function closeModal() {
    const modal = document.getElementById('formateurModal');
    if (modal) modal.classList.remove('active');
    currentFormateurId = null;
    selectedFormateur = null;
}

function openDeleteModal(id, nom) {
    console.log(' Ouverture modal suppression pour:', nom);

    currentFormateurId = id;
    const deleteFormateurName = document.getElementById('deleteFormateurName');
    if (deleteFormateurName) deleteFormateurName.textContent = nom;

    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
    currentFormateurId = null;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredFormateurs.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        if (typeof renderFormateurs === 'function') {
            renderFormateurs();
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

window.testModification = async function(formateurId) {
    console.log(' Test modification formateur ID:', formateurId);
    
    const formateur = formateurs.find(f => f.id === formateurId);
    if (!formateur) {
        console.error('Formateur non trouvé');
        return;
    }
    
    openEditModal(formateurId);
    setTimeout(async () => {

        document.getElementById('nom').value = formateur.nom + ' (modifié)';
        document.getElementById('specialite').value = 'TEST-' + formateur.specialite;
        
        console.log('Données modifiées, prêt à sauvegarder...');
    }, 500);
};

window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;
window.loadFormateursData = loadFormateursData;
window.filterFormateurs = filterFormateurs;
window.applyFilter = applyFilter;
window.applySort = applySort;
window.changePage = changePage;