import { 
    fetchDisponibilites, 
    createDisponibilite, 
    updateDisponibilite, 
    deleteDisponibilite 
} from '../shared/api-utils.js';

import { 
    JOURS_REVERSE_MAP, 
    normalizeTime, 
    validateTimeSlot,
    showNotification,
    closeModal,
    initModalCloseEvents
} from '../shared/ui-helpers.js';


let disponibilites = [];
let currentFormateurId = null;
let selectedDisponibiliteIds = new Set();

const JOURS_LABELS = {
    'LUNDI': 'Lundi',
    'MARDI': 'Mardi', 
    'MERCREDI': 'Mercredi',
    'JEUDI': 'Jeudi',
    'VENDREDI': 'Vendredi',
    'SAMEDI': 'Samedi',
    'DIMANCHE': 'Dimanche'
};


export async function loadDisponibilites(formateurId) {
    try {
        currentFormateurId = formateurId;
        disponibilites = await fetchDisponibilites(formateurId);
        renderWeekView();
    } catch (err) {
        console.error('Erreur chargement disponibilités:', err);
        showNotification('Impossible de charger les disponibilités', 'error');
    }
}

function renderWeekView() {
    const weekView = document.querySelector('.week-view');
    if (!weekView) return;

    const jours = Object.entries(JOURS_LABELS);
    
    weekView.innerHTML = `
        <div class="week-grid">
            ${jours.map(([key, label]) => `
                <div class="day-column">
                    <div class="day-header">${label}</div>
                    <div class="day-slots" data-jour="${JOURS_REVERSE_MAP[key]}">
                        ${renderDaySlots(key)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    attachSlotClickEvents();
}

function renderDaySlots(jourSemaine) {
    const dayDispos = disponibilites.filter(d => 
        d.jourSemaine === jourSemaine && d.estDisponible
    );
    
    if (dayDispos.length === 0) {
        return '<div class="empty-slot">Aucune disponibilité</div>';
    }

    return dayDispos.map(dispo => {
        const isSelected = selectedDisponibiliteIds.has(dispo.id);
        const heureDebut = normalizeTime(dispo.heureDebut);
        const heureFin = normalizeTime(dispo.heureFin);
        
        return `
            <div class="time-slot ${isSelected ? 'selected' : ''}" 
                 data-dispo-id="${dispo.id}"
                 data-jour="${dispo.jourSemaine}">
                <div class="slot-time">
                    <i class="fas fa-clock"></i>
                    ${heureDebut} - ${heureFin}
                </div>
                ${isSelected ? '<i class="fas fa-check-circle slot-check"></i>' : ''}
            </div>
        `;
    }).join('');
}

function attachSlotClickEvents() {
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const dispoId = parseInt(slot.dataset.dispoId);
            toggleSlotSelection(dispoId);
        });
    });
}

function toggleSlotSelection(dispoId) {
    if (selectedDisponibiliteIds.has(dispoId)) {
        selectedDisponibiliteIds.delete(dispoId);
    } else {
        selectedDisponibiliteIds.add(dispoId);
    }
    renderWeekView();
    updateActionButtons();
}

function updateActionButtons() {
    const hasSelection = selectedDisponibiliteIds.size > 0;
    const modifierBtn = document.querySelector('.availability-section .btn-primary');
    
    if (hasSelection) {
        modifierBtn.innerHTML = '<i class="fas fa-trash"></i> Supprimer la sélection';
        modifierBtn.onclick = handleDeleteSelection;
    } else {
        modifierBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter une disponibilité';
        modifierBtn.onclick = openAddDisponibiliteModal;
    }
}


function openAddDisponibiliteModal() {
    const modal = createDisponibiliteModal();
    document.body.appendChild(modal);
}

