
export const API_BASE_URL = 'http://localhost:8080/api';


export function getAuthToken() {
    return localStorage.getItem('authToken');
}

export function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
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
    console.log(formateur);
    updateUserAvatar(formateur.prenom, formateur.nom);
    const welcomeTitle = document.querySelector('.welcome-content h1');
    if (welcomeTitle) {
        welcomeTitle.innerHTML = `Bonjour, ${fullName} ! <span class="welcome-emoji"></span>`;
    }
    return fullName;
}


// Rôles utilisateur
export const USER_ROLES = {
    ADMIN: 'ADMIN',
    FORMATEUR: 'FORMATEUR',
    ETUDIANT: 'ETUDIANT'
};

// Statuts de session
export const SESSION_STATUS = {
    PLANIFIE: 'PLANIFIE',
    EN_COURS: 'EN_COURS',
    TERMINE: 'TERMINE',
    A_VENIR: 'A_VENIR'
};

export const DATE_CONFIG = {
    JOURS: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'],
    JOURS_LABELS: {
        'LUNDI': 'Lundi',
        'MARDI': 'Mardi',
        'MERCREDI': 'Mercredi',
        'JEUDI': 'Jeudi',
        'VENDREDI': 'Vendredi',
        'SAMEDI': 'Samedi',
        'DIMANCHE': 'Dimanche'
    },
    JOURS_MAP: {
        1: 'LUNDI',
        2: 'MARDI',
        3: 'MERCREDI',
        4: 'JEUDI',
        5: 'VENDREDI',
        6: 'SAMEDI',
        7: 'DIMANCHE'
    },
    JOURS_FR: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    MOIS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    MOIS_COURTS: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
};


export const TIME_SLOTS = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' }
];