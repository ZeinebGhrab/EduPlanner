function updateUI() {
    updateStats();
    renderFormateurs();
    updatePagination();
}

function updateStats() {
    if (!formateurs || !filteredFormateurs) {
        console.error('Données non définies');
        return;
    }
    
    const totalFormateurs = formateurs.length;
    const formateursActifs = filteredFormateurs.filter(f => f.actif === true).length;
    const specialitesUniques = [...new Set(filteredFormateurs.map(f => f.specialite).filter(Boolean))].length;
    const totalDisponibilites = filteredFormateurs.reduce((sum, f) => sum + (f.disponibilites ? f.disponibilites.length : 0), 0);

    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers[0]) statNumbers[0].textContent = totalFormateurs;
    if (statNumbers[1]) statNumbers[1].textContent = formateursActifs;
    if (statNumbers[2]) statNumbers[2].textContent = specialitesUniques;
    if (statNumbers[3]) statNumbers[3].textContent = totalDisponibilites;
}

function renderFormateurs() {
    const tbody = document.getElementById('formateursTableBody');
    if (!tbody) {
        console.error('Table body non trouvé');
        return;
    }

    if (!filteredFormateurs || filteredFormateurs.length === 0) {
        showEmptyState();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageFormateurs = filteredFormateurs.slice(startIndex, endIndex);

    let html = '';

    pageFormateurs.forEach(formateur => {
        const nomComplet = `${formateur.nom || ''} ${formateur.prenom || ''}`.trim();
        const disponibilites = formateur.disponibilites || [];

        const disponibilitesActives = disponibilites.filter(d => d.estDisponible !== false);
        const joursDisponibles = disponibilitesActives.length;

        console.log(`Rendu formateur ${formateur.id}:`, {
            nomComplet: nomComplet,
            totalDisponibilites: disponibilites.length,
            disponibilitesActives: disponibilitesActives.length,
            disponibilitesActives: disponibilitesActives
        });

        let disponibiliteHTML = '';
        
        if (joursDisponibles === 0) {
            disponibiliteHTML = '<span class="badge bg-light text-danger border border-danger">Aucune</span>';
        } else {

            const joursText = disponibilitesActives
                .map(d => {
                    const jour = d.jourSemaine || '';
                    const debut = d.heureDebut ? d.heureDebut.substring(0, 5) : '';
                    const fin = d.heureFin ? d.heureFin.substring(0, 5) : '';
                    return `${jour.substring(0, 3)} (${debut}-${fin})`;
                })
                .join(', ');

            disponibiliteHTML = `
                <div class="position-relative d-inline-block">
                    <span class="badge bg-light text-success border border-success" 
                          style="cursor: help;" 
                          title="${joursText}">
                        <i class="fas fa-calendar-check me-1"></i>${joursDisponibles} jour(s)
                    </span>
                </div>
            `;
        }

        html += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar me-3">
                            <i class="fas fa-user-tie text-primary"></i>
                        </div>
                        <div>
                            <strong>${nomComplet || 'Non renseigné'}</strong><br>
                            <small class="text-muted">${formateur.email || ''}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-info border border-info">${formateur.specialite || ''}</span></td>
                <td><span class="text-muted">${formateur.matricule || ''}</span></td>
                <td><span class="text-muted">${formateur.email || ''}</span></td>
                <td><span class="text-muted">${formateur.telephone || ''}</span></td>
                <td>${disponibiliteHTML}</td>
                <td>
                    <span class="badge ${formateur.actif ? 'bg-light text-success border border-success' : 'bg-light text-secondary border border-secondary'}">
                        <i class="fas fa-circle me-1" style="font-size: 0.6rem;"></i>${formateur.actif ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit-light" 
                                onclick="openEditModal(${formateur.id})" 
                                title="Modifier le formateur">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <button class="action-btn btn-calendar-light" 
                                onclick="openDisponibilitesModal(${formateur.id})" 
                                title="Voir les disponibilités">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        
                        <button class="action-btn btn-delete-light" 
                                onclick="openDeleteModal(${formateur.id}, '${nomComplet.replace(/'/g, "\\'")}')" 
                                title="Supprimer le formateur">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function showEmptyState() {
    const tbody = document.getElementById('formateursTableBody');
    if (!tbody) return;

    const hasFormateurs = formateurs && formateurs.length > 0;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8">
                <div class="text-center py-5">
                    <i class="fas fa-user-plus fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">${hasFormateurs ? 'Aucun résultat trouvé' : 'Aucun formateur enregistré'}</h4>
                    <p class="text-muted">
                        ${hasFormateurs ?
            'Essayez de modifier vos critères de recherche' :
            'Commencez par ajouter votre premier formateur'}
                    </p>
                    <button class="btn btn-outline-primary mt-3" onclick="openAddModal()">
                        <i class="fas fa-plus me-2"></i>
                        Ajouter un formateur
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function updatePagination() {
    if (!filteredFormateurs) return;
    
    const totalPages = Math.ceil(filteredFormateurs.length / itemsPerPage);
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
                <button class="btn btn-sm ${i === currentPage ? 'btn-outline-primary' : 'btn-light border'}" 
                        onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHTML += '<span class="mx-1 text-muted">...</span>';
        }
    }

    pageNumbers.innerHTML = pagesHTML || '<button class="btn btn-sm btn-outline-primary">1</button>';
}

function goToPage(page) {
    if (page < 1) return;
    
    if (!filteredFormateurs) return;
    
    const totalPages = Math.ceil(filteredFormateurs.length / itemsPerPage);
    if (page > totalPages) return;
    
    currentPage = page;
    renderFormateurs();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDisponibilitesModal(formateurId) {
    const formateur = formateurs.find(f => f.id === formateurId);
    if (!formateur) {
        console.error(`Formateur ${formateurId} non trouvé`);
        return;
    }

    const nomComplet = `${formateur.nom || ''} ${formateur.prenom || ''}`.trim();
    const disponibilites = formateur.disponibilites || [];

    console.log(`Ouverture modal disponibilités pour ${nomComplet}:`, disponibilites);

    let modal = document.getElementById('disponibilitesModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'disponibilitesModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closeDisponibilitesModal()"></div>
            <div class="modal-content disponibilites-modal">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-calendar-alt me-2 text-info"></i>
                        Disponibilités de <span id="dispoFormateurName" class="fw-bold"></span>
                    </h5>
                    <button type="button" class="btn-close" onclick="closeDisponibilitesModal()"></button>
                </div>
                <div class="modal-body">
                    <div id="disponibilitesList">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light border" onclick="closeDisponibilitesModal()">
                        <i class="fas fa-times me-2"></i>Fermer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('dispoFormateurName').textContent = nomComplet;

    const disponibilitesList = document.getElementById('disponibilitesList');
    
    if (disponibilites.length === 0) {
        disponibilitesList.innerHTML = `
            <div class="alert alert-light border text-center">
                <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                <h6 class="text-muted">Aucune disponibilité enregistrée</h6>
                <p class="text-muted small">Ce formateur n'a pas de disponibilités définies</p>
            </div>
        `;
    } else {
        let html = '';

        const joursOrder = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        const joursMapping = {
            'LUNDI': 'Lundi',
            'MARDI': 'Mardi',
            'MERCREDI': 'Mercredi',
            'JEUDI': 'Jeudi',
            'VENDREDI': 'Vendredi',
            'SAMEDI': 'Samedi'
        };

        joursOrder.forEach(jour => {
            const dispo = disponibilites.find(d => d.jourSemaine === jour);
            const jourNom = joursMapping[jour];

            if (dispo && dispo.estDisponible !== false) {
                const heureDebut = dispo.heureDebut ? dispo.heureDebut.substring(0, 5) : '';
                const heureFin = dispo.heureFin ? dispo.heureFin.substring(0, 5) : '';

                html += `
                    <div class="jour-dispo mb-2 p-3 border rounded bg-light">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-check-circle text-success me-3 fa-lg"></i>
                            <div>
                                <strong class="d-block">${jourNom}</strong>
                                <span class="text-muted">${heureDebut} - ${heureFin}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="jour-non-dispo mb-2 p-3 border rounded bg-light">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-times-circle text-muted me-3 fa-lg"></i>
                            <div>
                                <strong class="d-block text-muted">${jourNom}</strong>
                                <span class="text-muted">Non disponible</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        const joursDisponibles = disponibilites.filter(d => d.estDisponible !== false).length;
        
        html += `
            <div class="mt-4 p-3 bg-light rounded border">
                <div class="d-flex align-items-center">
                    <i class="fas fa-calendar-check me-3 text-primary fa-lg"></i>
                    <div>
                        <strong>Récapitulatif</strong><br>
                        <span class="text-muted">${joursDisponibles} jour(s) disponible(s) sur 6</span>
                    </div>
                </div>
            </div>
        `;

        disponibilitesList.innerHTML = html;
    }

    modal.classList.add('active');
}

function closeDisponibilitesModal() {
    const modal = document.getElementById('disponibilitesModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLoading(show) {
    let loading = document.getElementById('loadingOverlay');

    if (show) {
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loadingOverlay';
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(3px);
            `;

            loading.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p style="color: #666; font-weight: 600; margin-top: 1rem;">Chargement en cours...</p>
                </div>
            `;

            document.body.appendChild(loading);
        } else {
            loading.style.display = 'flex';
        }
    } else if (loading) {
        loading.style.display = 'none';
    }
}

function showToast(type, title, message) {
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    });

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        animation: slideInRight 0.3s ease-out;
    `;

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    const iconColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';

    toast.innerHTML = `
        <div style="font-size: 1.5rem; color: ${iconColor}">
            <i class="fas fa-${icon}"></i>
        </div>
        <div style="flex: 1;">
            <strong style="display: block; margin-bottom: 0.25rem; color: #333;">${title}</strong>
            <span style="color: #666; font-size: 0.9rem;">${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" 
                style="background: none; border: none; color: #999; cursor: pointer; padding: 0.25rem;">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

window.updateUI = updateUI;
window.renderFormateurs = renderFormateurs;
window.updatePagination = updatePagination;
window.goToPage = goToPage;
window.openDisponibilitesModal = openDisponibilitesModal;
window.closeDisponibilitesModal = closeDisponibilitesModal;
window.showLoading = showLoading;
window.showToast = showToast;
window.showEmptyState = showEmptyState;