function createDisponibiliteModal(disponibilite = null) {
    const isEdit = disponibilite !== null;
    const modal = document.createElement('div');
    modal.className = 'material-modal';
    modal.id = 'disponibiliteModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>
                    <i class="fas fa-calendar-${isEdit ? 'edit' : 'plus'}"></i> 
                    ${isEdit ? 'Modifier' : 'Ajouter'} une disponibilité
                </h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="disponibiliteForm">
                <div class="form-group">
                    <label for="jourSemaine">
                        <i class="fas fa-calendar-day"></i> Jour de la semaine
                    </label>
                    <select id="jourSemaine" name="jourSemaine" required>
                        <option value="">Sélectionnez un jour</option>
                        ${Object.entries(JOURS_LABELS).map(([key, label]) => `
                            <option value="${key}" ${disponibilite?.jourSemaine === key ? 'selected' : ''}>
                                ${label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="heureDebut">
                            <i class="fas fa-clock"></i> Heure de début
                        </label>
                        <input type="time" 
                               id="heureDebut" 
                               name="heureDebut" 
                               value="${disponibilite ? normalizeTime(disponibilite.heureDebut) : ''}"
                               required>
                    </div>
                    <div class="form-group">
                        <label for="heureFin">
                            <i class="fas fa-clock"></i> Heure de fin
                        </label>
                        <input type="time" 
                               id="heureFin" 
                               name="heureFin" 
                               value="${disponibilite ? normalizeTime(disponibilite.heureFin) : ''}"
                               required>
                    </div>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" 
                               id="estDisponible" 
                               name="estDisponible" 
                               ${!disponibilite || disponibilite.estDisponible ? 'checked' : ''}>
                        <span>Disponible</span>
                    </label>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-outline btn-cancel">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${isEdit ? 'Modifier' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    `;

    initModalCloseEvents(modal);
    
    const form = modal.querySelector('#disponibiliteForm');
    if (isEdit) {
        form.onsubmit = (e) => handleEditDisponibilite(e, modal, disponibilite.id);
    } else {
        form.onsubmit = (e) => handleAddDisponibilite(e, modal);
    }

    return modal;
}

async function handleAddDisponibilite(e, modal) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const heureDebut = formData.get('heureDebut');
    const heureFin = formData.get('heureFin');
    
    // Validation
    const validation = validateTimeSlot(heureDebut, heureFin);
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    const disponibiliteData = {
        formateurId: currentFormateurId,
        jourSemaine: formData.get('jourSemaine'),
        heureDebut: heureDebut + ':00',
        heureFin: heureFin + ':00',
        estDisponible: formData.get('estDisponible') === 'on'
    };

    try {
        await createDisponibilite(disponibiliteData);
        showNotification('Disponibilité ajoutée avec succès !', 'success');
        closeModal(modal);
        await loadDisponibilites(currentFormateurId);
    } catch (err) {
        console.error('Erreur création disponibilité:', err);
        showNotification('Impossible d\'ajouter la disponibilité', 'error');
    }
}

async function handleEditDisponibilite(e, modal, disponibiliteId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const heureDebut = formData.get('heureDebut');
    const heureFin = formData.get('heureFin');

    const validation = validateTimeSlot(heureDebut, heureFin);
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    const disponibiliteData = {
        formateurId: currentFormateurId,
        jourSemaine: formData.get('jourSemaine'),
        heureDebut: heureDebut + ':00',
        heureFin: heureFin + ':00',
        estDisponible: formData.get('estDisponible') === 'on'
    };

    try {
        await updateDisponibilite(disponibiliteId, disponibiliteData);
        showNotification('Disponibilité modifiée avec succès !', 'success');
        closeModal(modal);
        await loadDisponibilites(currentFormateurId);
    } catch (err) {
        console.error('Erreur modification disponibilité:', err);
        showNotification('Impossible de modifier la disponibilité', 'error');
    }
}


async function handleDeleteSelection() {
    if (selectedDisponibiliteIds.size === 0) return;

    const count = selectedDisponibiliteIds.size;
    const confirmation = confirm(
        `Êtes-vous sûr de vouloir supprimer ${count} disponibilité(s) ?\nCette action est irréversible.`
    );

    if (!confirmation) return;

    try {
        const deletePromises = Array.from(selectedDisponibiliteIds).map(id => 
            deleteDisponibilite(id)
        );
        
        await Promise.all(deletePromises);
        
        showNotification(`${count} disponibilité(s) supprimée(s) avec succès !`, 'success');
        selectedDisponibiliteIds.clear();
        await loadDisponibilites(currentFormateurId);
    } catch (err) {
        console.error('Erreur suppression:', err);
        showNotification('Erreur lors de la suppression des disponibilités', 'error');
    }
}


export function initAvailabilityManagement(formateurId) {
    loadDisponibilites(formateurId);
    
    const modifierBtn = document.querySelector('.availability-section .btn-primary');
    if (modifierBtn) {
        modifierBtn.onclick = openAddDisponibiliteModal;
    }
}