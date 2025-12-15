// Script pour les interactions UI du planning
document.addEventListener('DOMContentLoaded', function () {
    // Header scroll effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Variables globales
    let allSessions = [];
    let currentWeekStart = getMondayOfCurrentWeek(new Date());

    // Initialisation
    async function init() {
        // Charger toutes les sessions
        allSessions = await fetchPlanning();

        // Afficher la semaine actuelle
        updateWeekDisplay();
        displayCurrentWeekSessions();

        // Configurer la navigation
        setupWeekNavigation();
    }

    // Fonction pour obtenir le lundi de la semaine d'une date
    function getMondayOfCurrentWeek(date) {
        const currentDate = new Date(date);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Ajuster quand dimanche
        return new Date(currentDate.setDate(diff));
    }

    // Fonction pour mettre à jour l'affichage de la semaine
    function updateWeekDisplay() {
        const startOfWeek = new Date(currentWeekStart);
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(endOfWeek.getDate() + 4); // Lundi à Vendredi

        const currentWeek = document.querySelector('.current-week h2');
        const weekDates = document.querySelector('.week-dates');

        if (currentWeek) {
            currentWeek.textContent = `Semaine du ${formatDate(startOfWeek)}`;
        }

        if (weekDates) {
            weekDates.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
        }
    }

    // Fonction pour formater une date
    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Fonction pour afficher les sessions de la semaine actuelle
    function displayCurrentWeekSessions() {
        if (allSessions.length === 0) return;

        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;

        // Calculer les dates de début et fin de la semaine
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Samedi

        // Filtrer les sessions de la semaine actuelle
        const weekSessions = allSessions.filter(session => {
            if (!session.date) return false;
            const sessionDate = new Date(session.date);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
        });

        // Vider et reconstruire le calendrier
        calendarGrid.innerHTML = '';

        // Colonne des heures
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        for (let hour = 8; hour <= 18; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeColumn.appendChild(timeSlot);
        }
        calendarGrid.appendChild(timeColumn);

        // Colonnes des jours (Lundi à Vendredi)
        const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];

        days.forEach((day, dayIndex) => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.day = day;

            // Calculer la date pour ce jour
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + dayIndex);

            // Cellules vides pour chaque créneau horaire
            for (let i = 0; i < 11; i++) {
                const timeCell = document.createElement('div');
                timeCell.className = 'time-cell';
                timeCell.dataset.time = `${8 + i}:00`;
                dayColumn.appendChild(timeCell);
            }

            // Filtrer les sessions pour ce jour précis
            const daySessions = weekSessions.filter(session => {
                if (!session.date) return false;
                const sessionDate = new Date(session.date);
                return sessionDate.toDateString() === dayDate.toDateString();
            });

            // Ajouter les événements
            daySessions.forEach(session => {
                const eventElement = createCalendarEvent(session, dayIndex + 1);
                dayColumn.appendChild(eventElement);
            });

            calendarGrid.appendChild(dayColumn);
        });

        // Mettre à jour les en-têtes de jours avec les dates réelles
        updateDayHeaders();
    }

    // Fonction pour mettre à jour les en-têtes de jours
    function updateDayHeaders() {
        const dayHeaders = document.querySelectorAll('.day-header');

        dayHeaders.forEach((header, index) => {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + index);

            const dayName = getFrenchDay(dayDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase());
            const dayNumber = dayDate.getDate();
            const month = dayDate.toLocaleDateString('fr-FR', { month: 'short' });

            header.innerHTML = `
                ${dayName} ${dayNumber}
                <span class="day-date">${dayNumber} ${month}</span>
            `;
        });
    }

    // Fonction pour obtenir le jour en français (simplifiée)
    function getFrenchDay(day) {
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

    // Fonction pour créer un événement calendrier
    function createCalendarEvent(session, gridColumn) {
        const timeStart = formatTime(session.heureDebut);
        const timeEnd = formatTime(session.heureFin);

        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        eventDiv.dataset.time = `${timeStart}-${timeEnd}`;

        // Calcul de la position
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

        // Couleur selon le titre
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

    // Fonction pour formater l'heure
    function formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    }

    // Fonction pour configurer la navigation entre semaines
    function setupWeekNavigation() {
        const prevBtn = document.querySelector('.nav-btn:first-child');
        const nextBtn = document.querySelector('.nav-btn:last-child');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentWeekStart.setDate(currentWeekStart.getDate() - 7);
                updateWeekDisplay();
                displayCurrentWeekSessions();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                updateWeekDisplay();
                displayCurrentWeekSessions();
            });
        }
    }

    // Démarrer l'application
    init();

    console.log('UI Planning chargé avec succès!');
});