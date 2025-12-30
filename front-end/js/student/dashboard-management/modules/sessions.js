
export function displayNextSessions(sessions) {
    const container = document.querySelector('.next-sessions-section .sessions-container');
    if (!container) {
        console.warn('Container .sessions-container introuvable');
        return;
    }

    container.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p class="no-sessions">Vous n\'avez aucune session à venir.</p>';
        return;
    }

    sessions.forEach(session => {
        if (!session.creneaux || session.creneaux.length === 0) {
            console.warn('Session sans créneau:', session);
            return;
        }

        const creneau = session.creneaux[0];
        
        const heureDebut = creneau.heureDebut || creneau.dateDebut;
        const heureFin = creneau.heureFin || creneau.dateFin;
        
        if (!heureDebut || !heureFin) {
            console.warn('Créneau sans heures:', creneau);
            return;
        }

        const card = createSessionCard(session, creneau, heureDebut, heureFin);
        container.appendChild(card);
    });
}


function createSessionCard(session, creneau, heureDebut, heureFin) {
    const [hDebut, mDebut] = heureDebut.split(':').map(Number);
    const [hFin, mFin] = heureFin.split(':').map(Number);
    const dureeHeures = Math.round((hFin + mFin/60 - (hDebut + mDebut/60))*10)/10;

    const sessionDate = new Date(creneau.date);
    const dateFormatted = sessionDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });

    const card = document.createElement('div');
    card.classList.add('session-card-compact');
    card.innerHTML = `
        <div class="session-time-header">
            <div class="session-date">${dateFormatted}</div>
            <div class="session-hours">${hDebut.toString().padStart(2,'0')}:${mDebut.toString().padStart(2,'0')} - ${hFin.toString().padStart(2,'0')}:${mFin.toString().padStart(2,'0')}</div>
        </div>
        <h4 class="session-title">${session.nom || session.titre || 'Session'}</h4>
        <div class="session-details-compact">
            <div class="session-detail-item">
                <i class="fas fa-user"></i>
                <span>${session.formateurNom || session.nomFormateur || 'Non assigné'}</span>
            </div>
            <div class="session-detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${session.salleNom || session.nomSalle || 'À définir'}</span>
            </div>
        </div>
        <div class="session-tags-compact">
            <span class="tag-compact tag-theory">Théorie</span>
        </div>
    `;
    
    return card;
}