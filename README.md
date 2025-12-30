# 📚 EduPlanner - Système de Gestion de Centre de Formation

## 📋 Description

**EduPlanner** est une plateforme web complète de gestion intelligente pour centres de formation. Elle permet une planification automatique des sessions, la gestion des ressources (formateurs, étudiants, salles, équipements), la détection de conflits et l'optimisation des emplois du temps.

## ✨ Fonctionnalités Principales

### 🔐 Gestion Multi-Rôles
- **Administrateur**: Gestion complète du système
- **Formateur**: Gestion des disponibilités et suivi des sessions
- **Étudiant**: Consultation du planning et des formations

### 📊 Tableau de Bord Intelligent
- Statistiques en temps réel
- Vue d'ensemble des activités
- Indicateurs de performance

### 👥 Gestion des Ressources Humaines
- **Formateurs**
  - Profils détaillés avec spécialités
  - Gestion des disponibilités hebdomadaires
  - Suivi des sessions assignées
  
- **Étudiants**
  - Organisation par groupes
  - Suivi des inscriptions
  - Historique des formations

### 🏫 Gestion des Infrastructures
- **Salles**
  - Capacité et type (cours, amphithéâtre, laboratoire, etc.)
  - Disponibilité en temps réel
  - Attribution optimisée

- **Équipements**
  - Inventaire du matériel
  - État et quantités disponibles
  - Affectation aux sessions

### 📅 Planification Intelligente
- Génération automatique de planning
- Vue hebdomadaire/mensuelle/journalière
- Drag & drop pour ajustements manuels
- Création et gestion des créneaux horaires

### ⚠️ Gestion des Conflits
- Détection automatique des conflits
  - Conflits de salles
  - Conflits de formateurs
  - Conflits de matériel
  - Chevauchement de sessions
- Suggestions de solutions intelligentes
- Résolution automatique ou manuelle

## 🛠️ Technologies Utilisées

### Frontend
- **HTML5/CSS3**: Structure et design moderne
- **JavaScript (ES6+)**: Logique applicative
- **Font Awesome 6.4.0**: Icônes
- **Google Fonts (Montserrat)**: Typographie
- **Architecture modulaire**: Organisation en modules ES6

### Backend
- **Spring Boot**: API REST
- **Base de données**: Système relationnel
- **Architecture**: MVC

## 📦 Installation

### Prérequis
```bash
- Navigateur web moderne (Chrome, Firefox, Edge)
- Serveur backend Spring Boot configuré
- Java 17+ (pour le backend)
- Maven ou Gradle (pour le backend)
```

### Configuration

#### 1. Cloner le repository
```bash
git clone https://github.com/ZeinebGhrab/EduPlanner.git
cd EduPlanner
```

#### 2. Configuration de l'API

Modifier l'URL de l'API dans les fichiers de configuration :

**front-end/js/admin/config.js**
```javascript
window.API_BASE = "http://localhost:8080/api";
```

**front-end/js/authentification/config.js**
```javascript
export const API_BASE_URL = 'http://localhost:8080/api';
```

**front-end/js/shared/config.js**
```javascript
export const API_BASE_URL = 'http://localhost:8080/api';
```

#### 3. Lancer le backend
```bash
cd backend
./mvnw spring-boot:run
# ou
gradle bootRun
```

#### 4. Lancer le frontend

**Option 1: Ouvrir directement dans le navigateur**
```bash
# Windows
start front-end/interface/accueil/index.html

# macOS
open front-end/interface/accueil/index.html

# Linux
xdg-open front-end/interface/accueil/index.html
```

**Option 2: Utiliser un serveur local**
```bash
# Avec Python 3
cd front-end
python -m http.server 3000

# Avec Node.js (http-server)
npx http-server front-end -p 3000

# Avec PHP
cd front-end
php -S localhost:3000
```

Accéder à: `http://localhost:3000/interface/accueil/index.html`

## 🚀 Utilisation

### Première Connexion

#### Accès Administrateur
Pour créer un compte administrateur, vous devez le faire directement via la base de données ou via un endpoint spécifique du backend.

#### Inscription Formateur
1. Aller sur la page d'authentification
2. Cliquer sur l'onglet "Inscription"
3. Sélectionner le rôle "Formateur"
4. Remplir les informations:
   - Nom complet
   - Email
   - Téléphone
   - Mot de passe (min. 6 caractères)
