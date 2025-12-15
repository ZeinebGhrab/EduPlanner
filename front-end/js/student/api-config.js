// Configuration API - Version corrigée
class ApiService {
    constructor() {
        // CORRECTION : Ton backend tourne sur le port 8081
        this.BASE_URL = 'http://localhost:8080/api';

        // Endpoints basés sur tes logs
        this.ENDPOINTS = {
            ETUDIANT: {
                PROFILE: '/etudiants/1',
                PLANNING: '/sessions/etudiant/planning',
                STATISTIQUES: '/etudiants/1/statistiques',
                GROUPES: '/etudiants/1/groupes'  // NOUVEAU
            }
        };
    }

    // Test de connexion amélioré
    async testConnection() {
        console.log('🔍 Test de connexion au backend sur port 8081...');

        // Test 1: Planning (endpoint qui fonctionne)
        try {
            const response = await fetch(`${this.BASE_URL}${this.ENDPOINTS.ETUDIANT.PLANNING}`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connecté ! Planning reçu:', data);
                return { connected: true, type: 'planning', data: data };
            }
        } catch (error) {
            console.log('❌ Erreur planning:', error.message);
        }

        // Test 2: Étudiants
        try {
            const response = await fetch(`${this.BASE_URL}/etudiants/1`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connecté ! Étudiant reçu:', data);
                return { connected: true, type: 'etudiant', data: data };
            }
        } catch (error) {
            console.log('❌ Erreur étudiants:', error.message);
        }

        console.log('❌ Aucun endpoint ne répond');
        return { connected: false, error: 'Aucune connexion' };
    }

    // Méthode GET
    async get(endpoint) {
        try {
            console.log(`📡 GET: ${this.BASE_URL}${endpoint}`);

            const response = await fetch(`${this.BASE_URL}${endpoint}`);

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Données reçues:', data);
            return data;

        } catch (error) {
            console.log('❌ Erreur API:', error.message);
            console.log('📋 Utilisation données mockées pour:', endpoint);
            return this.getMockData(endpoint);
        }
    }

    // Données mockées améliorées
    getMockData(endpoint) {
        if (endpoint.includes('/sessions/etudiant/planning')) {
            return [
                {
                    id: 1,
                    titre: "React Avancé",
                    description: "Les hooks avancés et performance",
                    dateDebut: "2024-12-15T09:00:00",
                    dateFin: "2024-12-15T12:00:00",
                    formateur: { nom: "Dupont", prenom: "Martin" },
                    salle: { nom: "Salle A12" },
                    groupe: { nom: "Développement Web" },
                    statut: "PLANIFIE"
                },
                {
                    id: 2,
                    titre: "Projet Pratique",
                    description: "Mise en pratique des concepts React",
                    dateDebut: "2024-12-15T14:00:00",
                    dateFin: "2024-12-15T17:00:00",
                    formateur: { nom: "Martin", prenom: "Sophie" },
                    salle: { nom: "Laboratoire B05" },
                    groupe: { nom: "Développement Web" },
                    statut: "PLANIFIE"
                }
            ];
        }

        if (endpoint.includes('/etudiants/')) {
            return {
                id: 1,
                nom: "Doe",
                prenom: "John",
                email: "john.doe@email.com",
                matricule: "ETU2024001",
                niveau: "Licence 3",
                actif: true,
                telephone: "0123456789"
            };
        }

        return { message: "Données mockées pour: " + endpoint };
    }
}


// Crée et expose l'instance
const apiService = new ApiService();
window.apiService = apiService;
console.log('🚀 API Service prêt (port 8081)');