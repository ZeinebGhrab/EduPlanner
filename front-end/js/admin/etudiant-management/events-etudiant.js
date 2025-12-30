function setupEventListeners() {
    const addEtudiantBtn = document.getElementById('addEtudiant');
    if (addEtudiantBtn) addEtudiantBtn.addEventListener('click', openAddModal);

    const createGroupBtn = document.getElementById('createGroupBtn');
    if (createGroupBtn) createGroupBtn.addEventListener('click', openCreateGroupModal);

    const searchInput = document.getElementById('searchInput');
    const filterNiveau = document.getElementById('filterNiveau');
    const filterStatut = document.getElementById('filterStatut');
    const filterGroupe = document.getElementById('groupeSelectFilter');
    const viewModeSelect = document.getElementById('viewMode');
    const telephoneInput = document.getElementById('telephone');

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (filterNiveau) filterNiveau.addEventListener('change', handleFilter);
    if (filterStatut) filterStatut.addEventListener('change', handleFilter);
    if (filterGroupe) filterGroupe.addEventListener('change', handleFilter);

    if (telephoneInput) {
        telephoneInput.addEventListener('blur', function () {
            if (this.value) {
                let cleaned = this.value.replace(/\D/g, '');
                if (cleaned.length >= 8) {
                    if (cleaned.startsWith('216')) {
                        this.value = `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
                    } else if (cleaned.startsWith('0')) {
                        this.value = `+216 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
                    } else {
                        this.value = `+216 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
                    }
                }
            }
        });
    }

    if (viewModeSelect) {
        viewModeSelect.addEventListener('change', function () {
            currentViewMode = this.value;
            changeViewMode();
        });
    }
}

function setupModalListeners() {
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', e => { e.preventDefault(); closeModal(); });
    if (cancelBtn) cancelBtn.addEventListener('click', e => { e.preventDefault(); closeModal(); });

    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', e => { e.preventDefault(); closeDeleteModal(); });
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', e => { e.preventDefault(); closeDeleteModal(); });

    const closeCreateGroupModalBtn = document.getElementById('closeCreateGroupModal');
    const cancelCreateGroupBtn = document.getElementById('cancelCreateGroup');
    if (closeCreateGroupModalBtn) closeCreateGroupModalBtn.addEventListener('click', e => { e.preventDefault(); closeCreateGroupModal(); });
    if (cancelCreateGroupBtn) cancelCreateGroupBtn.addEventListener('click', e => { e.preventDefault(); closeCreateGroupModal(); });

    const etudiantForm = document.getElementById('etudiantForm');
    const createGroupForm = document.getElementById('createGroupForm');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const groupeSelect = document.getElementById('groupeSelect');

    if (etudiantForm) etudiantForm.addEventListener('submit', e => { e.preventDefault(); handleFormSubmit(e); });
    if (createGroupForm) createGroupForm.addEventListener('submit', e => { e.preventDefault(); handleCreateGroup(e); });
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', e => { e.preventDefault(); deleteEtudiant(); });

    if (groupeSelect) {
        groupeSelect.addEventListener('change', function () {
            if (this.value === 'new') {
                closeModal();
                setTimeout(openCreateGroupModal, 300);
            }
        });
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

    document.addEventListener('click', e => {
        if (e.target.classList.contains('modal') && e.target.classList.contains('active')) closeAllModals();
    });
}
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (!searchTerm) {
        handleFilter();
        return;
    }

    let filtered = etudiants;
    const niveau = document.getElementById('filterNiveau').value;
    const statut = document.getElementById('filterStatut').value;
    const groupeId = document.getElementById('groupeSelectFilter')?.value;

    if (niveau) filtered = filtered.filter(e => e.niveau === niveau);
    if (statut !== '') filtered = filtered.filter(e => e.actif === (statut === 'true'));
    if (groupeId) {
        if (groupeId === '0') filtered = filtered.filter(e => !e.groupes || e.groupes.length === 0);
        else filtered = filtered.filter(e => e.groupes?.some(g => g.id === parseInt(groupeId)));
    }

    filtered = filtered.filter(etudiant => {
        const searchStr = `
            ${etudiant.nom || ''}
            ${etudiant.prenom || ''}
            ${etudiant.email || ''}
            ${etudiant.matricule || ''}
            ${etudiant.niveau || ''}
            ${etudiant.telephone || ''}
            ${etudiant.groupes?.map(g => g.nom).join(' ') || ''}
        `.toLowerCase();
        return searchStr.includes(searchTerm);
    });

    const filterHeader = document.getElementById('filterHeader');
    if (filterHeader) {
        filterHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="resetFilter()" style="background: none; border: none; color: #666; cursor: pointer; padding: 5px;">
                    <i class="fas fa-times"></i>
                </button>
                <div>
                    <h3 style="margin: 0; color: #2c3e50;">Résultats de recherche</h3>
                    <small style="color: #7f8c8d; font-size: 0.9rem;">${filtered.length} étudiant${filtered.length > 1 ? 's' : ''}</small>
                </div>
            </div>
        `;
    }

    displayFilteredData(filtered);
}

function handleFilter() {
    removeAllToasts();

    const niveau = document.getElementById('filterNiveau').value;
    const statut = document.getElementById('filterStatut').value;
    const groupeId = document.getElementById('groupeSelectFilter')?.value;
    const searchTerm = document.getElementById('searchInput')?.value;

    let filtered = etudiants;

    if (niveau) filtered = filtered.filter(e => e.niveau === niveau);
    if (statut !== '') filtered = filtered.filter(e => e.actif === (statut === 'true'));
    if (groupeId) {
        if (groupeId === '0') filtered = filtered.filter(e => !e.groupes || e.groupes.length === 0);
        else filtered = filtered.filter(e => e.groupes?.some(g => g.id === parseInt(groupeId)));
    }
    if (searchTerm) {
        filtered = filtered.filter(etudiant => {
            const searchStr = `
                ${etudiant.nom || ''}
                ${etudiant.prenom || ''}
                ${etudiant.email || ''}
                ${etudiant.matricule || ''}
                ${etudiant.niveau || ''}
                ${etudiant.telephone || ''}
                ${etudiant.groupes?.map(g => g.nom).join(' ') || ''}
            `.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }

    const filterHeader = document.getElementById('filterHeader');
    if (filterHeader) {
        let title = 'Étudiants filtrés';
        if (groupeId) {
            const groupe = groupes.find(g => g.id === parseInt(groupeId));
            title = groupe ? `Étudiants du groupe : ${groupe.nom}` : 'Étudiants sans groupe';
        } else if (niveau) title = `Étudiants en ${niveau}`;
        else if (statut !== '') title = statut === 'true' ? 'Étudiants actifs' : 'Étudiants inactifs';
        if (searchTerm) title += ' (avec recherche)';

        filterHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="resetFilter()" style="background: none; border: none; color: #666; cursor: pointer; padding: 5px;">
                    <i class="fas fa-times"></i>
                </button>
                <div>
                    <h3 style="margin: 0; color: #2c3e50;">${title}</h3>
                    <small style="color: #7f8c8d; font-size: 0.9rem;">${filtered.length} étudiant${filtered.length > 1 ? 's' : ''}</small>
                </div>
            </div>
        `;
    }

    displayFilteredData(filtered);
}
window.handleSearch = handleSearch;
window.handleFilter = handleFilter;
