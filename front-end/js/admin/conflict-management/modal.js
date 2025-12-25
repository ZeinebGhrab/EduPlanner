import { conflits, currentConflitId, setCurrentConflitId, getConflitById } from './state.js';
import { showToast, updateUI, showLoading, hideLoading } from './ui.js';
import { deleteConflit, loadConflitsFromAPI } from './api.js';
import { SOLUTIONS_TEMPLATES } from './config.js';
import { API_BASE_URL } from '../../shared/config.js';

const DEFAULT_PLANNING_ID = 1;

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
 * Affiche les solutions détaillées dans la modal
 */
function afficherSolutionsDetaillees(solutions, conflitId) {
    const solutionsGrid = document.getElementById('solutionsGrid');
    
    solutionsGrid.innerHTML = '';
    
    solutions.forEach((solution, index) => {
        const solutionCard = document.createElement('div');
        solutionCard.className = 'solution-card-enhanced';
        
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
                    onclick="appliquerSolution(${conflitId}, '${solution.type}', ${JSON.stringify(solution.data).replace(/"/g, '&quot;')})"
                    ${!isApplicable ? 'disabled' : ''}
                >
                    <i class="fas ${isApplicable ? 'fa-check' : 'fa-ban'}"></i>
                    ${isApplicable ? 'Appliquer cette solution' : 'Non applicable'}
                </button>
            </div>
        `;
        
        solutionsGrid.appendChild(solutionCard);
    });
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

/**
 * Applique une solution spécifique
 */
window.appliquerSolution = async function(conflitId, solutionType, solutionData) {
    const confirmation = confirm(
        'Êtes-vous sûr de vouloir appliquer cette solution ?\n\n' +
        'Cette action modifiera le planning et résoudra le conflit.'
    );
    
    if (!confirmation) return;
    
    try {
        showLoading('Application de la solution...');
        
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
};

/**
 * Résout automatiquement tous les conflits
 */
window.resoudreTousConflits = async function() {
    try {
        const confirmation = confirm(
            '⚠️ Résolution automatique de tous les conflits\n\n' +
            'Cette action va :\n' +
            '- Analyser tous les conflits du planning\n' +
            '- Appliquer automatiquement les meilleures solutions\n' +
            '- Modifier les sessions, créneaux, salles et formateurs\n\n' +
            'Voulez-vous continuer ?'
        );
        
        if (!confirmation) return;
        
        showLoading('Résolution automatique en cours...');
        
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
        afficherResultatResolution(result);
        
        // Recharger les conflits
        await loadConflitsFromAPI();
        updateUI();
        
    } catch (error) {
        console.error('Erreur lors de la résolution automatique:', error);
        showToast('error', 'Erreur', 'Impossible de résoudre les conflits automatiquement');
    } finally {
        hideLoading();
    }
};

/**
 * Affiche le résultat de la résolution automatique
 */
function afficherResultatResolution(result) {
    const modal = document.getElementById('resolutionModal');
    const content = document.getElementById('resolutionContent');
    
    if (!result.success) {
        content.innerHTML = `
            <div class="resolution-error">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c;"></i>
                <h3>Échec de la résolution</h3>
                <p>${result.message || 'Une erreur est survenue'}</p>
            </div>
        `;
        modal.classList.add('active');
        return;
    }
    
    const { nbConflitsInitial, nbResolus, nbEchecs, tauxReussite, duree, actions } = result;
    
    let html = `
        <div class="resolution-success">
            <div class="resolution-summary">
                <div class="summary-card">
                    <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                    <div>
                        <h3>${nbResolus}</h3>
                        <p>Conflits résolus</p>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-times-circle" style="color: #e74c3c;"></i>
                    <div>
                        <h3>${nbEchecs}</h3>
                        <p>Échecs</p>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-percentage" style="color: #3498db;"></i>
                    <div>
                        <h3>${tauxReussite}</h3>
                        <p>Taux de réussite</p>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-clock" style="color: #f39c12;"></i>
                    <div>
                        <h3>${duree}ms</h3>
                        <p>Durée</p>
                    </div>
                </div>
            </div>
            
            <div class="resolution-details">
                <h3><i class="fas fa-list"></i> Détails des actions</h3>
                <div class="actions-list">
    `;
    
    if (actions && actions.length > 0) {
        actions.forEach(action => {
            const icon = action.statut.includes('✅') ? 'fa-check-circle' : 'fa-times-circle';
            const color = action.statut.includes('✅') ? '#27ae60' : '#e74c3c';
            
            html += `
                <div class="action-item">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <div class="action-content">
                        <h4>Conflit #${action.conflitId} - ${action.type}</h4>
                        <p>${action.description}</p>
                        ${action.solution ? `<span class="solution-badge">Solution: ${action.solution}</span>` : ''}
                        ${action.erreur ? `<span class="error-badge">Erreur: ${action.erreur}</span>` : ''}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p style="text-align: center; padding: 20px;">Aucune action effectuée</p>';
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    modal.classList.add('active');
}

// Fonctions de fermeture des modals
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
            document.getElementById('resolutionModal').classList.remove('active');
        });
    }
    
    if (closeX) {
        closeX.addEventListener('click', () => {
            document.getElementById('resolutionModal').classList.remove('active');
        });
    }
});

export function toggleSolutionSelection() {}
export function applySelectedSolutions() {}