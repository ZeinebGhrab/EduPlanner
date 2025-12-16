export function displayUpcomingSessions(planning) {
    const container = document.querySelector('.schedule-section .schedule-cards');
    if (!container) {
        console.warn('Container .schedule-cards introuvable');
        return;
    }

    container.innerHTML = '';

    if (!planning || planning.length === 0) {
        container.innerHTML = '<p class="no-sessions">Aucune session disponible.</p>';
        return;
    }

    // Filtrer et trier les sessions futures
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const futureSessions = planning
        .filter(item => item.date >= today)
        .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.heureDebut}`);
            const dateB = new Date(`${b.date}T${b.heureDebut}`);
            return dateA - dateB;
        })
        .slice(0, 3);

    console.log(`Prochaines sessions: ${futureSessions.length}/${planning.length}`);

    if (futureSessions.length === 0) {
        container.innerHTML = '<p class="no-sessions">Aucune session à venir.</p>';
        return;
    }

    futureSessions.forEach(item => {
        const card = createPlanningCard(item);
        container.appendChild(card);
    });
}

// --------------------------
// Création d'une carte de planning
// --------------------------
function createPlanningCard(item) {
    if (!item.heureDebut || !item.heureFin) {
        console.warn('Session sans heures:', item);
        return document.createElement('div');
    }

    const [hDebut, mDebut, sDebut] = item.heureDebut.split(':').map(Number);
    const [hFin, mFin, sFin] = item.heureFin.split(':').map(Number);
    const dureeHeures = Math.round((hFin + mFin/60 - (hDebut + mDebut/60))*10)/10;

    const now = new Date();
    const startDate = new Date(`${item.date}T${item.heureDebut}`);
    const endDate = new Date(`${item.date}T${item.heureFin}`);
    let statusClass = 'status-upcoming';
    let statusText = 'À venir';

    if (now >= startDate && now <= endDate) {
        statusClass = 'status-ongoing';
        statusText = 'En cours';
    } else if (now > endDate) {
        statusClass = 'status-completed';
        statusText = 'Terminé';
    }

    const sessionDate = new Date(item.date);
    const dateFormatted = sessionDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long'
    });

    const card = document.createElement('div');
    card.classList.add('schedule-card');
    card.innerHTML = `
        <div class="session-time">
            <div class="session-date">${dateFormatted}</div>
            <div>
                <span class="time">${hDebut.toString().padStart(2,'0')}:${mDebut.toString().padStart(2,'0')} - ${hFin.toString().padStart(2,'0')}:${mFin.toString().padStart(2,'0')}</span>
                <span class="duration">${dureeHeures}h</span>
            </div>
        </div>
        <div class="session-details">
            <h4>${item.titre || 'Session'}</h4>
            <div class="session-info">
                <i class="fas fa-user"></i>
                <span>${item.nomFormateur || 'Non assigné'}</span>
            </div>
            <div class="session-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>${item.nomSalle || 'À définir'}</span>
            </div>
            <div class="session-info">
                <i class="fas fa-users"></i>
                <span>${item.nomGroupe || 'Groupe'}</span>
            </div>
        </div>
        <div class="session-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
    `;
    
    return card;
}