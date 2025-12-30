document.addEventListener('DOMContentLoaded', function () {
    console.log('Page salles chargée');
    initializeDecorations();
    setupEventListeners();
    fetchSalles();
    setTimeout(() => {
        console.log('URL API Salles:', API_SALLES);
        console.log('Test de connexion...');

        fetch(API_SALLES)
            .then(response => {
                console.log('Statut de connexion:', response.status);
                if (!response.ok) {
                    console.warn('Attention: L\'API ne répond pas correctement');
                    showToast('warning', 'Connexion API', 'Vérifiez que le backend est démarré sur le port 8081');
                }
            })
            .catch(error => {
                console.error('Impossible de se connecter à l\'API:', error.message);
                showToast('error', 'Erreur API', `Impossible de se connecter: ${error.message}`);
            });
    }, 1000);
});

function setupEventListeners() {

    const addBtn = document.getElementById('addSalle');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
                closeDeleteModal();
            }
        });
    });
    const salleForm = document.getElementById('salleForm');
    if (salleForm) {
        salleForm.addEventListener('submit', handleFormSubmit);
    }
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            applyFilters();
        });
    }
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(-1));
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(1));
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
        }
    });
}
function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    if (!bgShapes) return;

    const decorations = `
        <!-- Diamond -->
        <div class="deco-diamond"></div>
        
        <!-- Circles -->
        <div class="deco-circle"></div>
        <div class="deco-circle-2"></div>
        <div class="deco-circle-3"></div>
        
        <!-- Plus signs -->
        <div class="deco-plus"></div>
        <div class="deco-plus-2"></div>
        <div class="deco-plus-3"></div>
        
        <!-- Grid patterns -->
        <div class="grid-pattern"></div>
        <div class="grid-pattern-2"></div>
        
        <!-- Lines -->
        <div class="line-deco line-deco-1"></div>
        <div class="line-deco line-deco-2"></div>
        <div class="line-deco line-deco-3"></div>
        <div class="line-deco line-deco-4"></div>
    `;

    bgShapes.innerHTML += decorations;
}
function goToPage(page) {
    currentPage = page;
    renderSalles();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.goToPage = goToPage;