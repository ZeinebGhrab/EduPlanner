import { conflits, currentConflitId, setCurrentConflitId, getConflitById } from './state.js';
import { showToast, updateUI } from './ui.js';
import { deleteConflit } from './api.js';
import { SOLUTIONS_TEMPLATES } from './config.js';

export function viewConflitDetails(conflitId) {
    console.log('Ouverture des détails pour le conflit:', conflitId);

    const conflit = getConflitById(conflitId);
    if (!conflit) {
        showToast('error', 'Erreur', 'Conflit non trouvé');
        return;
    }

    setCurrentConflitId(conflitId);
    document.getElementById('modalConflitTitle').textContent = `Détails du Conflit #${conflit.id}`;
    
    const typeBadge = document.getElementById('modalConflitType');
    const severiteBadge = document.getElementById('modalConflitSeverite');

    if (typeBadge) {
        typeBadge.textContent = conflit.typeDisplay;
    }

    if (severiteBadge) {
        severiteBadge.textContent = conflit.severiteDisplay;
        severiteBadge.className = `conflit-severite-badge severite-${conflit.severiteLabel}`;
    }

    const idElement = document.getElementById('modalConflitId');
    const dateElement = document.getElementById('modalConflitDate');
    const descriptionElement = document.getElementById('modalConflitDescription');
    const creneauElement = document.getElementById('modalConflitCreneau');

    if (idElement) idElement.textContent = conflit.id;
    if (dateElement) dateElement.textContent = conflit.dateFormatted;
    if (descriptionElement) descriptionElement.textContent = conflit.description;
    if (creneauElement) creneauElement.textContent = conflit.creneauDisplay;

    const sessionsContainer = document.getElementById('modalSessionsConflit');
    if (sessionsContainer) {
        if (conflit.sessions && conflit.sessions.length > 0) {
            sessionsContainer.innerHTML = conflit.sessions.map((session, index) => `
                <div class="conflict-item">
                    <strong>Session ${index + 1}:</strong> ${session}
                </div>
            `).join('');
        } else {
            sessionsContainer.innerHTML = '<div class="conflict-item">Aucune session spécifiée</div>';
        }
    }

    const suggestionsContainer = document.getElementById('modalSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = `
            <div class="suggestion-item">
                <div class="suggestion-content">
                    <h4>Réviser la planification</h4>
                    <p>Consultez le planning et ajustez les sessions concernées pour résoudre ce conflit.</p>
                </div>
            </div>
            <div class="suggestion-item">
                <div class="suggestion-content">
                    <h4>Modifier les ressources</h4>
                    <p>Changez la salle, le formateur ou le matériel pour une des sessions en conflit.</p>
                </div>
            </div>
        `;
    }

    document.getElementById('conflitModal').classList.add('active');
    console.log('Modal des détails ouvert');
}

export async function showSolutions(conflitId) {
    console.log('Ouverture des solutions pour le conflit:', conflitId);

    const conflit = getConflitById(conflitId);
    if (!conflit) {
        showToast('error', 'Erreur', 'Conflit non trouvé');
        return;
    }

    setCurrentConflitId(conflitId);
    
    const titleElement = document.getElementById('solutionsModalTitle');
    if (titleElement) {
        titleElement.textContent = `Solutions pour: ${conflit.typeDisplay}`;
    }

    const solutionsGrid = document.getElementById('solutionsGrid');
    if (!solutionsGrid) {
        console.error('Élément solutionsGrid non trouvé');
        return;
    }

    // Afficher un loader pendant le chargement
    solutionsGrid.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3498db;"></i>
            <p style="margin-top: 20px;">Chargement des solutions...</p>
        </div>
    `;

    // Importer dynamiquement la fonction de résolution
    try {
        const resolutionModule = await import('./resolution.js');
        const solutions = await resolutionModule.chargerSolutionsDetaillees(conflitId);
        
        // Afficher les solutions détaillées
        resolutionModule.afficherSolutionsDetaillees(solutions, conflitId);
        
    } catch (error) {
        console.error('Erreur lors du chargement des solutions:', error);
        
        // Fallback : afficher les solutions par défaut du template
        solutionsGrid.innerHTML = '';
        const solutions = SOLUTIONS_TEMPLATES[conflit.typeApi] || SOLUTIONS_TEMPLATES.DEFAULT;

        solutions.forEach((solution) => {
            const solutionCard = document.createElement('div');
            solutionCard.className = 'solution-card';
            solutionCard.dataset.solutionId = solution.id;

            solutionCard.innerHTML = `
                <div class="solution-header">
                    <div class="solution-icon">
                        <i class="${solution.icon}"></i>
                    </div>
                    <div class="solution-content">
                        <h3 class="solution-title">${solution.title}</h3>
                        <span class="solution-impact impact-${solution.impact.toLowerCase()}">${solution.impact}</span>
                        <p class="solution-description">${solution.description}</p>
                    </div>
                </div>
                <div class="solution-footer">
                    <button class="btn btn-sm btn-primary" onclick="alert('Solution template - fonctionnalité à implémenter')">
                        <i class="fas fa-wrench"></i>
                        Résolution manuelle requise
                    </button>
                </div>
            `;

            solutionsGrid.appendChild(solutionCard);
        });
    }

    document.getElementById('solutionsModal').classList.add('active');
    console.log('Modal des solutions ouvert');
}

export function toggleSolutionSelection(solutionId) {
    const checkbox = document.getElementById(`solution_${solutionId}`);
    if (!checkbox) {
        console.error(`Checkbox pour la solution ${solutionId} non trouvée`);
        return;
    }

    const solutionCard = document.querySelector(`.solution-card[data-solution-id="${solutionId}"]`);
    if (!solutionCard) {
        console.error(`Carte de solution ${solutionId} non trouvée`);
        return;
    }

    if (checkbox.checked) {
        solutionCard.classList.add('selected');
        console.log(`Solution ${solutionId} sélectionnée`);
    } else {
        solutionCard.classList.remove('selected');
        console.log(`Solution ${solutionId} désélectionnée`);
    }
}

export function getSelectedSolutions() {
    const selectedCheckboxes = document.querySelectorAll('.solution-checkbox:checked');
    const selectedSolutions = [];

    selectedCheckboxes.forEach(checkbox => {
        const solutionId = parseInt(checkbox.dataset.solutionId);
        selectedSolutions.push(solutionId);
    });

    return selectedSolutions;
}

export function applySelectedSolutions() {
    const selectedSolutions = getSelectedSolutions();

    if (selectedSolutions.length === 0) {
        showToast('warning', 'Attention', 'Veuillez sélectionner au moins une solution');
        return;
    }

    const messageElement = document.getElementById('appliedSolutionMessage');
    if (messageElement) {
        messageElement.textContent =
            `${selectedSolutions.length} solution(s) sélectionnée(s). Le conflit sera marqué comme résolu.`;
    }

    document.getElementById('solutionsModal').classList.remove('active');
    document.getElementById('solutionAppliedModal').classList.add('active');

    console.log('Solutions appliquées:', {
        conflitId: currentConflitId,
        solutions: selectedSolutions
    });

    const conflit = getConflitById(currentConflitId);
    if (conflit) {
        conflit.statut = 'resolu';
        updateUI();
    }
}

export function closeModal() {
    document.getElementById('conflitModal').classList.remove('active');
    setCurrentConflitId(null);
}

export function closeAllModals() {
    document.getElementById('conflitModal').classList.remove('active');
    document.getElementById('solutionsModal').classList.remove('active');
    document.getElementById('solutionAppliedModal').classList.remove('active');
    document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('deleteAllModal').classList.remove('active');
    setCurrentConflitId(null);
}

export function openDeleteModal(conflitId, description) {
    setCurrentConflitId(conflitId);
    document.getElementById('deleteConflitName').textContent = description;
    document.getElementById('deleteModal').classList.add('active');
}

export function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    setCurrentConflitId(null);
}

export function closeDeleteAllModal() {
    document.getElementById('deleteAllModal').classList.remove('active');
}

export function closeSolutionsModal() {
    document.getElementById('solutionsModal').classList.remove('active');
    document.querySelectorAll('.solution-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.querySelectorAll('.solution-card').forEach(card => {
        card.classList.remove('selected');
    });
}

export async function confirmDelete() {
    if (!currentConflitId) return;

    try {
        await deleteConflit(currentConflitId);
        closeDeleteModal();
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        closeDeleteModal();
    }
}