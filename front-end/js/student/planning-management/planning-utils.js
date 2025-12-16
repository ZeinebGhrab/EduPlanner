// Retourne le lundi de la semaine d'une date donnée
export function getMondayOfCurrentWeek(date) {
    const currentDate = new Date(date);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // ajustement dimanche
    return new Date(currentDate.setDate(diff));
}

// Formate une date en texte lisible
export function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Retourne le jour en français
export function getFrenchDay(day) {
    const days = {
        'MONDAY': 'LUNDI',
        'TUESDAY': 'MARDI',
        'WEDNESDAY': 'MERCREDI',
        'THURSDAY': 'JEUDI',
        'FRIDAY': 'VENDREDI',
        'SATURDAY': 'SAMEDI',
        'SUNDAY': 'DIMANCHE'
    };
    return days[day] || day;
}

// Formate une heure "HH:MM:SS" en "HH:MM"
export function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5);
}

// Crée un élément événement pour le calendrier
export function createCalendarEvent(session) {
    const timeStart = formatTime(session.heureDebut);
    const timeEnd = formatTime(session.heureFin);

    const eventDiv = document.createElement('div');
    eventDiv.className = 'calendar-event';
    eventDiv.dataset.time = `${timeStart}-${timeEnd}`;

    // Calcul position
    const startHour = parseInt(timeStart.split(':')[0]);
    const startMinutes = parseInt(timeStart.split(':')[1]) || 0;
    const endHour = parseInt(timeEnd.split(':')[0]);
    const endMinutes = parseInt(timeEnd.split(':')[1]) || 0;

    const startInMinutes = (startHour - 8) * 60 + startMinutes;
    const endInMinutes = (endHour - 8) * 60 + endMinutes;
    const durationInMinutes = endInMinutes - startInMinutes;

    const topPercent = (startInMinutes / (11 * 60)) * 100;
    const heightPercent = (durationInMinutes / (11 * 60)) * 100;

    // Styles
    eventDiv.style.position = 'absolute';
    eventDiv.style.top = `${topPercent}%`;
    eventDiv.style.height = `${heightPercent}%`;
    eventDiv.style.width = 'calc(100% - 8px)';
    eventDiv.style.left = '4px';
    eventDiv.style.zIndex = '2';

    const colors = {
        'React Avancé': 'linear-gradient(135deg, #0099CC 0%, #00B8E6 50%, #33C9EE 100%)',
        'Projet Pratique': 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
        'UX Design': 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #C4B5FD 100%)',
        'JavaScript ES6+': 'linear-gradient(135deg, #EA580C 0%, #FF6B35 50%, #FF8C61 100%)',
        'Base de Données': 'linear-gradient(135deg, #DB2777 0%, #FF1B6B 50%, #FF6B9D 100%)',
        'API REST': 'linear-gradient(135deg, #D97706 0%, #FFB800 50%, #FFC533 100%)',
        'Revue de Code': 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)'
    };

    eventDiv.style.background = colors[session.titre] ||
        'linear-gradient(135deg, #0099CC 0%, #00B8E6 50%, #33C9EE 100%)';

    eventDiv.innerHTML = `
        <div class="event-content">
            <h4>${session.titre}</h4>
            <p>${session.nomFormateur}</p>
            <small>${timeStart} - ${timeEnd}</small>
        </div>
    `;

    return eventDiv;
}
