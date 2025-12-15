// Dashboard Étudiant - Version avec vrai planning
class DashboardEtudiant {
    constructor() {
        console.log('🎓 Dashboard initialisation...');
        this.init();
    }

    async init() {
        console.log('🔄 Démarrage...');

        // Test de connexion
        const connection = await apiService.testConnection();

        if (connection.connected) {
            console.log('✅ Mode ONLINE - Connexion établie');

            // Si on a reçu le planning, affiche-le
            if (connection.type === 'planning') {
                console.log('📅 Planning reçu du test:', connection.data);
                await this.loadRealData();
            } else {
                // Sinon charge normalement
                await this.loadRealData();
            }

        } else {
            console.log('⚠️ Mode OFFLINE - Données mockées');
            this.loadMockData();
        }
    }

    async loadRealData() {
        console.log('📥 Chargement données réelles...');

        try {
            // 1. Charger le profil
            const profile = await this.loadProfile();

            // 2. Charger le planning
            const planning = await apiService.get(apiService.ENDPOINTS.ETUDIANT.PLANNING);

            // 3. Charger les statistiques
            const statistiques = await this.loadStatistics(profile.id);

            // 4. Charger les groupes
            const groupes = await this.loadGroupes(profile.id);

            // 5. Mettre à jour la page
            this.updatePage(profile, planning, statistiques, groupes);

            this.showMessage('Données chargées avec succès !', 'success');

        } catch (error) {
            console.error('❌ Erreur:', error);
            this.loadMockData();
        }
    }

