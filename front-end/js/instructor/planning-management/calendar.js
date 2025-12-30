import { 
    fetchFormateurProfile, 
    fetchDisponibilites, 
    fetchPlannings, 
    fetchSessions 
} from '../shared/api-utils.js';

import {
    JOURS,
    JOURS_FR,
    MOIS,
    TIME_SLOTS,
    normalizeTime,
    getDaysInMonth,
    getFirstDayOffset,
    isToday,
    showNotification,
    getStatusClass
} from '../shared/ui-helpers.js';

import { updateUserUI } from '../../shared/config.js';


let disponibilites = [];
let formateurId = null;
let plannings = [];
let sessions = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const formateur = await fetchFormateurProfile();
        formateurId = formateur.id;
        updateUserUI(formateur);

        [disponibilites, plannings, sessions] = await Promise.all([
            fetchDisponibilites(formateurId),
            fetchPlannings(),
            fetchSessions(formateurId)
        ]);

        renderAvailabilityCalendar();
        initCalendarNavigation();
        renderCalendarSessions();
    } catch (e) {
        console.error(e);
        showNotification('Erreur lors du chargement', 'error');
    }
});

function initCalendarNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
    if (todayBtn) todayBtn.addEventListener('click', () => {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        updateCalendarDisplay();
        renderCalendarSessions();
    });

    updateCalendarDisplay();
}

function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth < 0) { 
        currentMonth = 11; 
        currentYear--; 
    }
    if (currentMonth > 11) { 
        currentMonth = 0; 
        currentYear++; 
    }
    updateCalendarDisplay();
    renderCalendarSessions();
}

function updateCalendarDisplay() {
    const header = document.getElementById('calendarMonthYear');
    if (header) {
        header.textContent = `${MOIS[currentMonth]} ${currentYear}`;
    }
}

function renderAvailabilityCalendar() {
    const container = document.querySelector('.week-view');
    if (!container) return;
    container.innerHTML = '';

    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    JOURS_FR.forEach(j => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = j;
        weekHeader.appendChild(dayHeader);
    });
    container.appendChild(weekHeader);

    const weekSlots = document.createElement('div');
    weekSlots.className = 'week-slots';

    JOURS.forEach(jour => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';

        TIME_SLOTS.forEach(slot => {
            const dispo = disponibilites.find(d => 
                d.jourSemaine === jour && 
                d.estDisponible &&
                slot.start >= normalizeTime(d.heureDebut) && 
                slot.end <= normalizeTime(d.heureFin)
            );

            const cell = document.createElement('div');
            cell.className = 'time-slot ' + (dispo ? 'available' : 'unavailable');
            cell.textContent = `${slot.start} - ${slot.end}`;
            dayColumn.appendChild(cell);
        });

        weekSlots.appendChild(dayColumn);
    });

    container.appendChild(weekSlots);
}


function renderCalendarSessions() {
    const calendarDays = document.querySelector('.calendar-days');
    if (!calendarDays) {
        console.error('Element .calendar-days non trouvé');
        return;
    }

    const calendarView = document.getElementById('calendarView');
    if (calendarView) {
        calendarView.classList.add('active');
    }

    calendarDays.innerHTML = '';

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startOffset = getFirstDayOffset(currentYear, currentMonth);
    
    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty other-month';
        calendarDays.appendChild(emptyCell);
    }


    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth, day);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        if (isToday(currentDate)) {
            dayCell.classList.add('today');
        }
        
        dayCell.innerHTML = `<span class="day-number">${day}</span>`;


        const daySessions = sessions.filter(s => {
            if (!s.planningSemaine) return false;

            try {
                const sessionDate = new Date(s.planningSemaine);
                return sessionDate.getDate() === day &&
                       sessionDate.getMonth() === currentMonth &&
                       sessionDate.getFullYear() === currentYear;
            } catch (e) {
                console.error('Erreur parsing date session:', s, e);
                return false;
            }
        });

        daySessions.forEach(s => {
            if (!s.creneauxHoraires || !Array.isArray(s.creneauxHoraires)) return;
            
            s.creneauxHoraires.forEach(horaire => {
                try {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = 'calendar-event';
                    eventDiv.dataset.status = getStatusClass(s.statut);
                    
                    eventDiv.innerHTML = `
                        <div class="event-time">${horaire}</div>
                        <div class="event-title">${s.nomCours || 'Sans titre'}</div>
                        <div class="event-group">${s.groupeNom || 'Groupe ' + (s.groupeId || 'N/A')}</div>
                    `;
                    dayCell.appendChild(eventDiv);
                } catch (e) {
                    console.error('Erreur affichage session:', s, e);
                }
            });
        });

        calendarDays.appendChild(dayCell);
    }
}