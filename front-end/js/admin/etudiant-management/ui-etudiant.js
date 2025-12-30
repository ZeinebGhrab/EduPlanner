function updateUI() {
    updateStats();
    updateGroupesSelect();
    updateFilterNiveaux();
    const filterHeader = document.getElementById('filterHeader');
    if (filterHeader) {
        filterHeader.innerHTML = `<h3>Tous les étudiants</h3><small>${etudiants.length} étudiant${etudiants.length > 1 ? 's' : ''}</small>`;
    }

    if (currentViewMode === 'groupes') {
        renderGroupes();
        if (document.getElementById('groupsContainer')) document.getElementById('groupsContainer').style.display = 'block';
        if (document.getElementById('listViewContainer')) document.getElementById('listViewContainer').style.display = 'none';
    } else {
        renderListe();
        if (document.getElementById('groupsContainer')) document.getElementById('groupsContainer').style.display = 'none';
        if (document.getElementById('listViewContainer')) document.getElementById('listViewContainer').style.display = 'block';
    }
}

function updateStats() {
    const totalEtudiants = etudiants.length;
    const totalNiveaux = new Set(etudiants.map(e => e.niveau)).size;
    const totalGroupes = new Set(etudiants.flatMap(e => e.groupes ? e.groupes.map(g => g.id) : [])).size;

    document.getElementById('totalEtudiants').textContent = totalEtudiants;
    document.getElementById('totalNiveaux').textContent = totalNiveaux;
    document.getElementById('totalGroupes').textContent = totalGroupes;

    const niveauxCount = {};
    etudiants.forEach(etudiant => {
        const niveau = etudiant.niveau || 'Non spécifié';
        niveauxCount[niveau] = (niveauxCount[niveau] || 0) + 1;
    });

    let niveauPrincipal = 'Aucun';
    let maxCount = 0;
    for (const [niveau, count] of Object.entries(niveauxCount)) {
        if (count > maxCount) {
            maxCount = count;
            niveauPrincipal = niveau;
        }
    }

    
}

function updateGroupesSelect() {
    const select = document.getElementById('groupeSelect');
    const filterSelect = document.getElementById('groupeSelectFilter');
    if (!select) return;

    select.innerHTML = '<option value="">Sélectionnez un groupe</option>';
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Tous les groupes</option>';
        const sansGroupeOption = document.createElement('option');
        sansGroupeOption.value = '0';
        sansGroupeOption.textContent = 'Sans groupe';
        filterSelect.appendChild(sansGroupeOption);
    }

    const effectifs = {};
    etudiants.forEach(etudiant => {
        if (etudiant.groupes) etudiant.groupes.forEach(groupe => effectifs[groupe.id] = (effectifs[groupe.id] || 0) + 1);
    });

    groupes.forEach(groupe => {
        const effectif = effectifs[groupe.id] || 0;
        const option = document.createElement('option');
        option.value = groupe.id;
        option.textContent = `${groupe.nom} (${groupe.code}) - ${effectif}/${groupe.effectifMax || 20}`;
        if (groupe.effectifMax && effectif >= groupe.effectifMax) {
            option.disabled = true;
            option.textContent += ' (COMPLET)';
        }
        select.appendChild(option);
        if (filterSelect) {
            const filterOption = document.createElement('option');
            filterOption.value = groupe.id;
            filterOption.textContent = `${groupe.nom} (${effectif} étudiants)`;
            filterSelect.appendChild(filterOption);
        }
    });

    const newOption = document.createElement('option');
    newOption.value = 'new';
    newOption.textContent = '+ Créer un nouveau groupe';
    select.appendChild(newOption);
}