    async loadProfile() {
        try {
            const profile = await apiService.get(`/etudiants/1`);
            if (!profile || !profile.id) {
                throw new Error('Profil invalide');
            }
            return profile;
        } catch (error) {
            console.log('⚠️ Profil non disponible, utilisation mock');
        }
    }
    async getRealStatistics(etudiantId) {
        try {
            // Récupérer toutes les sessions de l'étudiant
            const sessions = await apiService.get(apiService.ENDPOINTS.ETUDIANT.PLANNING);

            // Récupérer les groupes de l'étudiant
            const groupes = await apiService.get(`/etudiants/${etudiantId}/groupes`);

            // CALCULER LES STATISTIQUES RÉELLES :

            // 1. Temps total de formation (en heures)
            let tempsTotal = 0;
            if (sessions && Array.isArray(sessions)) {
                sessions.forEach(session => {
                    if (session.heureDebut && session.heureFin) {
                        const debut = new Date(`${session.date}T${session.heureDebut}`);
                        const fin = new Date(`${session.date}T${session.heureFin}`);
                        const dureeHeures = (fin - debut) / (1000 * 60 * 60);
                        if (!isNaN(dureeHeures)) {
                            tempsTotal += dureeHeures;
                        }
                    }
                });
            }

            // 2. Taux de complétion (basé sur les sessions terminées)
            let tauxCompletion = 0;
            let sessionsTerminees = 0;
            if (sessions && Array.isArray(sessions)) {
                const now = new Date();
                sessionsTerminees = sessions.filter(session => {
                    try {
                        const fin = new Date(`${session.date}T${session.heureFin}`);
                        return now > fin;
                    } catch (e) {
                        return false;
                    }
                }).length;

                tauxCompletion = sessions.length > 0
                    ? Math.round((sessionsTerminees / sessions.length) * 100)
                    : 0;
            }

            // 3. Formations terminées (basé sur les groupes terminés)
            let formationsTerminees = 0;
            if (groupes && Array.isArray(groupes)) {
                // Suppose qu'un groupe avec progression >= 90% est terminé
                formationsTerminees = groupes.filter(groupe =>
                    groupe.progression >= 90
                ).length;
            }

            return {
                tempsTotalFormation: Math.round(tempsTotal),
                tauxCompletion: tauxCompletion,
                formationsTerminees: formationsTerminees
            };

        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                tempsTotalFormation: 0,
                tauxCompletion: 0,
                formationsTerminees: 0
            };
        }
    }

    async loadStatistics(etudiantId) {
        try {
            // 1. Récupérer toutes les données nécessaires
            const [sessions, groupes, etudiant] = await Promise.all([
                apiService.get(apiService.ENDPOINTS.ETUDIANT.PLANNING),
                apiService.get(`/etudiants/${etudiantId}/groupes`),
                apiService.get(`/etudiants/${etudiantId}`)
            ]);

            // 2. CALCULER LES VRAIES STATISTIQUES

            // a) Temps total de formation
            let tempsTotal = 0;
            if (sessions && Array.isArray(sessions)) {
                sessions.forEach(session => {
                    if (session.heureDebut && session.heureFin && session.date) {
                        try {
                            const debut = new Date(`${session.date}T${session.heureDebut}`);
                            const fin = new Date(`${session.date}T${session.heureFin}`);
                            const dureeHeures = (fin - debut) / (1000 * 60 * 60);
                            if (!isNaN(dureeHeures) && dureeHeures > 0) {
                                tempsTotal += dureeHeures;
                            }
                        } catch (e) {
                            console.warn('Erreur calcul durée session:', e);
                        }
                    }
                });
            }

            // b) Taux de complétion (sessions terminées / total sessions)
            let tauxCompletion = 0;
            if (sessions && sessions.length > 0) {
                const now = new Date();
                const sessionsTerminees = sessions.filter(session => {
                    try {
                        if (!session.date || !session.heureFin) return false;
                        const finSession = new Date(`${session.date}T${session.heureFin}`);
                        return now > finSession;
                    } catch (e) {
                        return false;
                    }
                }).length;

                tauxCompletion = Math.round((sessionsTerminees / sessions.length) * 100);
            }

            // c) Formations terminées
            let formationsTerminees = 0;
            if (groupes && Array.isArray(groupes)) {
                // Supposons qu'une formation est terminée si progression >= 90%
                formationsTerminees = groupes.filter(groupe =>
                    groupe.progression && groupe.progression >= 90
                ).length;

                // Sinon, basé sur les sessions terminées dans le groupe
                if (formationsTerminees === 0) {
                    formationsTerminees = Math.floor(groupes.length * (tauxCompletion / 100));
                }
            }

            return {
                tempsTotalFormation: Math.round(tempsTotal),
                tauxCompletion: tauxCompletion,
                formationsTerminees: formationsTerminees,
                nombreGroupes: groupes ? groupes.length : 0,
                nomComplet: etudiant ? `${etudiant.prenom} ${etudiant.nom}` : '',
                etudiantId: etudiantId
            };

        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);

            // Fallback aux données du backend (même si fictives)
            try {
                const backendStats = await apiService.get(`/etudiants/${etudiantId}/statistiques`);
                return {
                    tempsTotalFormation: backendStats.tempsTotalFormation || 0,
                    tauxCompletion: backendStats.tauxCompletion || 0,
                    formationsTerminees: backendStats.formationsTerminees || 0,
                    nombreGroupes: backendStats.nombreGroupes || 0,
                    nomComplet: backendStats.nomComplet || '',
                    etudiantId: etudiantId
                };
            } catch (e) {
                return {
                    tempsTotalFormation: 0,
                    tauxCompletion: 0,
                    formationsTerminees: 0,
                    nombreGroupes: 0,
                    nomComplet: '',
                    etudiantId: etudiantId
                };
            }
        }
    }
    async loadGroupes(etudiantId) {
        try {
            const groupes = await apiService.get(`/etudiants/${etudiantId}/groupes`);

            // Si c'est une liste vide, c'est normal, pas une erreur
            if (Array.isArray(groupes)) {
                console.log(`✅ ${groupes.length} groupe(s) trouvé(s)`);
                return groupes;
            }

            console.log('⚠️ Format de groupes invalide');
            return [];

        } catch (error) {
            console.log('⚠️ Groupes non disponibles');
            return [];
        }
    }
    loadMockData() {
        console.log('📥 Chargement données mockées...');

        const profile = apiService.getMockData(apiService.ENDPOINTS.ETUDIANT.PROFILE);
        const planning = apiService.getMockData(apiService.ENDPOINTS.ETUDIANT.PLANNING);
        const statistiques = {
            tempsTotalFormation: 156,
            tauxCompletion: 78,
            formationsTerminees: 5
        };

        this.updatePage(profile, planning, statistiques);
        this.showMessage('Mode démo - Backend non connecté', 'warning');
    }

    updatePage(profile, planning, statistiques, groupes = []) {
        console.log('🔄 Mise à jour de la page...');

        // 1. Met à jour le header
        this.updateHeader(profile);

        // 2. Met à jour le message de bienvenue
        this.updateWelcome(profile);

        // 3. Met à jour les statistiques
        this.updateStatistics(statistiques);

        // 4. Met à jour le planning du jour
        this.updateTodayPlanning(planning);

        // 5. Met à jour les groupes
        this.updateGroups(profile, groupes);

        // 6. Met à jour les sessions à venir
        this.updateNextSessions(planning);
    }
    updateHeader(profile) {
        // Nom utilisateur
        const userName = document.querySelector('.user-name');
        if (userName && profile) {
            userName.textContent = `${profile.prenom} ${profile.nom}`;
        }

        console.log('👤 Header mis à jour');
    }

    updateWelcome(profile) {
        // Message de bienvenue
        const welcomeTitle = document.querySelector('.welcome-content h1');
        if (welcomeTitle && profile) {
            welcomeTitle.innerHTML = `Bonjour, ${profile.prenom} ! <span class="welcome-emoji">👋</span>`;
        }

        console.log('👋 Bienvenue mis à jour');
    }

    updateStatistics(statistiques) {
        if (!statistiques) {
            console.warn('⚠️ Aucune statistique disponible');
            return;
        }

        const statCards = document.querySelectorAll('.stat-number');

        if (statCards.length >= 3) {
            // Temps total de formation
            statCards[0].textContent = `${statistiques.tempsTotalFormation}h`;

            // Taux de complétion avec icône de progression
            const taux = statistiques.tauxCompletion || 0;
            statCards[1].textContent = `${taux}%`;

            // Formations terminées
            statCards[2].textContent = statistiques.formationsTerminees || 0;
        }

        // Mettez à jour aussi les barres de progression si vous en avez
        this.updateProgressBars(statistiques);

        console.log('📊 Statistiques mises à jour:', statistiques);
    }

    updateProgressBars(statistiques) {
        // Ajoutez des barres de progression visuelles
        const taux = statistiques.tauxCompletion || 0;
        const progressBar = document.querySelector('.completion-progress');

        if (progressBar) {
            progressBar.style.width = `${taux}%`;
            progressBar.setAttribute('data-progress', `${taux}%`);
        }
    }

    updateTodayPlanning(sessions) {
        if (!sessions || !Array.isArray(sessions)) {
            console.warn('❌ Pas de sessions pour aujourd\'hui');
            return;
        }

        // FILTRE : Garder uniquement les sessions d'aujourd'hui
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // Format: "2024-03-11"

        console.log('📅 Date du jour:', todayString);

        // Filtrer les sessions pour aujourd'hui
        const todaySessions = sessions.filter(session => {
            return session.date === todayString;
        });

        console.log(`📅 ${todaySessions.length} session(s) pour aujourd'hui sur ${sessions.length} au total`);

        const scheduleCardsContainer = document.querySelector('.schedule-cards');
        if (!scheduleCardsContainer) return;

        // Vide le contenu existant
        scheduleCardsContainer.innerHTML = '';

        // Si pas de sessions pour aujourd'hui, affiche un message
        if (todaySessions.length === 0) {
            scheduleCardsContainer.innerHTML = `
            <div class="no-sessions">
                <i class="fas fa-calendar-times"></i>
                <p>Aucune session prévue pour aujourd'hui</p>
                <p style="font-size: 14px; margin-top: 10px; opacity: 0.7;">
                    Vous avez ${sessions.length} session(s) à venir dans votre planning.
                </p>
            </div>
        `;
            return;
        }

        // Crée une carte pour chaque session d'aujourd'hui
        todaySessions.forEach((session, index) => {
            console.log(`Session d'aujourd'hui ${index + 1}:`, session);
            const sessionCard = this.createSessionCard(session);
            scheduleCardsContainer.appendChild(sessionCard);
        });

        // Log de débogage (optionnel)
        console.log('📋 Sessions d\'aujourd\'hui:');
        todaySessions.forEach((session, index) => {
            console.group(`--- Session ${index + 1} ---`);
            console.log('Date:', session.date);
            console.groupEnd();
        });
    }
    createSessionCard(session) {
        const card = document.createElement('div');
        card.className = 'schedule-card';

        console.log('🔍 Session pour création:', session);

        // Récupère les infos avec sécurité - NOUVELLE STRUCTURE
        const titre = session.titre || "Session";
        const description = session.description || "";

        // Formateur - peut être dans une propriété différente
        let formateurNom = "Formateur non spécifié";
        if (session.formateur) {
            if (typeof session.formateur === 'object') {
                formateurNom = `${session.formateur.prenom || ''} ${session.formateur.nom || ''}`.trim();
                if (!formateurNom) formateurNom = session.formateur.nom || "Formateur";
            } else {
                formateurNom = session.formateur;
            }
        } else if (session.formateurNom) {
            formateurNom = session.formateurNom;
        }

        // Salle
        let salleNom = "Salle non spécifiée";
        if (session.salle) {
            if (typeof session.salle === 'object') {
                salleNom = session.salle.nom || session.salle;
            } else {
                salleNom = session.salle;
            }
        } else if (session.salleNom) {
            salleNom = session.salleNom;
        }

        // Groupe
        let groupeNom = "";
        if (session.groupe) {
            if (typeof session.groupe === 'object') {
                groupeNom = session.groupe.nom || "";
            } else {
                groupeNom = session.groupe;
            }
        } else if (session.groupeNom) {
            groupeNom = session.groupeNom;
        }

        // GESTION DES DATES - NOUVELLE STRUCTURE
        let heureDebut = "09:00";
        let heureFin = "12:00";
        let dureeHeures = "3";
        let dateAffichee = "";
        let statusClass = 'status-upcoming';
        let statusText = 'À venir';

        try {
            // NOUVEAU : Utilise date + heureDebut/heureFin
            if (session.date && session.heureDebut && session.heureFin) {
                // Combine date + heure
                const dateTimeDebutStr = `${session.date}T${session.heureDebut.substring(0, 5)}:00`;
                const dateTimeFinStr = `${session.date}T${session.heureFin.substring(0, 5)}:00`;

                console.log('📅 Date début string:', dateTimeDebutStr);
                console.log('📅 Date fin string:', dateTimeFinStr);

                const dateDebut = new Date(dateTimeDebutStr);
                const dateFin = new Date(dateTimeFinStr);

                console.log('📅 Date début parsed:', dateDebut);
                console.log('📅 Date fin parsed:', dateFin);

                if (!isNaN(dateDebut.getTime()) && !isNaN(dateFin.getTime())) {
                    // Formatage réussi
                    heureDebut = dateDebut.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    heureFin = dateFin.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Format date
                    dateAffichee = dateDebut.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    });

                    // Durée
                    const dureeMs = dateFin - dateDebut;
                    dureeHeures = Math.round((dureeMs / (1000 * 60 * 60)) * 10) / 10;

                    // Statut
                    const now = new Date();
                    if (now > dateDebut && now < dateFin) {
                        statusClass = 'status-ongoing';
                        statusText = 'En cours';
                    } else if (now > dateFin) {
                        statusClass = 'status-completed';
                        statusText = 'Terminé';
                    }

                    console.log('✅ Dates parsées avec succès');
                } else {
                    console.warn('⚠️ Dates invalides après parsing');
                }
            } else {
                console.warn('⚠️ Propriétés date/heure manquantes:', {
                    date: session.date,
                    heureDebut: session.heureDebut,
                    heureFin: session.heureFin
                });
            }
        } catch (error) {
            console.error('❌ Erreur parsing dates:', error);
        }

        // Détermine le type
        const titreLower = titre.toLowerCase();
        const descLower = (description || "").toLowerCase();
        let typeClass = 'tag-theory';
        let typeLabel = 'Théorie';

        if (titreLower.includes('pratique') || descLower.includes('pratique') ||
            titreLower.includes('projet') || descLower.includes('projet') ||
            titreLower.includes('laboratoire') || descLower.includes('lab') ||
            titreLower.includes('machine learning') || descLower.includes('python')) {
            typeClass = 'tag-practice';
            typeLabel = 'Pratique';
        }

        // Crée le HTML de la carte
        card.innerHTML = `
        <div class="session-time">
            <div class="session-date">${dateAffichee}</div>
            <div>
                <span class="time">${heureDebut} - ${heureFin}</span>
                <span class="duration">${dureeHeures}h</span>
            </div>
        </div>
        <div class="session-details">
            <h4>${titre}</h4>
            ${description ? `<p class="session-desc">${description}</p>` : ''}
            ${formateurNom !== "Formateur non spécifié" ? `
            <div class="session-info">
                <i class="fas fa-user"></i>
                <span>${formateurNom}</span>
            </div>` : ''}
            ${salleNom !== "Salle non spécifiée" ? `
            <div class="session-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>${salleNom}</span>
            </div>` : ''}
            ${groupeNom ? `
            <div class="session-info">
                <i class="fas fa-users"></i>
                <span>${groupeNom}</span>
            </div>` : ''}
            <div class="session-tags">
                <span class="tag ${typeClass}">${typeLabel}</span>
                <span class="tag tag-mandatory">Obligatoire</span>
            </div>
        </div>
        <div class="session-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
    `;

        return card;
    }

    showMessage(text, type = 'info') {
        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            info: '#2196F3'
        };

        const icon = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        `;

        messageDiv.innerHTML = `
            <span style="font-size: 18px">${icon[type]}</span>
            <span>${text}</span>
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    async updateGroups(profile, groupes) {
        console.log('👥 Chargement des groupes...');

        const container = document.getElementById('groupsContainer');
        if (!container) return;

        try {
            // ESSAIE D'ABORD LES VRAIES DONNÉES
            let groups;
            try {
                // Utilise le bon endpoint
                const groupesEndpoint = `/etudiants/${profile.id}/groupes`;
                groups = await apiService.get(groupesEndpoint);
                console.log('✅ Groupes réels:', groups);

                if (!groups || groups.length === 0) {
                    throw new Error('Aucun groupe trouvé');
                }

            } catch (error) {
                console.log('⚠️ Groupes non disponibles, utilisation mock');
                groups = this.getMockGroups(profile);
            }

            // Affiche les groupes
            this.displayGroups(groups, container);

        } catch (error) {
            console.error('❌ Erreur chargement groupes:', error);
            this.displayNoGroups(container);
        }
    }

    // Nouvelle méthode pour afficher "pas de groupes"
    displayNoGroups(container) {
        container.innerHTML = `
        <div class="no-data">
            <i class="fas fa-user-plus"></i>
            <p>Vous n'êtes inscrit à aucun groupe</p>
            <a href="#" class="btn-primary" style="margin-top: 15px; display: inline-block;">
                <i class="fas fa-search"></i> Explorer les groupes
            </a>
        </div>
    `;
    }


    displayGroups(groups, container) {
        if (!groups || groups.length === 0) {
            this.displayNoGroups(container);
            return;
        }

        let html = '';

        groups.forEach(group => {
            // Structure réelle du Groupe :
            // id, nom, code, effectif, effectifMax, etc.

            const effectif = group.effectif || 0;
            const effectifMax = group.effectifMax || 25;
            const effectifPercent = Math.round((effectif / effectifMax) * 100);

            // Niveau basé sur le nom ou code
            let niveau = "Intermédiaire";
            let niveauColor = '#00B8E6';

            if (group.nom && group.nom.toLowerCase().includes('avancé')) {
                niveau = "Avancé";
                niveauColor = '#667eea';
            } else if (group.nom && group.nom.toLowerCase().includes('débutant')) {
                niveau = "Débutant";
                niveauColor = '#4CAF50';
            }

            // Progression mockée (à remplacer plus tard)
            const progression = Math.floor(Math.random() * 30) + 50; // 50-80%
            const sessionsRestantes = Math.floor(Math.random() * 10) + 5; // 5-15

            html += `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <h3 class="group-name">${group.nom || 'Groupe sans nom'}</h3>
                    <span class="group-code">${group.code || 'CODE'}</span>
                </div>
                
                <p class="group-description">${group.description || 'Aucune description disponible'}</p>
                
                <div class="group-stats">
                    <div class="group-stat">
                        <span class="stat-value" style="color: ${niveauColor}">${niveau.charAt(0)}</span>
                        <span class="stat-label">Niveau</span>
                    </div>
                    <div class="group-stat">
                        <span class="stat-value">${effectif}/${effectifMax}</span>
                        <span class="stat-label">Étudiants</span>
                    </div>
                    <div class="group-stat">
                        <span class="stat-value">${sessionsRestantes}</span>
                        <span class="stat-label">Sessions restantes</span>
                    </div>
                    <div class="group-stat">
                        <span class="stat-value">${progression}%</span>
                        <span class="stat-label">Progression</span>
                    </div>
                </div>
                
                <div class="group-progress">
                    <div class="progress-label">
                        <span>Taux de remplissage</span>
                        <span>${effectifPercent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${effectifPercent}%"></div>
                    </div>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
        this.addGroupCardEvents();
    }

    addGroupCardEvents() {
        const groupCards = document.querySelectorAll('.group-card');
        groupCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const groupId = card.getAttribute('data-group-id');
                console.log('👥 Clic sur groupe:', groupId);

                // Animation de feedback
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);

                // Redirection vers la page du groupe
                window.location.href = `../etudiant/groupe.html?id=${groupId}`;
            });
        });
    }

    // Méthode pour les sessions à venir
    updateNextSessions(sessions) {
        console.log('📅 Chargement des sessions à venir...');

        const container = document.getElementById('nextSessionsContainer');
        if (!container || !sessions || !Array.isArray(sessions)) return;

        try {
            // Trie par date et prend les 3 prochaines
            const nextSessions = this.getNextSessions(sessions, 3);
            this.displayNextSessions(nextSessions, container);

        } catch (error) {
            console.error('❌ Erreur chargement sessions:', error);
            container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <p>Impossible de charger les sessions</p>
            </div>
        `;
        }
    }

    getNextSessions(allSessions, limit = 3) {
        // Trie les sessions par date
        const sorted = [...allSessions].sort((a, b) => {
            try {
                const dateA = new Date(`${a.date}T${a.heureDebut}`);
                const dateB = new Date(`${b.date}T${b.heureDebut}`);
                return dateA - dateB;
            } catch (e) {
                return 0;
            }
        });

        // Filtre les sessions futures
        const now = new Date();
        const futureSessions = sorted.filter(session => {
            try {
                const sessionDate = new Date(`${session.date}T${session.heureDebut}`);
                return sessionDate > now;
            } catch (e) {
                return false;
            }
        });

        return futureSessions.slice(0, limit);
    }

    displayNextSessions(sessions, container) {
        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-check"></i>
                <p>Aucune session à venir</p>
                <p style="font-size: 14px; margin-top: 10px; opacity: 0.7;">
                    Profitez-en pour réviser !
                </p>
            </div>
        `;
            return;
        }

        let html = '';

        sessions.forEach(session => {
            // Formatage date et heure
            let dateStr = "Date indéfinie";
            let timeStr = "";

            try {
                if (session.date) {
                    const date = new Date(session.date);
                    dateStr = date.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    });

                    if (session.heureDebut && session.heureFin) {
                        const heureDebut = session.heureDebut.substring(0, 5);
                        const heureFin = session.heureFin.substring(0, 5);
                        timeStr = `${heureDebut} - ${heureFin}`;
                    }
                }
            } catch (e) {
                console.warn('Erreur formatage session:', e);
            }

            // Formateur
            let formateurStr = "";
            if (session.formateur) {
                if (typeof session.formateur === 'object') {
                    formateurStr = `${session.formateur.prenom || ''} ${session.formateur.nom || ''}`.trim();
                } else {
                    formateurStr = session.formateur;
                }
            }

            // Salle
            let salleStr = "";
            if (session.salle) {
                if (typeof session.salle === 'object') {
                    salleStr = session.salle.nom || "";
                } else {
                    salleStr = session.salle;
                }
            }

            // Type
            const isPractice = session.titre && (
                session.titre.toLowerCase().includes('pratique') ||
                session.titre.toLowerCase().includes('projet') ||
                session.titre.toLowerCase().includes('lab')
            );

            html += `
            <div class="session-card-compact" data-session-id="${session.sessionId}">
                <div class="session-time-header">
                    <div class="session-date">${dateStr}</div>
                    ${timeStr ? `<div class="session-hours">${timeStr}</div>` : ''}
                </div>
                
                <h4 class="session-title">${session.titre || 'Session'}</h4>
                
                <div class="session-details-compact">
                    ${formateurStr ? `
                    <div class="session-detail-item">
                        <i class="fas fa-user"></i>
                        <span>${formateurStr}</span>
                    </div>` : ''}
                    
                    ${salleStr ? `
                    <div class="session-detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${salleStr}</span>
                    </div>` : ''}
                </div>
                
                <div class="session-tags-compact">
                    <span class="tag-compact ${isPractice ? 'tag-practice' : 'tag-theory'}">
                        ${isPractice ? 'Pratique' : 'Théorie'}
                    </span>
                    <span class="tag-compact" style="background: #fff3e0; color: #e65100;">
                        <i class="fas fa-users"></i> Groupe
                    </span>
                </div>
            </div>
        `;
        });

        container.innerHTML = html;
    }
}

// Ajoute les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .no-sessions {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        margin: 20px 0;
    }
    
    .no-sessions i {
        font-size: 48px;
        color: #ddd;
        margin-bottom: 15px;
    }
    
    .no-sessions p {
        font-size: 16px;
        margin: 0;
    }
    
    .status-completed {
        background-color: #4CAF50 !important;
    }
`;
document.head.appendChild(style);

// Démarrer quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page chargée');
    new DashboardEtudiant();
});