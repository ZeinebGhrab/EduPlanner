import { viewConflitDetails, showSolutions, openDeleteModal, closeAllModals, toggleSolutionSelection, applySelectedSolutions, closeModal, closeDeleteModal, closeDeleteAllModal, closeSolutionsModal, confirmDelete } from './modal.js';
import { deleteAllConflits, loadConflitsFromAPI, confirmDeleteAll } from './api.js';
import { resetFilters, changePage, hideLoading, showToast, showEmptyState, debounce, renderConflitsTable, showLoading, updateUI } from './ui.js';
import { setCurrentPage } from './state.js';
import { 
    selectAllSolutions, 
    deselectAllSolutions, 
    toggleSolutionCard,
    appliquerSolutionUnique,
    resoudreParType
} from './modal.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Initialisation de la gestion des conflits...');
    initializeApp();
});

async function initializeApp() {
    try {
        setupEventListeners();

        showLoading('Chargement des conflits depuis la base de données...');
        await loadConflitsFromAPI();

        updateUI();
        console.log('Application initialisée avec succès');

    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showToast('error', 'Erreur de connexion', 'Impossible de se connecter au serveur. Vérifiez que Spring Boot est démarré.');
        showEmptyState('Erreur de connexion au serveur');

    } finally {
        hideLoading();
    }
}

function setupEventListeners() {
    // Filtres
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const filterSeverite = document.getElementById('filterSeverite');

    if (searchInput) searchInput.addEventListener('input', debounce(renderConflitsTable, 300));
    if (filterType) filterType.addEventListener('change', renderConflitsTable);
    if (filterSeverite) filterSeverite.addEventListener('change', renderConflitsTable);

    // Modals
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
    document.getElementById('closeDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('closeDeleteAllModal')?.addEventListener('click', closeDeleteAllModal);
    document.getElementById('cancelDeleteAll')?.addEventListener('click', closeDeleteAllModal);

    document.getElementById('closeSolutionsModal')?.addEventListener('click', closeSolutionsModal);
    document.getElementById('cancelSolutionsBtn')?.addEventListener('click', closeSolutionsModal);
    document.getElementById('closeSolutionAppliedModal')?.addEventListener('click', closeAllModals);
    document.getElementById('closeAllModalsBtn')?.addEventListener('click', closeAllModals);

    document.getElementById('openSolutionsBtn')?.addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
            // Récupérer l'ID du conflit actuel depuis le modal
            const conflitIdElement = document.getElementById('modalConflitId');
            if (conflitIdElement) {
                const conflitId = parseInt(conflitIdElement.textContent);
                showSolutions(conflitId);
            }
        }, 300);
    });

    document.getElementById('applyCustomSolutionBtn')?.addEventListener('click', () => {
        const customText = document.getElementById('customSolutionText')?.value;
        const notes = document.getElementById('solutionNotes')?.value;
        
        if (!customText || customText.trim() === '') {
            showToast('warning', 'Attention', 'Veuillez décrire votre solution personnalisée');
            return;
        }
        
        console.log('Solution personnalisée appliquée:', { customText, notes });
        
        document.getElementById('solutionsModal').classList.remove('active');
        document.getElementById('solutionAppliedModal').classList.add('active');
        
        const messageElement = document.getElementById('appliedSolutionMessage');
        if (messageElement) {
            messageElement.textContent = 'Votre solution personnalisée a été enregistrée avec succès.';
        }
    });

    // Confirmation de suppression
    document.getElementById('confirmDelete')?.addEventListener('click', confirmDelete);
    document.getElementById('confirmDeleteAll')?.addEventListener('click', confirmDeleteAll);

    // Gestion de la touche Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Fermeture des modals en cliquant sur l'overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
}

async function refreshConflits() {
    try {
        showLoading('Actualisation des conflits depuis la base de données...');
        await loadConflitsFromAPI();
        setCurrentPage(1);
        updateUI();
        showToast('success', 'Actualisation', 'Conflits actualisés depuis la base de données');
    } catch (error) {
        console.error('Erreur lors de l\'actualisation:', error);
        showToast('error', 'Erreur', 'Impossible d\'actualiser les conflits');
    } finally {
        hideLoading();
    }
}

// Exposer les fonctions au scope global pour les appels depuis HTML onclick
window.viewConflitDetails = viewConflitDetails;
window.showSolutions = showSolutions;
window.refreshConflits = refreshConflits;
window.deleteAllConflits = deleteAllConflits;
window.openDeleteModal = openDeleteModal;
window.resetFilters = resetFilters;
window.changePage = changePage;
window.toggleSolutionSelection = toggleSolutionSelection;
window.applySelectedSolutions = applySelectedSolutions;


// Fonctions de sélection multiple (nouvelles)
window.selectAllSolutions = selectAllSolutions;
window.deselectAllSolutions = deselectAllSolutions;
window.applySelectedSolutions = applySelectedSolutions;
window.toggleSolutionCard = toggleSolutionCard;
window.appliquerSolutionUnique = appliquerSolutionUnique;
window.resoudreParType = resoudreParType;