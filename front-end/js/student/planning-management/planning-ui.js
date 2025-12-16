import { fetchPlanning } from './planning-api.js';
import { getMondayOfCurrentWeek, formatDate, getFrenchDay, createCalendarEvent } from './planning-utils.js';

export async function initPlanningUI() {
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 100);
        });
    }

    let allSessions = [];
    let currentWeekStart = getMondayOfCurrentWeek(new Date());

    async function init() {
        allSessions = await fetchPlanning();
        updateWeekDisplay();
        displayCurrentWeekSessions();
        setupWeekNavigation();
        console.log('📅 Planning initialisé', allSessions);
    }

    function updateWeekDisplay() {
        const start = new Date(currentWeekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 4);

        const currentWeek = document.querySelector('.current-week h2');
        const weekDates = document.querySelector('.week-dates');

        if (currentWeek) currentWeek.textContent = `Semaine du ${formatDate(start)}`;
        if (weekDates) weekDates.textContent = `${formatDate(start)} - ${formatDate(end)}`;
    }

    function displayCurrentWeekSessions() {
        const grid = document.querySelector('.calendar-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekSessions = allSessions.filter(s => s.date && new Date(s.date) >= weekStart && new Date(s.date) <= weekEnd);

        // Colonne des heures
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        for (let hour = 8; hour <= 18; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeColumn.appendChild(timeSlot);
        }
        grid.appendChild(timeColumn);

        const days = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        days.forEach((day, index) => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.day = day;

            // Cellules vides
            for (let i = 0; i < 11; i++) {
                const timeCell = document.createElement('div');
                timeCell.className = 'time-cell';
                timeCell.dataset.time = `${8 + i}:00`;
                dayColumn.appendChild(timeCell);
            }

            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + index);

            weekSessions
                .filter(s => new Date(s.date).toDateString() === dayDate.toDateString())
                .forEach(s => dayColumn.appendChild(createCalendarEvent(s)));

            grid.appendChild(dayColumn);
        });

        updateDayHeaders();
    }

    function updateDayHeaders() {
        document.querySelectorAll('.day-header').forEach((header, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            header.innerHTML = `${getFrenchDay(d.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase())} ${d.getDate()} <span class="day-date">${d.toLocaleDateString('fr-FR', { month: 'short' })}</span>`;
        });
    }

    function setupWeekNavigation() {
        document.querySelector('.nav-btn:first-child')?.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeekDisplay();
            displayCurrentWeekSessions();
        });

        document.querySelector('.nav-btn:last-child')?.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeekDisplay();
            displayCurrentWeekSessions();
        });
    }

    init();
}