5. Sélectionner au moins une spécialité
6. Définir les disponibilités hebdomadaires
7. Cliquer sur "Créer un compte"

#### Inscription Étudiant
1. Aller sur la page d'authentification
2. Cliquer sur l'onglet "Inscription"
3. Sélectionner le rôle "Étudiant"
4. Remplir les informations:
   - Nom complet
   - Email
   - Téléphone
   - Mot de passe
5. Sélectionner le niveau d'études
6. Choisir les groupes souhaités
7. Cliquer sur "Créer un compte"

### Connexion
1. Aller sur la page d'authentification
2. Entrer l'email et le mot de passe
3. Cliquer sur "Se connecter"
4. Redirection automatique vers le dashboard correspondant au rôle

### Navigation

#### Dashboard Administrateur
- **Formateurs**: `/admin-management/formateurs.html`
- **Étudiants**: `/admin-management/etudiants.html`
- **Salles**: `/admin-management/salles.html`
- **Équipements**: `/admin-management/equipement.html`
- **Planning**: `/admin-management/planning.html`
- **Conflits**: `/admin-management/admin-conflicts.html`

#### Dashboard Formateur
- **Tableau de bord**: `/instructor-management/instructor-dashbord.html`
- **Planning**: `/instructor-management/instructor-planning.html`
- **Mes sessions**: `/instructor-management/instructor-sessions.html`

#### Dashboard Étudiant
- **Tableau de bord**: `/student-managment/student-dashbord.html`
- **Planning**: `/student-managment/student-planning.html`
- **Formations**: `/student-managment/student-session.html`

## 📁 Structure du Projet

```
EduPlanner/
├── front-end/
│   ├── interface/
│   │   ├── accueil/
│   │   │   └── index.html                    # Page d'accueil
│   │   │
│   │   ├── authentification/
│   │   │   └── auth.html                     # Login/Register
│   │   │
│   │   ├── admin-management/
│   │   │   ├── formateurs.html               # Gestion formateurs
│   │   │   ├── etudiants.html                # Gestion étudiants
│   │   │   ├── salles.html                   # Gestion salles
│   │   │   ├── equipement.html               # Gestion équipements
│   │   │   ├── planning.html                 # Planning admin
│   │   │   └── admin-conflicts.html          # Gestion conflits
│   │   │
│   │   ├── instructor-management/
│   │   │   ├── instructor-dashbord.html      # Dashboard formateur
│   │   │   ├── instructor-planning.html      # Planning formateur
│   │   │   └── instructor-sessions.html      # Sessions formateur
│   │   │
│   │   └── student-managment/
│   │       ├── student-dashbord.html         # Dashboard étudiant
│   │       ├── student-planning.html         # Planning étudiant
│   │       └── student-session.html          # Formations étudiant
│   │
│   ├── style/
│   │   ├── style.css                         # Style accueil
│   │   ├── authentification/
│   │   │   └── auth.css
│   │   ├── admin-management/
│   │   │   ├── shared.css                    # Styles communs admin
│   │   │   ├── formateurs.css
│   │   │   ├── etudiants.css
│   │   │   ├── salles.css
│   │   │   ├── equipement.css
│   │   │   └── conflit.css
│   │   ├── planning.css
│   │   ├── instructor-managmenet/
│   │   │   ├── dashbord-instructor.css
│   │   │   ├── planning-instructor.css
│   │   │   └── sessions-instructor.css
│   │   └── student-managment/
│   │       ├── dashboard-etudiant.css
│   │       ├── planning-etudiant.css
│   │       └── formations-etudiant.css
│   │
│   └── js/
│       ├── admin/
│       │   ├── config.js                     # Configuration admin
│       │   ├── planning.js                   # Logique planning
│       │   ├── planning-create.js
│       │   ├── creneau.js                    # Gestion créneaux
│       │   │
│       │   ├── formateur/
│       │   │   ├── formateurs.js
│       │   │   ├── formateurs.api.js
│       │   │   └── formateurs.ui.js
│       │   │
│       │   ├── etudiant-management/
│       │   │   ├── core.js
│       │   │   ├── api-etudiant.js
│       │   │   ├── ui-etudiant.js
│       │   │   ├── modals-etudiant.js
│       │   │   └── events-etudiant.js
│       │   │
│       │   ├── salles-management/
│       │   │   ├── salles-main.js
│       │   │   ├── salles-api.js
│       │   │   ├── salles-ui.js
│       │   │   ├── salles-filtres.js
│       │   │   └── salles-modals.js
│       │   │
│       │   ├── equipement/
│       │   │   ├── equipements-main.js
│       │   │   ├── equipements-api.js
│       │   │   ├── equipements-ui.js
│       │   │   └── equipements-modals.js
│       │   │
│       │   └── conflict-management/
│       │       └── app.js                    # Gestion conflits
│       │
│       ├── instructor/
│       │   ├── dashboard-instructor.js
│       │   ├── planning-management/
│       │   │   ├── main.js
│       │   │   ├── calendar.js
│       │   │   └── availability.js
│       │   ├── sessions-management/
│       │   │   └── ui.js
│       │   └── shared/
│       │       ├── api-utils.js
│       │       └── ui-helpers.js
│       │
│       ├── student/
│       │   ├── dashboard-management/
│       │   │   ├── dashboard-student.js
│       │   │   ├── api-config.js
│       │   │   └── modules/
│       │   │       ├── statistics.js
│       │   │       ├── planning.js
│       │   │       ├── groups.js
│       │   │       ├── sessions.js
│       │   │       └── styles.js
│       │   ├── planning-management/
│       │   │   ├── planning-student.js
│       │   │   ├── planning-api.js
│       │   │   ├── planning-ui.js
│       │   │   └── planning-utils.js
│       │   ├── sessions-management/
│       │   │   ├── api.js
│       │   │   └── sessions-student.js
│       │   └── shared/
│       │       └── api-utils.js
│       │
│       ├── authentification/
│       │   ├── main.js
│       │   ├── auth.js
│       │   ├── config.js
│       │   ├── ui.js
│       │   ├── toast.js
│       │   └── events.js
│       │
│       └── shared/
│           └── config.js                     # Configuration globale
│
└── README.md
```

