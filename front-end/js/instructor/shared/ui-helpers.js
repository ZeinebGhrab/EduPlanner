// CONSTANTES
export const JOURS_MAP = {
    1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI',
    5: 'VENDREDI', 6: 'SAMEDI', 7: 'DIMANCHE'
};

export const JOURS_REVERSE_MAP = {
    'LUNDI': 1, 'MARDI': 2, 'MERCREDI': 3, 'JEUDI': 4,
    'VENDREDI': 5, 'SAMEDI': 6, 'DIMANCHE': 7
};

export const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const JOURS_COMPLETS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

export const MOIS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MOIS_COURTS = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const TIME_SLOTS = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' }
];

// DATE & TIME UTILS
export function normalizeTime(time) {
    return time ? time.substring(0, 5) : '';
}

export function formatTimeWithSeconds(time) {
    return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
}

export function getDayName(date) {
    return JOURS_FR[date.getDay()];
}

export function getMonthName(date) {
    return MOIS_COURTS[date.getMonth()];
}

export function getMonthIndex(name) {
    return MOIS.indexOf(name);
}

export function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

export function getTodayISO() {
    return formatDateISO(new Date());
}

// STATUS UTILS
export function getStatusClass(statut) {
    if (!statut) return 'planned';
    const normalized = statut.normalize('NFD').toLowerCase();
    const map = {
        'a_venir': 'upcoming', 'en_cours': 'ongoing', 'termine': 'completed',
        'planifie': 'planned', 'annule': 'cancelled', 'planifiee': 'planned', 'terminee': 'completed'
    };
    return map[normalized] || 'planned';
}

export function getStatusIcon(statut) {
    if (!statut) return 'fas fa-calendar';
    const normalized = statut.normalize('NFD').toLowerCase();
    const map = {
        'a_venir': 'fas fa-clock', 'en_cours': 'fas fa-play-circle',
        'termine': 'fas fa-check-circle', 'planifie': 'fas fa-calendar', 'annule': 'fas fa-times-circle'
    };
    return map[normalized] || 'fas fa-calendar';
}

export function getStatusLabel(statut) {
    if (!statut) return 'Planifié';
    const normalized = statut.normalize('NFD').toLowerCase();
    const map = {
        'a_venir': 'À venir', 'en_cours': 'En cours', 'termine': 'Terminé',
        'planifie': 'Planifié', 'annule': 'Annulé', 'planifiee': 'Planifiée', 'terminee': 'Terminée'
    };
    return map[normalized] || 'Planifié';
}

// UI UTILS
export function showNotification(msg, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
    notif.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

export function animateNumber(element, targetValue, duration = 1000) {
    const startValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - startValue) / (duration / 16);
    let currentValue = startValue;
    const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= targetValue) || (increment < 0 && currentValue <= targetValue)) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(currentValue);
        }
    }, 16);
}

export function getAvatarUrl(prenom, nom) {
    const fullName = `${prenom} ${nom}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=00B8E6&color=fff`;
}

export function updateUserName(prenom, nom) {
    const fullName = `${prenom} ${nom}`;
    const userName = document.querySelector('.user-name');
    if (userName) userName.textContent = fullName;
    return fullName;
}

export function updateUserAvatar(prenom, nom) {
    const fullName = `${prenom} ${nom}`;
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.src = getAvatarUrl(prenom, nom);
        userAvatar.alt = fullName;
    }
}

export function updateUserUI(formateur) {
    const fullName = updateUserName(formateur.prenom, formateur.nom);
    updateUserAvatar(formateur.prenom, formateur.nom);
    const welcomeTitle = document.querySelector('.welcome-content h1');
    if (welcomeTitle) {
        welcomeTitle.innerHTML = `Bonjour, ${fullName} ! <span class="welcome-emoji">👋</span>`;
    }
    return fullName;
}

// MODAL UTILS
export function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    setTimeout(() => modal.remove(), 300);
}

export function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
}

export function initModalCloseEvents(modal) {
    modal.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
    });
}

// DROPDOWN MENU
export function toggleDropdown(parentElement, dropdownClass = 'user-dropdown') {
    let dropdown = parentElement.querySelector(`.${dropdownClass}`);
    if (dropdown) {
        dropdown.remove();
        return false;
    }
    return true;
}

export function closeAllDropdowns(dropdownClass = 'user-dropdown') {
    document.querySelectorAll(`.${dropdownClass}`).forEach(d => d.remove());
}

// VALIDATION
export function validateTimeSlot(heureDebut, heureFin) {
    if (!heureDebut || !heureFin) {
        return { valid: false, error: 'Les heures de début et fin sont requises' };
    }
    if (heureDebut >= heureFin) {
        return { valid: false, error: 'L\'heure de fin doit être après l\'heure de début' };
    }
    return { valid: true };
}

// CALENDAR UTILS
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOffset(year, month) {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
}

export function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}
