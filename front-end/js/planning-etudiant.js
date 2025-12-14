// Script pour les interactions du planning
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

    // Navigation entre les semaines
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const direction = this.textContent.includes('Précédente') ? -1 : 1;
            console.log(`Navigation: ${direction > 0 ? 'Semaine suivante' : 'Semaine précédente'}`);
            // Ici vous pouvez ajouter la logique de changement de semaine
        });
    });

    // Changement de vue
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            console.log(`Vue changée: ${this.textContent.trim()}`);
        });
    });

    // Interaction avec les événements du calendrier
    const calendarEvents = document.querySelectorAll('.calendar-event');
    calendarEvents.forEach(event => {
        event.addEventListener('click', function() {
            const sessionTitle = this.querySelector('h4').textContent;
            console.log(`Session cliquée: ${sessionTitle}`);
            // Ici vous pouvez ouvrir un modal avec les détails
        });
    });

    // Boutons de rejoindre les sessions
    const joinButtons = document.querySelectorAll('.join-btn');
    joinButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const sessionCard = this.closest('.session-card');
            const sessionTitle = sessionCard.querySelector('h4').textContent;
            console.log(`Rejoindre la session: ${sessionTitle}`);
            // Ici vous pouvez intégrer le lien de visioconférence
        });
    });

    console.log('Page de planning MyFormation chargée avec succès!');
});