## 🔌 API Endpoints

### Authentification
```http
POST   /api/formateur/login      # Connexion formateur
POST   /api/etudiant/login       # Connexion étudiant
POST   /api/admin/login          # Connexion admin
```

### Profil Utilisateur
```http
GET    /api/formateur/me         # Profil formateur connecté
GET    /api/etudiant/me          # Profil étudiant connecté
```

### Formateurs
```http
GET    /api/formateurs           # Liste des formateurs
POST   /api/formateurs           # Créer un formateur
PUT    /api/formateurs/{id}      # Modifier un formateur
DELETE /api/formateurs/{id}      # Supprimer un formateur
GET    /api/formateurs/{id}/statistiques
```

### Étudiants
```http
GET    /api/etudiants            # Liste des étudiants
POST   /api/etudiants            # Créer un étudiant
PUT    /api/etudiants/{id}       # Modifier un étudiant
DELETE /api/etudiants/{id}       # Supprimer un étudiant
GET    /api/etudiants/{id}/groupes
GET    /api/etudiants/{id}/planning
GET    /api/etudiants/{id}/sessions
GET    /api/etudiants/{id}/sessions/a-venir
GET    /api/etudiants/{id}/statistiques
```

### Groupes
```http
GET    /api/groupes              # Liste des groupes
POST   /api/groupes              # Créer un groupe
PUT    /api/groupes/{id}         # Modifier un groupe
DELETE /api/groupes/{id}         # Supprimer un groupe
```

### Salles
```http
GET    /api/salles               # Liste des salles
POST   /api/salles               # Créer une salle
PUT    /api/salles/{id}          # Modifier une salle
DELETE /api/salles/{id}          # Supprimer une salle
```

### Matériel/Équipements
```http
GET    /api/materiels            # Liste des équipements
POST   /api/materiels            # Créer un équipement
PUT    /api/materiels/{id}       # Modifier un équipement
DELETE /api/materiels/{id}       # Supprimer un équipement
```

### Sessions
```http
GET    /api/sessions             # Liste des sessions
POST   /api/sessions             # Créer une session
PUT    /api/sessions/{id}        # Modifier une session
DELETE /api/sessions/{id}        # Supprimer une session
GET    /api/sessions/formateur/{id}
GET    /api/sessions/formateur/{id}?date=YYYY-MM-DD
GET    /api/sessions/formateur/{id}/upcoming?limit=3
GET    /api/sessions/formateur/{id}/filter
```

