// Script pour les interactions des formations
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

    // Filtrage des formations
    const filterTabs = document.querySelectorAll('.filter-tab');
    const formationCards = document.querySelectorAll('.formation-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Mise à jour des tabs actives
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filtrage des cartes
            formationCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const status = card.classList.contains(filter) ? 'block' : 'none';
                    card.style.display = status;
                }
            });
            
            console.log(`Filtre appliqué: ${filter}`);
        });
    });

    // Recherche de formations
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        formationCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.formation-description').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Actions sur les boutons des formations
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.formation-card');
            const formationTitle = card.querySelector('h3').textContent;
            const actionType = this.classList.contains('primary') ? 'action principale' : 'action secondaire';
            
            console.log(`${actionType} sur: ${formationTitle}`);
            
            // Ici vous pouvez ajouter la logique spécifique
            if (this.textContent.includes('Continuer')) {
                console.log(`Redirection vers la formation: ${formationTitle}`);
            } else if (this.textContent.includes('Certificat')) {
                console.log(`Téléchargement du certificat: ${formationTitle}`);
            }
        });
    });

    // Animation au scroll
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
    document.querySelectorAll('.formation-card, .stat-card').forEach(el => {
        observer.observe(el);
    });

    console.log('Page Formations MyFormation chargée avec succès!');
});