// ==========================================
// INITIALISATION DES ÉLÉMENTS DÉCORATIFS
// ==========================================

function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    
    // Ajouter les éléments décoratifs manquants
    const decorations = `
        <!-- Diamond -->
        <div class="deco-diamond"></div>
        
        <!-- Circles -->
        <div class="deco-circle"></div>
        <div class="deco-circle-2"></div>
        <div class="deco-circle-3"></div>
        
        <!-- Plus signs -->
        <div class="deco-plus"></div>
        <div class="deco-plus-2"></div>
        <div class="deco-plus-3"></div>
        
        <!-- Grid patterns -->
        <div class="grid-pattern"></div>
        <div class="grid-pattern-2"></div>
        
        <!-- Lines -->
        <div class="line-deco line-deco-1"></div>
        <div class="line-deco line-deco-2"></div>
        <div class="line-deco line-deco-3"></div>
        <div class="line-deco line-deco-4"></div>
    `;
    
    bgShapes.innerHTML += decorations;
}

// ==========================================
// INITIALISATION PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDecorations();
    
    // Animation des cartes de statistiques au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer les éléments à animer
    document.querySelectorAll('.stat-card, .chart-container').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });

    // Effet de parallaxe sur les shapes de fond
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.shape');
        
        shapes.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            shape.style.transform = `translateY(${yPos}px)`;
        });
    });

    // Animation au survol des barres
    const barItems = document.querySelectorAll('.bar-item');
    barItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Mise à jour en temps réel des statistiques (simulation)
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + (element.textContent.includes('%') ? '%' : '');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Animer les valeurs des statistiques au chargement
    setTimeout(() => {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const currentValue = parseInt(stat.textContent);
            if (!isNaN(currentValue)) {
                animateValue(stat, 0, currentValue, 2000);
            }
        });
    }, 1000);

    // Effet de confetti pour les succès
    function createConfetti() {
        const colors = ['#00B8E6', '#10B981', '#A78BFA', '#FFB800', '#FF1B6B'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 2px;
                top: -10px;
                left: ${Math.random() * 100}vw;
                opacity: 0.8;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(confetti);
            
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight}px) rotate(${360 * Math.random()}deg)`, opacity: 0 }
            ], {
                duration: 2000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
            });
            
            animation.onfinish = () => confetti.remove();
        }
    }

    // Responsive menu pour mobile
    function initMobileMenu() {
        const menuBtn = document.querySelector('.menu-btn');
        const nav = document.querySelector('nav');
        
        if (window.innerWidth <= 768) {
            menuBtn.style.display = 'flex';
            nav.style.display = 'none';
            
            menuBtn.addEventListener('click', function() {
                nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
                if (nav.style.display === 'flex') {
                    nav.style.cssText = `
                        display: flex;
                        position: fixed;
                        top: 80px;
                        left: 0;
                        right: 0;
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(20px);
                        flex-direction: column;
                        padding: 2rem;
                        gap: 1.5rem;
                        box-shadow: var(--shadow-lg);
                        z-index: 999;
                    `;
                }
            });
        } else {
            menuBtn.style.display = 'none';
            nav.style.display = 'flex';
            nav.style.cssText = '';
        }
    }

    initMobileMenu();
    window.addEventListener('resize', initMobileMenu);

    console.log('📊 Tableau de bord statistiques initialisé avec succès!');
    console.log('🎨 Arrière-plan décoratif chargé avec tous les éléments!');
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

// Fonction pour créer des notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid var(--${type === 'success' ? 'green' : type === 'error' ? 'danger' : 'primary-blue'});
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
               style="color: var(--${type === 'success' ? 'green' : type === 'error' ? 'danger' : 'primary-blue'})"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Animation pour le slide des notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);