// Script pour la gestion des sessions formateur
document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Gestion des vues (Calendrier/Liste)
    const viewButtons = document.querySelectorAll('.view-btn');
    const calendarView = document.getElementById('calendarView');
    const listView = document.getElementById('listView');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Mise à jour des boutons actifs
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Affichage de la vue correspondante
            if (view === 'calendar') {
                calendarView.classList.add('active');
                listView.classList.remove('active');
            } else {
                calendarView.classList.remove('active');
                listView.classList.add('active');
            }
            
            console.log(`Vue changée: ${view}`);
        });
    });

    // Filtrage des sessions
    const filters = {
        status: document.getElementById('statusFilter'),
        group: document.getElementById('groupFilter'),
        formation: document.getElementById('formationFilter')
    };

    Object.values(filters).forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    function applyFilters() {
        const status = filters.status.value;
        const group = filters.group.value;
        const formation = filters.formation.value;
        
        console.log(`Filtres appliqués - Statut: ${status}, Groupe: ${group}, Formation: ${formation}`);
        
        // Ici vous filtreriez les sessions en fonction des critères
        filterSessions(status, group, formation);
    }

    function filterSessions(status, group, formation) {
        const sessions = document.querySelectorAll('.session-item, .calendar-event');
        
        sessions.forEach(session => {
            let show = true;
            
            // Filtre par statut
            if (status !== 'all') {
                const sessionStatus = session.dataset.status;
                if (sessionStatus !== status) {
                    show = false;
                }
            }
            
            // Appliquer l'affichage
            session.style.display = show ? 'flex' : 'none';
            if (session.classList.contains('calendar-event')) {
                session.style.display = show ? 'block' : 'none';
            }
        });
        
        // Mettre à jour le compteur
        updateSessionsCount();
    }

    function updateSessionsCount() {
        const visibleSessions = document.querySelectorAll('.session-item[style=""]').length;
        const countElement = document.querySelector('.sessions-count h3');
        if (countElement) {
            countElement.textContent = `${visibleSessions} Sessions trouvées`;
        }
    }

    // Gestion des actions sur les sessions
    document.querySelectorAll('.action-btn.primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const sessionItem = this.closest('.session-item');
            const sessionTitle = sessionItem.querySelector('.session-title').textContent;
            
            if (this.textContent.includes('Démarrer')) {
                console.log(`Démarrage de la session: ${sessionTitle}`);
                // Logique de démarrage de session
                this.innerHTML = '<i class="fas fa-stop"></i> Arrêter';
                sessionItem.dataset.status = 'ongoing';
            } else if (this.textContent.includes('Arrêter')) {
                console.log(`Arrêt de la session: ${sessionTitle}`);
                // Logique d'arrêt de session
                this.innerHTML = '<i class="fas fa-play"></i> Démarrer';
                sessionItem.dataset.status = 'completed';
            }
        });
    });

    // Modal de création de session
    const createModal = document.getElementById('createSessionModal');
    const createBtn = document.getElementById('createSessionBtn');
    const closeModal = document.querySelector('.modal-close');

    createBtn.addEventListener('click', () => {
        createModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeModal.addEventListener('click', () => {
        createModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Fermer le modal en cliquant à l'extérieur
    createModal.addEventListener('click', (e) => {
        if (e.target === createModal) {
            createModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Navigation du calendrier
    const navButtons = document.querySelectorAll('.nav-btn');
    const calendarTitle = document.querySelector('.calendar-nav h2');
    
    let currentDate = new Date();
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.querySelector('.fa-chevron-left')) {
                currentDate.setMonth(currentDate.getMonth() - 1);
            } else {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            updateCalendarTitle();
            // Ici vous rechargeriez les événements du calendrier
            console.log(`Navigation vers: ${currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`);
        });
    });

    function updateCalendarTitle() {
        const options = { month: 'long', year: 'numeric' };
        calendarTitle.textContent = currentDate.toLocaleDateString('fr-FR', options);
    }

    // Interaction avec les événements du calendrier
    document.querySelectorAll('.calendar-event').forEach(event => {
        event.addEventListener('click', function() {
            const eventTitle = this.querySelector('.event-title').textContent;
            const eventTime = this.querySelector('.event-time').textContent;
            
            console.log(`Session cliquée: ${eventTitle} (${eventTime})`);
            // Ici vous pourriez ouvrir un modal avec les détails
        });
    });

    // Tri des sessions
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            console.log(`Tri appliqué: ${this.value}`);
            // Logique de tri des sessions
        });
    }

    // Animation des éléments au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, observerOptions);

    // Observer les éléments
    document.querySelectorAll('.session-item, .stat-card, .calendar-event').forEach(el => {
        observer.observe(el);
    });

    console.log('Page Mes Sessions Formateur chargée avec succès!');
});