// --------------------------
// Groupes
// --------------------------
export function displayGroups(groupes) {
    const container = document.getElementById('groupsContainer');
    if (!container) {
        console.warn('Container #groupsContainer introuvable');
        return;
    }

    container.innerHTML = '';

    if (!groupes || groupes.length === 0) {
        container.innerHTML = '<p class="no-data">Vous n\'avez aucun groupe pour le moment.</p>';
        return;
    }

    groupes.forEach(groupe => {
        const div = document.createElement('div');
        div.classList.add('group-card');
        div.innerHTML = `
            <div class="group-header">
                <h3 class="group-name">${groupe.nom}</h3>
                ${groupe.code ? `<span class="group-code">${groupe.code}</span>` : ''}
            </div>
            <p class="group-description">${groupe.description || 'Aucune description disponible'}</p>
            ${groupe.effectif ? `
            <div class="group-stats">
                <div class="group-stat">
                    <span class="stat-value">${groupe.effectif}</span>
                    <span class="stat-label">Membres</span>
                </div>
                ${groupe.effectifMax ? `
                <div class="group-stat">
                    <span class="stat-value">${groupe.effectifMax}</span>
                    <span class="stat-label">Places</span>
                </div>` : ''}
            </div>` : ''}
        `;
        container.appendChild(div);
    });
}