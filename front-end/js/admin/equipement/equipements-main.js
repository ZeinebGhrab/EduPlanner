function setupEventListeners() {
    const addBtn = document.getElementById('addEquipement');
    if (addBtn) addBtn.addEventListener('click', openAddModal);

    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    [closeModalBtn, cancelBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeModal);
    });
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    [closeDeleteBtn, cancelDeleteBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closeDeleteModal);
    });

    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            applyFilters();
        });
    }
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
    const form = document.getElementById('equipementForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
}
async function loadEquipements() {
    try {
        console.log(' Chargement des équipements...');
        const data = await fetchEquipements();
        updateUI(data);
        const mainContent = document.getElementById('mainContent');
        const loadingState = document.getElementById('loadingState');
        if (mainContent && loadingState) {
            loadingState.style.display = 'none';
            mainContent.style.display = 'block';
        }
    } catch (error) {
        console.error('Erreur chargement équipements :', error);
        alert('Impossible de charger les équipements. Vérifiez la console.');
    }
}
function initApp() {
    console.log('Initialisation équipements');
    if (typeof checkAuth === 'function') checkAuth();
    if (typeof initializeDecorations === 'function') initializeDecorations();
    setupEventListeners();
    loadEquipements();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

initApp();
