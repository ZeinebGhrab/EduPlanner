// Script pour les interactions du tableau de bord
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

    // Observer les cartes
    document.querySelectorAll('.stat-card, .schedule-card, .activity-item, .action-btn').forEach(el => {
        observer.observe(el);
    });

    // Gestion des clics sur les boutons d'action
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const actionText = this.querySelector('span').textContent;
            console.log(`Action: ${actionText}`);
            // Ici vous pouvez ajouter les fonctionnalités spécifiques
        });
    });

    console.log('Tableau de bord MyFormation chargé avec succès!');
});