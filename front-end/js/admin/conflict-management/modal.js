import { conflits, currentConflitId, setCurrentConflitId, getConflitById } from './state.js';
import { showToast, updateUI, showLoading, hideLoading } from './ui.js';
import { deleteConflit, loadConflitsFromAPI } from './api.js';
import { SOLUTIONS_TEMPLATES } from './config.js';
import { API_BASE_URL } from '../../shared/config.js';

const DEFAULT_PLANNING_ID = 1;

// ========================================================================
// GESTION DES MODALS - DÉTAILS DU CONFLIT
// ========================================================================

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

    document.getElementById('conflitModal').classList.add('active');
}

// ========================================================================
// GESTION DES SOLUTIONS
// ========================================================================

/**
 * Affiche les solutions détaillées depuis le backend
 */
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

    // Afficher un loader
    solutionsGrid.innerHTML = '<div class="loading-solutions"><i class="fas fa-spinner fa-spin"></i> Chargement des solutions...</div>';
    
    try {
        showLoading('Récupération des solutions disponibles...');
        
        // Récupérer les solutions depuis le backend
        const response = await fetch(`${API_BASE_URL}/admin/planning/resolution/solutions/${DEFAULT_PLANNING_ID}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Trouver les solutions pour ce conflit spécifique
        const conflitData = result.conflits.find(c => c.id === conflitId);
        
        if (!conflitData || !conflitData.solutions || conflitData.solutions.length === 0) {
            solutionsGrid.innerHTML = `
                <div class="no-solutions">
                    <i class="fas fa-info-circle"></i>
                    <h3>Aucune solution disponible</h3>
                    <p>Ce conflit ne peut pas être résolu automatiquement. Veuillez le corriger manuellement.</p>
                </div>
            `;
            document.getElementById('solutionsModal').classList.add('active');
            return;
        }
        
        // Afficher les solutions
        afficherSolutionsDetaillees(conflitData.solutions, conflitId);
        
    } catch (error) {
        console.error('Erreur lors du chargement des solutions:', error);
        solutionsGrid.innerHTML = `
            <div class="no-solutions error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de récupérer les solutions. Veuillez réessayer.</p>
            </div>
        `;
        showToast('error', 'Erreur', 'Impossible de charger les solutions');
    } finally {
        hideLoading();
        document.getElementById('solutionsModal').classList.add('active');
    }
}

/**
 * Affiche les solutions détaillées dans la modal avec sélection multiple
 */
function afficherSolutionsDetaillees(solutions, conflitId) {
    const solutionsGrid = document.getElementById('solutionsGrid');
    
    solutionsGrid.innerHTML = '';
    
    solutions.forEach((solution, index) => {
        const solutionCard = document.createElement('div');
        solutionCard.className = 'solution-card-enhanced';
        solutionCard.dataset.solutionId = `solution-${conflitId}-${index}`;
        solutionCard.dataset.conflitId = conflitId;
        solutionCard.dataset.solutionType = solution.type;
        solutionCard.dataset.solutionData = JSON.stringify(solution.data);
        
        // Déterminer la couleur selon l'impact
        let impactClass = 'impact-faible';
        if (solution.impact && typeof solution.impact === 'string') {
            const impact = solution.impact.toLowerCase();
            if (impact.includes('élevé')) impactClass = 'impact-eleve';
            else if (impact.includes('moyen')) impactClass = 'impact-moyen';
        }
        
        // Déterminer si la solution est applicable
        const isApplicable = solution.applicable !== false;
        
        solutionCard.innerHTML = `
            <div class="solution-selection">
                <input type="checkbox" 
                       class="solution-checkbox" 
                       id="checkbox-${conflitId}-${index}"
                       data-solution-index="${index}"
                       ${!isApplicable ? 'disabled' : ''}>
                <label for="checkbox-${conflitId}-${index}" class="checkbox-label"></label>
            </div>
            <div class="solution-header-enhanced">
                <div class="solution-icon-enhanced">
                    <i class="${solution.icon || 'fas fa-lightbulb'}"></i>
                </div>
                <div class="solution-info">
                    <h3 class="solution-title">${solution.label || solution.title}</h3>
                    <span class="solution-impact ${impactClass}">
                        Impact: ${solution.impact || 'Variable'}
                    </span>
                </div>
            </div>
            <div class="solution-body-enhanced">
                <p class="solution-description">${solution.description}</p>
                
                ${solution.data && solution.data.options ? `
                    <div class="solution-options">
                        <h4><i class="fas fa-cog"></i> Options disponibles:</h4>
                        <ul>
                            ${renderSolutionOptions(solution.data.options, solution.type)}
                        </ul>
                    </div>
                ` : ''}
                
                ${!isApplicable ? `
                    <div class="solution-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Solution non applicable automatiquement</span>
                    </div>
                ` : ''}
            </div>
            <div class="solution-footer-enhanced">
                <button 
                    class="btn btn-sm ${isApplicable ? 'btn-success' : 'btn-secondary'}" 
                    onclick="appliquerSolutionUnique(${conflitId}, '${solution.type}', ${index})"
                    ${!isApplicable ? 'disabled' : ''}
                >
                    <i class="fas ${isApplicable ? 'fa-check' : 'fa-ban'}"></i>
                    ${isApplicable ? 'Appliquer seule' : 'Non applicable'}
                </button>
            </div>
        `;
        
        solutionsGrid.appendChild(solutionCard);
    });
    
    // Attacher les événements aux checkboxes
    document.querySelectorAll('.solution-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleSolutionCard(this);
        });
    });
    
    // Réinitialiser le compteur de sélection
    updateSelectionCount();
}

/**
 * Rend les options d'une solution sous forme de liste
 */
function renderSolutionOptions(options, type) {
    if (!options || options.length === 0) return '';
    
    const limitedOptions = options.slice(0, 5);
    
    return limitedOptions.map(option => {
        let optionText = '';
        
        switch (type) {
            case 'CHANGER_FORMATEUR':
                optionText = `${option.nom} - ${option.specialite}`;
                break;
            case 'CHANGER_SALLE':
                optionText = `${option.nom} (Capacité: ${option.capacite}, ${option.batiment})`;
                break;
            case 'CHANGER_CRENEAU':
            case 'CHANGER_CRENEAU_COMPLET':
                optionText = `${option.jour} ${option.heureDebut} - ${option.heureFin}`;
                break;
            default:
                optionText = option.nom || option.label || JSON.stringify(option);
        }
        
        return `<li><i class="fas fa-check-circle"></i> ${optionText}</li>`;
    }).join('') + (options.length > 5 ? `<li><i>... et ${options.length - 5} autre(s)</i></li>` : '');
}

// ========================================================================
// GESTION DE LA SÉLECTION MULTIPLE
// ========================================================================

/**
 * Toggle la sélection d'une carte de solution
 */
export function toggleSolutionCard(checkbox) {
    const card = checkbox.closest('.solution-card-enhanced');
    if (checkbox.checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    updateSelectionCount();
}

/**
 * Met à jour le compteur de solutions sélectionnées
 */
function updateSelectionCount() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:not(:disabled)');
    const checkedCount = document.querySelectorAll('.solution-checkbox:checked').length;
    
    const countElement = document.getElementById('selectedCount');
    const applyBtn = document.getElementById('applySelectedBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    
    if (countElement) {
        countElement.textContent = `${checkedCount} solution(s) sélectionnée(s)`;
    }
    
    if (applyBtn) {
        applyBtn.disabled = checkedCount === 0;
    }
    
    // Afficher le bon bouton (Tout sélectionner / Tout désélectionner)
    if (selectAllBtn && deselectAllBtn) {
        if (checkedCount === checkboxes.length && checkboxes.length > 0) {
            selectAllBtn.style.display = 'none';
            deselectAllBtn.style.display = 'inline-flex';
        } else {
            selectAllBtn.style.display = 'inline-flex';
            deselectAllBtn.style.display = 'none';
        }
    }
}

/**
 * Sélectionne toutes les solutions applicables
 */
export function selectAllSolutions() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        toggleSolutionCard(checkbox);
    });
}

/**
 * Désélectionne toutes les solutions
 */
export function deselectAllSolutions() {
    const checkboxes = document.querySelectorAll('.solution-checkbox:checked');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        toggleSolutionCard(checkbox);
    });
}

/**
 * Applique les solutions sélectionnées
 */
export async function applySelectedSolutions() {
    const selectedCheckboxes = document.querySelectorAll('.solution-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        showToast('warning', 'Attention', 'Veuillez sélectionner au moins une solution');
        return;
    }
    
    const confirmation = confirm(
        `Voulez-vous appliquer ${selectedCheckboxes.length} solution(s) ?\n\n` +
        'Cette action modifiera le planning et résoudra les conflits associés.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading('Application des solutions sélectionnées...');
        
        let nbReussis = 0;
        let nbEchecs = 0;
        
        for (const checkbox of selectedCheckboxes) {
            const card = checkbox.closest('.solution-card-enhanced');
            const conflitId = parseInt(card.dataset.conflitId);
            const solutionType = card.dataset.solutionType;
            const solutionData = JSON.parse(card.dataset.solutionData);
            
            try {
                const response = await fetch(`${API_BASE_URL}/admin/planning/resolution/appliquer-solution`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conflitId: conflitId,
                        solutionType: solutionType,
                        solutionData: solutionData
                    })
                });

                if (response.ok) {
                    nbReussis++;
                } else {
                    nbEchecs++;
                }
            } catch (error) {
                console.error('Erreur lors de l\'application d\'une solution:', error);
                nbEchecs++;
            }
        }
        
        // Afficher le résultat
        if (nbReussis > 0) {
            showToast('success', 'Succès', 
                `${nbReussis} solution(s) appliquée(s) avec succès` + 
                (nbEchecs > 0 ? ` (${nbEchecs} échec(s))` : ''));
        } else {
            showToast('error', 'Erreur', 'Aucune solution n\'a pu être appliquée');
        }
        
        // Fermer la modal et recharger les conflits
        document.getElementById('solutionsModal').classList.remove('active');
        await loadConflitsFromAPI();
        updateUI();
        
    } catch (error) {
        console.error('Erreur lors de l\'application des solutions:', error);
        showToast('error', 'Erreur', 'Impossible d\'appliquer les solutions');
    } finally {
        hideLoading();
    }
}

/**
 * Applique une solution unique
 */
export async function appliquerSolutionUnique(conflitId, solutionType, solutionIndex) {
    const confirmation = confirm(
        'Êtes-vous sûr de vouloir appliquer cette solution ?\n\n' +
        'Cette action modifiera le planning et résoudra le conflit.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading('Application de la solution...');
        
        // Récupérer les données de la solution
        const card = document.querySelector(`[data-solution-id="solution-${conflitId}-${solutionIndex}"]`);
        const solutionData = card ? JSON.parse(card.dataset.solutionData) : {};
        
        const response = await fetch(`${API_BASE_URL}/admin/planning/resolution/appliquer-solution`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conflitId: conflitId,
                solutionType: solutionType,
                solutionData: solutionData
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showToast('success', 'Succès', 'Solution appliquée avec succès');
            
            // Fermer la modal
            document.getElementById('solutionsModal').classList.remove('active');
            
            // Recharger les conflits
            await loadConflitsFromAPI();
            updateUI();
        } else {
            throw new Error(result.message || 'Échec de l\'application');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'application de la solution:', error);
        showToast('error', 'Erreur', 'Impossible d\'appliquer la solution');
    } finally {
        hideLoading();
    }
}

/**
 * Résout tous les conflits par type
 */
export async function resoudreParType(type) {
    const confirmation = confirm(
        `Voulez-vous résoudre tous les conflits de type "${type}" ?\n\n` +
        'Cette action appliquera automatiquement les meilleures solutions disponibles.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading('Résolution automatique par type...');
        
        const response = await fetch(
            `${API_BASE_URL}/admin/planning/resolution/resoudre-tout/${DEFAULT_PLANNING_ID}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Afficher le résultat
        showToast('success', 'Résolution terminée', 
            `${result.nbResolus || 0} conflit(s) résolu(s)`);
        
        // Recharger les conflits
        await loadConflitsFromAPI();
        updateUI();
        
    } catch (error) {
        console.error('Erreur lors de la résolution par type:', error);
        showToast('error', 'Erreur', 'Impossible de résoudre les conflits');
    } finally {
        hideLoading();
    }
}

// ========================================================================
// FERMETURE DES MODALS
// ========================================================================

export function closeModal() {
    document.getElementById('conflitModal').classList.remove('active');
    setCurrentConflitId(null);
}

export function closeAllModals() {
    document.getElementById('conflitModal').classList.remove('active');
    document.getElementById('solutionsModal').classList.remove('active');
    document.getElementById('solutionAppliedModal')?.classList.remove('active');
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

// Gestion de la fermeture de la modal de résolution
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeResolutionModalBtn');
    const closeX = document.getElementById('closeResolutionModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('resolutionModal')?.classList.remove('active');
        });
    }
    
    if (closeX) {
        closeX.addEventListener('click', () => {
            document.getElementById('resolutionModal')?.classList.remove('active');
        });
    }
});