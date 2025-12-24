import { API_BASE_URL, getAuthHeaders } from '../../shared/config.js';

export const API_ENDPOINTS = {
    getAllConflits: `${API_BASE_URL}/conflits`,
    getConflitById: (id) => `${API_BASE_URL}/conflits/${id}`,
    deleteConflit: (id) => `${API_BASE_URL}/conflits/${id}`,
    deleteAllConflits: `${API_BASE_URL}/conflits`
};

// Solutions prédéfinies pour chaque type de conflit
export const SOLUTIONS_TEMPLATES = {
    'CONFLIT_SALLE': [
        {
            id: 1,
            title: "Changer de salle",
            description: "Attribuer une salle différente à l'une des sessions en conflit.",
            impact: "Faible",
            icon: "fas fa-exchange-alt"
        },
        {
            id: 2,
            title: "Déplacer la session",
            description: "Reporter la session à un autre créneau horaire disponible.",
            impact: "Moyen",
            icon: "fas fa-calendar-plus"
        },
        {
            id: 3,
            title: "Fusionner les sessions",
            description: "Regrouper les sessions concernées si elles sont compatibles.",
            impact: "Élevé",
            icon: "fas fa-object-group"
        }
    ],
    'CONFLIT_FORMATEUR': [
        {
            id: 1,
            title: "Remplacer le formateur",
            description: "Assigner un autre formateur disponible pour la session.",
            impact: "Faible",
            icon: "fas fa-user-friends"
        },
        {
            id: 2,
            title: "Reporter la session",
            description: "Décaler la session à un horaire où le formateur est disponible.",
            impact: "Moyen",
            icon: "fas fa-clock"
        }
    ],
    'CONFLIT_MATERIEL': [
        {
            id: 1,
            title: "Emprunter du matériel",
            description: "Emprunter du matériel supplémentaire pour la session.",
            impact: "Faible",
            icon: "fas fa-tools"
        },
        {
            id: 2,
            title: "Optimiser l'utilisation",
            description: "Réorganiser l'utilisation du matériel existant.",
            impact: "Moyen",
            icon: "fas fa-cogs"
        }
    ],
    'CONFLIT_GROUPE': [
        {
            id: 1,
            title: "Diviser le groupe",
            description: "Diviser le groupe en sous-groupes plus petits.",
            impact: "Élevé",
            icon: "fas fa-users-slash"
        },
        {
            id: 2,
            title: "Changer l'horaire",
            description: "Déplacer une des sessions à un autre créneau.",
            impact: "Moyen",
            icon: "fas fa-calendar-alt"
        }
    ],
    'CHEVAUCHEMENT_SESSION': [
        {
            id: 1,
            title: "Ajuster les horaires",
            description: "Réduire la durée des sessions pour éviter le chevauchement.",
            impact: "Faible",
            icon: "fas fa-clock"
        }
    ],
    'CONTRAINTE_NON_RESPECTEE': [
        {
            id: 1,
            title: "Revoir la planification",
            description: "Repenser complètement la planification pour respecter les contraintes.",
            impact: "Élevé",
            icon: "fas fa-redo"
        }
    ],
    'DEFAULT': [
        {
            id: 1,
            title: "Analyser manuellement",
            description: "Examiner le conflit en détail pour trouver une solution adaptée.",
            impact: "Variable",
            icon: "fas fa-search"
        }
    ]
};