### Créneaux Horaires
```http
GET    /api/creneaux             # Liste des créneaux
POST   /api/creneaux             # Créer un créneau
DELETE /api/creneaux/{id}        # Supprimer un créneau
```

### Disponibilités
```http
GET    /api/disponibilites       # Toutes les disponibilités
POST   /api/disponibilites       # Créer une disponibilité
PUT    /api/disponibilites/{id}  # Modifier une disponibilité
DELETE /api/disponibilites/{id}  # Supprimer une disponibilité
GET    /api/disponibilites/formateur/{id}
```

### Plannings
```http
GET    /api/plannings            # Liste des plannings
POST   /api/plannings            # Créer un planning
PUT    /api/plannings/{id}       # Modifier un planning
DELETE /api/plannings/{id}       # Supprimer un planning
```

### Conflits
```http
GET    /api/conflits             # Liste des conflits
GET    /api/conflits/{id}        # Détails d'un conflit
DELETE /api/conflits/{id}        # Supprimer un conflit
DELETE /api/conflits             # Supprimer tous les conflits
GET    /api/admin/planning/resolution/analyse/{planningId}
POST   /api/admin/planning/resolution/appliquer-solution
POST   /api/admin/planning/resolution/resoudre-tout/{planningId}
```

## 🎨 Fonctionnalités Détaillées

### Module Administrateur

#### 1. Gestion des Formateurs
- Ajout/Modification/Suppression de formateurs
- Gestion des spécialités
- Configuration des disponibilités hebdomadaires
- Filtrage par statut (actif/inactif)
- Recherche en temps réel
- Pagination des résultats
- Vue détaillée des disponibilités

#### 2. Gestion des Étudiants
- Double vue: par groupes ou liste complète
- Attribution aux groupes
- Gestion du statut (actif/inactif)
- Filtrage par niveau et groupe
- Statistiques par niveau
- Création de nouveaux groupes

#### 3. Gestion des Salles
- Types multiples: Cours, Amphithéâtre, Informatique, Laboratoire, Réunion
- Gestion de la capacité
- Organisation par bâtiment
- Tri et filtrage
- Indicateurs de disponibilité

#### 4. Gestion des Équipements
- Types: Ordinateur, Projecteur, Tablette, Imprimante, Réseau, Audio
- États: Neuf, Bon, À réparer, Hors service
- Suivi des quantités disponibles
- Alertes pour matériel à réparer
- Filtres par état

#### 5. Planning Global
- Vue hebdomadaire par salle
- Affichage des sessions en temps réel
- Création de sessions avec:
  - Sélection du formateur
  - Choix de la salle
  - Attribution du groupe
  - Sélection des créneaux (multi-sélection)
  - Affectation du matériel requis
- Gestion des créneaux horaires
- Détection de conflits à la création
- Filtres par salle et statut
- Navigation semaine par semaine

#### 6. Gestion des Conflits
- Dashboard complet des conflits
- Statistiques par type:
  - Conflits de salles
  - Conflits de formateurs
  - Conflits de matériel
  - Conflits de groupes
- Détails de chaque conflit
- Solutions recommandées intelligentes
- Application de solutions individuelles ou en groupe
- Résolution automatique de tous les conflits
- Filtrage par type et sévérité
- Recherche de conflits

### Module Formateur

#### 1. Dashboard
- Sessions du jour
- Sessions à venir (3 prochaines)
- Statistiques personnelles:
  - Sessions à venir
  - Sessions terminées
  - Étudiants actifs

#### 2. Planning
- Vue calendrier mensuelle
- Gestion des disponibilités
- Sélection multiple de créneaux
- Ajout/Suppression de disponibilités
- Vue hebdomadaire des disponibilités
- Navigation entre les mois

#### 3. Mes Sessions
- Liste détaillée des sessions
- Filtres par:
  - Groupe
  - Salle
  - Statut
- Informations complètes:
  - Liste des étudiants
  - Matériel disponible
  - Salle attribuée
- Demande de matériel supplémentaire

### Module Étudiant

