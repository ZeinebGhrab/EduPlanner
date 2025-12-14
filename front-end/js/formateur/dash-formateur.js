// Script pour les interactions du tableau de bord formateur
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

    // Actions sur les boutons de session
    document.querySelectorAll('.action-btn.primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const sessionCard = this.closest('.session-card');
            const sessionTitle = sessionCard.querySelector('h4').textContent;
            
            if (this.textContent.includes('Démarrer')) {
                console.log(`Démarrage de la session: ${sessionTitle}`);
                // Ici vous pouvez intégrer le lancement de la session
                this.innerHTML = '<i class="fas fa-stop"></i> Arrêter';
                this.classList.add('stop');
            } else if (this.textContent.includes('Arrêter')) {
                console.log(`Arrêt de la session: ${sessionTitle}`);
                this.innerHTML = '<i class="fas fa-play"></i> Démarrer';
                this.classList.remove('stop');
            }
        });
    });

    // Gestion des alertes
    document.querySelectorAll('.alert-action').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const alertItem = this.closest('.alert-item');
            const alertTitle = alertItem.querySelector('h4').textContent;
            
            console.log(`Action sur l'alerte: ${alertTitle}`);
            // Ici vous pouvez gérer les actions spécifiques
        });
    });

    // Actions rapides
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const actionTitle = this.querySelector('h4').textContent;
            console.log(`Action rapide: ${actionTitle}`);
            
            // Redirection ou ouverture de modals selon l'action
            switch(actionTitle) {
                case 'Créer une Session':
                    console.log('Ouverture du formulaire de création de session');
                    break;
                case 'Ajouter des Ressources':
                    console.log('Ouverture de l upload de ressources');
                    break;
                case 'Gérer les Présences':
                    console.log('Ouverture du module de présence');
                    break;
                case 'Voir les Statistiques':
                    console.log('Navigation vers les statistiques');
                    break;
                case 'Messagerie':
                    console.log('Ouverture de la messagerie');
                    break;
                case 'Évaluations':
                    console.log('Navigation vers les évaluations');
                    break;
            }
        });
    });

    // Animation des cartes au scroll
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
    document.querySelectorAll('.stat-card, .session-card, .alert-item, .upcoming-card, .activity-item, .action-card').forEach(el => {
        observer.observe(el);
    });

    // Mise à jour en temps réel des notifications
    function updateNotifications() {
        const notificationBadge = document.querySelector('.badge');
        const alertCount = document.querySelector('.alert-count');
        
        // Simulation de mise à jour
        setTimeout(() => {
            const newCount = Math.floor(Math.random() * 2) + 1;
            notificationBadge.textContent = parseInt(notificationBadge.textContent) + newCount;
            alertCount.textContent = `${parseInt(alertCount.textContent) + newCount} nouvelles`;
        }, 10000);
    }

    // Démarrer les mises à jour périodiques
    setInterval(updateNotifications, 30000);

    console.log('Tableau de bord formateur MyFormation chargé avec succès!');
});