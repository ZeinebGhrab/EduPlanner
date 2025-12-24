// resolution.js - Gestion de la résolution automatique et manuelle des conflits

import { showLoading, hideLoading, showToast, updateUI } from './ui.js';
import { loadConflitsFromAPI } from './api.js';
import { API_BASE_URL } from '../../shared/config.js';

// ID du planning (à récupérer dynamiquement si nécessaire)
const DEFAULT_PLANNING_ID = 1;

/**
 * Résout automatiquement tous les conflits d'un planning
 */
export async function resoudreTousConflits() {
    try {
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
        
        // Afficher le résultat dans une modal
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
}

/**
 * Affiche le résultat de la résolution automatique dans une modal
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

/**
 * Charge les solutions détaillées pour un conflit depuis le back-end
 */
export async function chargerSolutionsDetaillees(conflitId) {
    try {
        showLoading('Chargement des solutions...');
        
        const response = await fetch(
            `${API_BASE_URL}/admin/planning/resolution/analyse/${DEFAULT_PLANNING_ID}`,
            {
                method: 'GET',
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
        
        // Trouver le conflit spécifique
        const conflitData = result.conflits.find(c => c.id === conflitId);
        
        if (!conflitData || !conflitData.solutions) {
            showToast('warning', 'Attention', 'Aucune solution disponible pour ce conflit');
            return [];
        }
        
        return conflitData.solutions;
        
    } catch (error) {
        console.error('Erreur lors du chargement des solutions:', error);
        showToast('error', 'Erreur', 'Impossible de charger les solutions');
        return [];
    } finally {
        hideLoading();
    }
}

/**
 * Applique une solution spécifique à un conflit
 */
export async function appliquerSolutionSpecifique(solutionData) {
    try {
        showLoading('Application de la solution...');
        
        // Appeler l'endpoint approprié selon le type de solution
        const response = await fetch(
            `${API_BASE_URL}/admin/planning/resolution/appliquer-solution`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solutionData)
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showToast('success', 'Succès', 'Solution appliquée avec succès');
            
            // Fermer la modal des solutions
            document.getElementById('solutionsModal').classList.remove('active');
            
            // Recharger les conflits
            await loadConflitsFromAPI();
            updateUI();
            
            return true;
        } else {
            showToast('error', 'Erreur', result.message || 'Impossible d\'appliquer la solution');
            return false;
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'application de la solution:', error);
        showToast('error', 'Erreur', 'Impossible d\'appliquer la solution');
        return false;
    } finally {
        hideLoading();
    }
}

/**
 * Affiche les solutions détaillées dans la modal
 */
export function afficherSolutionsDetaillees(solutions, conflitId) {
    const solutionsGrid = document.getElementById('solutionsGrid');
    
    if (!solutions || solutions.length === 0) {
        solutionsGrid.innerHTML = `
            <div class="no-solutions">
                <i class="fas fa-info-circle"></i>
                <h3>Aucune solution disponible</h3>
                <p>Ce conflit ne peut pas être résolu automatiquement. Veuillez le corriger manuellement.</p>
            </div>
        `;
        return;
    }
    
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
        const applicableClass = isApplicable ? 'applicable' : 'not-applicable';
        
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
                    onclick="appliquerSolution('${solution.id}', '${solution.type}', ${conflitId})"
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
    
    // Limiter à 5 options maximum pour ne pas surcharger l'affichage
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
                optionText = `${option.jour} ${option.heureDebut} - ${option.heureFin}`;
                break;
            default:
                optionText = option.nom || option.label || JSON.stringify(option);
        }
        
        return `<li><i class="fas fa-check-circle"></i> ${optionText}</li>`;
    }).join('') + (options.length > 5 ? `<li><i>... et ${options.length - 5} autre(s)</i></li>` : '');
}

/**
 * Gère l'application d'une solution (appelée par onclick)
 */
window.appliquerSolution = async function(solutionId, solutionType, conflitId) {
    const confirmation = confirm(
        'Êtes-vous sûr de vouloir appliquer cette solution ?\n\n' +
        'Cette action modifiera le planning et résoudra le conflit.'
    );
    
    if (!confirmation) return;
    
    const solutionData = {
        conflitId: conflitId,
        solutionId: solutionId,
        type: solutionType
    };
    
    await appliquerSolutionSpecifique(solutionData);
};

/**
 * Fonction globale pour résoudre tous les conflits
 */
window.resoudreTousConflits = resoudreTousConflits;

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