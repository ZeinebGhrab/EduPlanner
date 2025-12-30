import { 
    fetchGroupes, 
    fetchSalles, 
    fetchFormateurProfile, 
    fetchSessionsWithFilters as fetchSessionsAPI, 
    fetchMateriels, 
    updateSession 
} from '../shared/api-utils.js';

import { 
    showNotification, 
    getStatusClass, 
    closeModal, 
    openModal,
    initModalCloseEvents,
} from '../shared/ui-helpers.js';

import { updateUserUI } from '../../shared/config.js';

let sessions = [];


export async function loadFilters() {
    try {
        const [groupes, salles] = await Promise.all([fetchGroupes(), fetchSalles()]);
        
        const groupeSelect = document.getElementById('filterGroupe');
        groupes.forEach(g => {
            const option = document.createElement('option');
            option.value = g.id;
            option.textContent = g.nom;
            groupeSelect.appendChild(option);
        });

        const salleSelect = document.getElementById('filterSalle');
        salles.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.nom;
            salleSelect.appendChild(option);
        });

        const statutSelect = document.getElementById('filterStatut');
        ['PLANIFIE', 'TERMINE', 'A_VENIR', 'EN_COURS'].forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            statutSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Erreur chargement filtres:', err);
        showNotification('Erreur lors du chargement des filtres', 'error');
    }
}

export function initFilterEvents() {
    document.querySelectorAll('#filterGroupe, #filterSalle, #filterStatut, #filterDateDebut, #filterDateFin')
        .forEach(el => el.addEventListener('change', () => fetchSessions()));
}


export async function fetchSessions() {
    try {
        const formateur = await fetchFormateurProfile();
        updateUserUI(formateur);

        const filters = {
            groupeId: document.getElementById('filterGroupe').value !== 'all' 
                ? document.getElementById('filterGroupe').value : null,
            salleId: document.getElementById('filterSalle').value !== 'all' 
                ? document.getElementById('filterSalle').value : null,
            statut: document.getElementById('filterStatut').value !== 'all' 
                ? document.getElementById('filterStatut').value : null
        };

        sessions = await fetchSessionsAPI(formateur.id, filters);
        renderSessions();
    } catch (err) {
        console.error(err);
        showNotification('Erreur lors du chargement des sessions', 'error');
    }
}

function renderSessions() {
    const container = document.querySelector('.courses-grid');
    if (!container) return;
    container.innerHTML = '';

    sessions.forEach(session => {
        const dateObj = new Date(session.planningSemaine || Date.now());
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
        const year = dateObj.getFullYear();
        const statusClass = getStatusClass(session.statut);

        const div = document.createElement('div');
        div.className = 'course-card';
        div.innerHTML = `
            <div class="course-header">
                <h3 class="course-title">${session.nomCours}</h3>
                <div class="course-meta">
                    <div>
                        <div class="course-date">${day} ${month} ${year}</div>
                        <div class="course-time">${(session.creneauxHoraires || []).join(', ')} (${session.duree}h)</div>
                        <h4>${session.groupeNom}</h4>
                    </div>
                    <span class="status-badge ${statusClass}">${session.statut}</span>
                </div>
            </div>
            <div class="course-details">
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-users"></i></div>
                    <div class="detail-content">
                        <h4>Étudiants inscrits (${(session.etudiants || []).length})</h4>
                        <div class="students-list">
                            ${(session.etudiants || []).map(e => `
                                <div class="student-item">
                                    <div class="student-avatar">${e.split(' ').map(n => n.charAt(0)).join('')}</div>
                                    <span class="student-name">${e}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="detail-content">
                        <h4>Salle attribuée</h4>
                        <p>${session.salleNom}</p>
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-laptop"></i></div>
                    <div class="detail-content">
                        <h4>Matériel disponible</h4>
                        <p>${(session.materielRequisNoms || []).join(', ')}</p>
                    </div>
                </div>

                ${['a_venir'].includes(session.statut.toLowerCase()) ? `
                <div class="detail-item material-request">
                    <div class="detail-icon"><i class="fas fa-tools"></i></div>
                    <div class="detail-content">
                        <h4>Demande de matériel supplémentaire</h4>
                        <p>Besoin de matériel complémentaire pour cette session ?</p>
                        <button class="btn-request-material" data-course-id="${session.id}" data-course-title="${session.nomCours}">
                            <i class="fas fa-plus-circle"></i> Faire une demande
                        </button>
                    </div>
                </div>` : ''}
            </div>
        `;
        container.appendChild(div);
    });

    initModalButtons();
}


async function loadMaterialsForModal() {
    const materiels = await fetchMateriels();
    const materialSelect = document.querySelector('select[name="materialType"]');
    if (!materialSelect) return;

    materialSelect.innerHTML = '<option value="">Sélectionnez un type</option>';
    materiels.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.nom} (${m.quantite_disponible})`;
        materialSelect.appendChild(option);
    });
}

function initModalButtons() {
    document.querySelectorAll('.btn-request-material').forEach(btn => {
        btn.addEventListener('click', async () => {
            const courseId = btn.dataset.courseId;
            const courseTitle = btn.dataset.courseTitle;

            document.getElementById('courseId').value = courseId;
            document.getElementById('modalCourseTitle').textContent = courseTitle;
            
            const modal = document.getElementById('materialModal');
            openModal(modal);
            await loadMaterialsForModal();
        });
    });

    const modal = document.getElementById('materialModal');
    if (modal) {
        initModalCloseEvents(modal);
    }

    const materialForm = document.getElementById('materialForm');
    if (materialForm) {
        materialForm.addEventListener('submit', handleMaterialSubmit);
    }
}

async function handleMaterialSubmit(e) {
    e.preventDefault();

    const courseId = document.getElementById('courseId').value;
    const materialId = parseInt(e.target.materialType.value);
    const quantity = parseInt(e.target.quantity.value);

    if (!materialId || !quantity) {
        showNotification('Veuillez sélectionner un matériel et indiquer la quantité', 'error');
        return;
    }

    try {
        const session = sessions.find(s => s.id == courseId);
        const materielRequisIds = session.materielRequisIds || [];
        if (!materielRequisIds.includes(materialId)) {
            materielRequisIds.push(materialId);
        }

        await updateSession(courseId, { ...session, materielRequisIds });
        showNotification('Matériel ajouté avec succès !', 'success');
        
        const modal = document.getElementById('materialModal');
        closeModal(modal);
        fetchSessions();
    } catch (err) {
        console.error(err);
        showNotification('Impossible d\'ajouter le matériel', 'error');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    await loadFilters();
    initFilterEvents();
    await fetchSessions();
});