function updateFilterNiveaux() {
    const filterNiveau = document.getElementById('filterNiveau');
    if (!filterNiveau) return;

    const currentValue = filterNiveau.value;
    filterNiveau.innerHTML = '<option value="">Tous les niveaux</option>';
    const niveaux = [...new Set(etudiants.map(e => e.niveau).filter(n => n))].sort();
    niveaux.forEach(niveau => {
        const option = document.createElement('option');
        option.value = niveau;
        option.textContent = niveau;
        filterNiveau.appendChild(option);
    });
    filterNiveau.value = currentValue;
}
function renderGroupes() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;

    if (etudiants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-content">
                    <i class="fas fa-users"></i>
                    <h3>Aucun étudiant enregistré</h3>
                    <p>${groupes.length > 0 ? 'Les groupes existent mais sont vides.' : 'Aucun groupe créé.'}</p>
                    <div class="empty-actions">
                        <button class="btn btn-primary" onclick="openAddModal()">
                            <i class="fas fa-plus"></i> Ajouter un étudiant
                        </button>
                        ${groupes.length === 0 ? `
                        <button class="btn btn-secondary ml-2" onclick="openCreateGroupModal()">
                            <i class="fas fa-users"></i> Créer un groupe
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const groupesMap = {};
    groupes.forEach(groupe => {
        groupesMap[groupe.id] = { ...groupe, etudiants: [], effectif: 0, niveaux: new Set() };
    });
    groupesMap[0] = { id: 0, nom: 'Sans groupe', code: '', etudiants: [], effectif: 0, niveaux: new Set(), effectifMax: 0 };

    etudiants.forEach(etudiant => {
        if (etudiant.groupes && etudiant.groupes.length > 0) {
            etudiant.groupes.forEach(groupe => {
                if (groupesMap[groupe.id]) {
                    groupesMap[groupe.id].etudiants.push(etudiant);
                    groupesMap[groupe.id].effectif++;
                    groupesMap[groupe.id].niveaux.add(etudiant.niveau);
                }
            });
        } else {
            groupesMap[0].etudiants.push(etudiant);
            groupesMap[0].effectif++;
            groupesMap[0].niveaux.add(etudiant.niveau);
        }
    });

    const groupesAfficher = Object.values(groupesMap).filter(g => g.id === 0 || g.etudiants.length > 0);
    let html = '';

    if (groupesAfficher.length === 0) {
        html = `<div class="empty-state"><div class="empty-content"><i class="fas fa-users"></i><h3>Aucun groupe avec étudiants</h3><p>Tous les étudiants sont sans groupe</p></div></div>`;
    } else {
        groupesAfficher.forEach(groupe => {
            const pourcentage = groupe.effectifMax > 0 ? Math.round((groupe.effectif / groupe.effectifMax) * 100) : 0;
            const isComplet = groupe.effectifMax > 0 && groupe.effectif >= groupe.effectifMax;
            const progressColor = isComplet ? 'urgent' : pourcentage > 80 ? 'warning' : 'success';
            const niveauxList = Array.from(groupe.niveaux).join(', ');

            html += `
                <div class="group-card">
                    <div class="group-header">
                        <div>
                            <h3><i class="fas fa-users"></i> ${groupe.nom}</h3>
                            <div class="badge ${isComplet ? 'badge-danger' : 'badge-primary'}">
                                ${groupe.effectif}${groupe.effectifMax > 0 ? `/${groupe.effectifMax}` : ''} étudiants ${isComplet ? ' - COMPLET' : ''}
                            </div>
                        </div>
                        <div class="group-actions">
                            <button class="btn btn-sm btn-primary" onclick="filterByGroup(${groupe.id})"><i class="fas fa-list"></i> Voir la liste</button>
                        </div>
                    </div>
                    <div class="group-content">
                        ${groupe.effectifMax > 0 ? `
                        <div class="effectif-progress">
                            <div class="progress-info">
                                <span>Capacité: ${groupe.effectif}/${groupe.effectifMax}</span>
                                <span>${pourcentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${progressColor}" style="width: ${pourcentage}%"></div>
                            </div>
                        </div>` : ''}
                        <div class="group-stats">
                            <div class="stat-item"><i class="fas fa-user-graduate"></i><span>${groupe.effectif} étudiant${groupe.effectif > 1 ? 's' : ''}</span></div>
                            <div class="stat-item"><i class="fas fa-layer-group"></i><span>${groupe.niveaux.size} niveau${groupe.niveaux.size > 1 ? 'x' : ''}</span></div>
                            ${groupe.niveaux.size > 0 ? `<div class="stat-item"><i class="fas fa-graduation-cap"></i><span>${niveauxList}</span></div>` : ''}
                        </div>
                        <div class="etudiants-list">
                            ${groupe.etudiants.length > 0 ? groupe.etudiants.slice(0, 3).map(etudiant => `
                                <div class="etudiant-item">
                                    <div class="etudiant-info">
                                        <h4>${etudiant.prenom} ${etudiant.nom}</h4>
                                        <p>${etudiant.email} • ${etudiant.telephone || 'Pas de téléphone'}</p>
                                        <small>Matricule: ${etudiant.matricule}</small>
                                    </div>
                                    <div class="etudiant-niveau niveau-${etudiant.niveau ? etudiant.niveau.toLowerCase().replace(/\s+/g, '_') : 'none'}">${etudiant.niveau || 'Non spécifié'}</div>
                                    <div class="etudiant-actions">
                                        <button class="action-btn edit" onclick="openEditModal(${etudiant.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                                        <button class="action-btn delete" onclick="openDeleteModal(${etudiant.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('') : `<div class="empty-content"><i class="fas fa-user-slash"></i><p>Aucun étudiant dans ce groupe</p></div>`}
                            ${groupe.etudiants.length > 3 ? `<div class="more-students"><i class="fas fa-ellipsis-h"></i><span>et ${groupe.etudiants.length - 3} étudiant${groupe.etudiants.length - 3 > 1 ? 's' : ''} de plus...</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function renderListe() {
    const tbody = document.getElementById('listeTableBody');
    if (!tbody) return;

    if (etudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-content">
                        <i class="fas fa-user-plus"></i>
                        <h3>Aucun étudiant enregistré</h3>
                        <button class="btn btn-primary" onclick="openAddModal()"><i class="fas fa-plus"></i> Ajouter un étudiant</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    etudiants.forEach(etudiant => {
        const groupesNoms = etudiant.groupes && etudiant.groupes.length > 0
            ? etudiant.groupes.map(g => g.nom).join(', ')
            : 'Sans groupe';
        html += `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar"><i class="fas fa-user-graduate"></i></div>
                        <div class="user-info">
                            <h4>${etudiant.prenom} ${etudiant.nom}</h4>
                            <div class="user-details">${etudiant.matricule || 'Pas de matricule'}</div>
                        </div>
                    </div>
                </td>
                <td>${etudiant.matricule || '-'}</td>
                <td>${etudiant.email}</td>
                <td>${etudiant.telephone || '-'}</td>
                <td>${etudiant.niveau || 'Non spécifié'}</td>
                <td>${groupesNoms}</td>
                <td><span class="status-badge ${etudiant.actif ? 'status-active' : 'status-inactive'}">${etudiant.actif ? 'Actif' : 'Inactif'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${etudiant.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="openDeleteModal(${etudiant.id})" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function displayFilteredData(filteredEtudiants, groupeNom = '') {
    const container = document.getElementById('listViewContainer');
    if (!container) return;
    currentViewMode = 'liste';
    document.getElementById('viewMode').value = 'liste';
    const filterHeader = document.getElementById('filterHeader');
    if (filterHeader) {
        if (groupeNom) {
            filterHeader.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="resetFilter()" style="background: none; border: none; color: #666; cursor: pointer; padding: 5px;">
                        <i class="fas fa-times"></i>
                    </button>
                    <div>
                        <h3 style="margin: 0; color: #2c3e50;">Étudiants du groupe : ${groupeNom}</h3>
                        <small style="color: #7f8c8d; font-size: 0.9rem;">${filteredEtudiants.length} étudiant${filteredEtudiants.length > 1 ? 's' : ''}</small>
                    </div>
                </div>
            `;
        } else {
            filterHeader.innerHTML = `
                <h3 style="margin: 0; color: #2c3e50;">Tous les étudiants</h3>
                <small style="color: #7f8c8d; font-size: 0.9rem;">${filteredEtudiants.length} étudiant${filteredEtudiants.length > 1 ? 's' : ''}</small>
            `;
        }
    }
    const tbody = document.getElementById('listeTableBody');
    if (!tbody) return;

    if (filteredEtudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-content">
                        <i class="fas fa-users"></i>
                        <h3>Aucun étudiant</h3>
                        <p>${groupeNom ? `Aucun étudiant dans le groupe "${groupeNom}"` : 'Aucun étudiant ne correspond aux critères'}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    filteredEtudiants.forEach(etudiant => {
        const groupesNoms = etudiant.groupes && etudiant.groupes.length > 0
            ? etudiant.groupes.map(g => g.nom).join(', ')
            : 'Sans groupe';
        html += `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="user-info">
                            <h4>${etudiant.prenom} ${etudiant.nom}</h4>
                            <div class="user-details">${etudiant.matricule || 'Pas de matricule'}</div>
                        </div>
                    </div>
                </td>
                <td>${etudiant.matricule || '-'}</td>
                <td>${etudiant.email}</td>
                <td>${etudiant.telephone || '-'}</td>
                <td>${etudiant.niveau || 'Non spécifié'}</td>
                <td>${groupesNoms}</td>
                <td>
                    <span class="status-badge ${etudiant.actif ? 'status-active' : 'status-inactive'}">
                        ${etudiant.actif ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditModal(${etudiant.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="openDeleteModal(${etudiant.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    if (document.getElementById('groupsContainer')) document.getElementById('groupsContainer').style.display = 'none';
    if (document.getElementById('listViewContainer')) document.getElementById('listViewContainer').style.display = 'block';
}
function filterByGroup(groupId) {
    removeAllToasts();
    if (!groupId && groupId !== 0) {
        updateUI();
        return;
    }
    let filteredEtudiants;
    if (groupId === 0) {
        filteredEtudiants = etudiants.filter(e => !e.groupes || e.groupes.length === 0);
    } else {
        filteredEtudiants = etudiants.filter(e => e.groupes && e.groupes.some(g => g.id === groupId));
    }
    let groupeNom = groupId === 0 ? 'Sans groupe' : (groupes.find(g => g.id === groupId)?.nom || `Groupe ${groupId}`);
    displayFilteredData(filteredEtudiants, groupeNom);
}



function resetFilter() {
    removeAllToasts();
    updateUI();
    const filterHeader = document.getElementById('filterHeader');
    if (filterHeader) {
        filterHeader.innerHTML = `
            <h3 style="margin: 0; color: #2c3e50;">Tous les étudiants</h3>
            <small style="color: #7f8c8d; font-size: 0.9rem;">${etudiants.length} étudiant${etudiants.length > 1 ? 's' : ''}</small>
        `;
    }
}

function changeViewMode() {
    removeAllToasts();
    updateUI();
}
window.renderGroupes = renderGroupes;
window.renderListe = renderListe;
window.displayFilteredData = displayFilteredData;
window.filterByGroup = filterByGroup;
window.resetFilter = resetFilter;
window.changeViewMode = changeViewMode;
