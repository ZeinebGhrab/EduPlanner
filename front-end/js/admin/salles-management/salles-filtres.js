function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        applyFilters();
        return;
    }

    filteredSalles = salles.filter(salle => {
        return salle.nom.toLowerCase().includes(searchTerm) ||
            salle.type.toLowerCase().includes(searchTerm) ||
            salle.batiment.toLowerCase().includes(searchTerm);
    });

    currentPage = 1;
    renderSalles();
    updatePagination();
}
function applyFilters() {
    let filtered = [...salles];
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'nom':
                return a.nom.localeCompare(b.nom);
            case 'capacite':
                return b.capacite - a.capacite;
            case 'type':
                return a.type.localeCompare(b.type);
            default:
                return 0;
        }
    });

    filteredSalles = filtered;
    renderSalles();
    updatePagination();
}