#### 1. Dashboard
- Vue d'ensemble de la semaine
- Sessions d'aujourd'hui
- Mes groupes
- Prochaines sessions (3)
- Statistiques:
  - Temps total de formation
  - Taux de complétion
  - Formations terminées

#### 2. Planning Hebdomadaire
- Vue calendrier par jour
- Horaires détaillés
- Informations de session:
  - Formateur
  - Salle
  - Groupe
- Statuts visuels (À venir, En cours, Terminé)
- Navigation entre les semaines

#### 3. Formations
- Liste de toutes les formations
- Filtres par statut:
  - Toutes
  - En cours
  - Terminées
  - À venir
  - Planifiées
- Détails de chaque formation:
  - Date et horaire
  - Formateur
  - Statut visuel

## 🔧 Configuration Avancée

### Modification des Ports

#### Backend
```properties
# application.properties
server.port=8080
```

#### Frontend (serveur de développement)
```bash
# Modifier le port dans la commande de lancement
npx http-server front-end -p 3000
```

### CORS Configuration
Le backend doit autoriser les requêtes depuis le frontend:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
    }
}
```

### Authentification JWT
Les tokens sont stockés dans le localStorage:
- Clé: `authToken`
- Format: Bearer token
- Durée de validité: Configurée côté backend

## 🐛 Dépannage

### Problème: Erreur de connexion à l'API
**Solution:**
1. Vérifier que le backend est lancé sur le port 8080
2. Vérifier la configuration CORS
3. Vérifier l'URL de l'API dans les fichiers de config

### Problème: Les sessions ne s'affichent pas dans le planning
**Solution:**
1. Vérifier que les créneaux sont créés
2. Vérifier que le planning est créé
3. Vérifier l'association session-créneau dans la base

### Problème: Erreur 401 (Non autorisé)
**Solution:**
1. Vérifier que le token est bien stocké
2. Se reconnecter
3. Vérifier la validité du token côté backend

### Problème: Les disponibilités du formateur ne s'affichent pas
**Solution:**
1. Vérifier que les disponibilités sont créées avec le bon formateurId
2. Vérifier le format des heures (HH:mm:ss)
3. Vérifier que estDisponible = true

## 📱 Responsive Design

L'application est responsive et s'adapte aux différentes tailles d'écran:
- 💻 Desktop: Vue complète
- 📱 Tablette: Vue adaptée
- 📱 Mobile: Navigation hamburger, vues simplifiées

## 🔒 Sécurité

- ✅ Authentification par token JWT
- ✅ Protection des routes par rôle
- ✅ Validation côté client et serveur
- ✅ Hashage des mots de passe
- ✅ Protection contre les injections SQL

## 🚦 Tests

### Tests Manuels Recommandés

#### Formateurs
1. ✅ Créer un formateur avec disponibilités
2. ✅ Modifier les disponibilités
3. ✅ Filtrer par spécialité
4. ✅ Désactiver/Activer un formateur

#### Sessions
1. ✅ Créer une session simple
2. ✅ Créer une session avec conflit
3. ✅ Résoudre un conflit
4. ✅ Supprimer une session

#### Planning
1. ✅ Naviguer entre les semaines
2. ✅ Filtrer par salle
3. ✅ Filtrer par statut

## 📊 Performances

### Optimisations Implémentées
- Chargement lazy des images
- Pagination des listes longues
- Debouncing sur les recherches
- Mise en cache des données utilisateur
- Requêtes optimisées

## 🎯 Roadmap

### Fonctionnalités Futures
- [ ] Export PDF des plannings
- [ ] Notifications push
- [ ] Système de messagerie interne
- [ ] Gestion des absences
- [ ] Statistiques avancées
- [ ] Application mobile native
- [ ] Mode hors-ligne
- [ ] Intégration calendrier (Google, Outlook)

## 👥 Contribution

Pour contribuer au projet:
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence [MIT](LICENSE).

## 🙏 Remerciements

- Font Awesome pour les icônes
- Google Fonts pour la typographie Montserrat
- La communauté Spring Boot
- Tous les contributeurs du projet

## 📞 Support

Pour toute question ou problème:
- 📧 Email: zeineb.ghrab@enetcom.u-sfax.tn
- 🐛 Issues: [GitHub Issues](https://github.com/ZeinebGhrab/EduPlanner.git)

---

**Version:** 1.0.0  
**Dernière mise à jour:** Décembre 2025  