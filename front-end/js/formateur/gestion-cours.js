// gestion-cours.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser toutes les fonctionnalités
    animateCourseCards();
    setupFilters();
    setupActionButtons();
    setupMaterialRequests();
    setupProblemReporting();
    
    // Fermer les modals avec la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});

function animateCourseCards() {
    const cards = document.querySelectorAll('.course-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function setupFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            filterCourses();
        });
    });
}

function setupActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const courseCard = this.closest('.course-card');
            const courseTitle = courseCard.querySelector('.course-title').textContent;
            
            handleCourseAction(action, courseTitle, courseCard);
        });
    });
}

// ==========================================
// GESTION DES DEMANDES DE MATÉRIEL
// ==========================================
function setupMaterialRequests() {
    const requestButtons = document.querySelectorAll('.btn-request-material');
    const materialModal = document.getElementById('materialModal');
    const materialCloseModal = materialModal.querySelector('.close-modal');
    const materialCancelBtn = materialModal.querySelector('.btn-cancel');
    const materialForm = document.getElementById('materialForm');
    const materialUrgencyOptions = materialModal.querySelectorAll('.urgency-option');
    
    // Ouvrir le modal de demande de matériel
    requestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            const courseTitle = this.getAttribute('data-course-title');
            openMaterialModal(courseId, courseTitle);
        });
    });
    
    // Fermer le modal
    function closeMaterialModal() {
        materialModal.style.display = 'none';
    }
    
    materialCloseModal.addEventListener('click', closeMaterialModal);
    materialCancelBtn.addEventListener('click', closeMaterialModal);
    
    // Fermer en cliquant en dehors
    materialModal.addEventListener('click', function(e) {
        if (e.target === materialModal) {
            closeMaterialModal();
        }
    });
    
    // Gestion de l'urgence
    materialUrgencyOptions.forEach(option => {
        option.addEventListener('click', function() {
            materialUrgencyOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            materialModal.querySelector('input[name="urgency"]').value = this.getAttribute('data-urgency');
        });
    });
    
    // Soumission du formulaire
    materialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitMaterialRequest();
    });
}

function openMaterialModal(courseId, courseTitle) {
    const modal = document.getElementById('materialModal');
    document.getElementById('modalCourseTitle').textContent = courseTitle;
    document.getElementById('courseId').value = courseId;
    modal.style.display = 'block';
    
    // Réinitialiser le formulaire
    document.getElementById('materialForm').reset();
    
    // Réinitialiser l'urgence à "Moyen"
    modal.querySelectorAll('.urgency-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-urgency') === 'medium') {
            opt.classList.add('selected');
        }
    });
    modal.querySelector('input[name="urgency"]').value = 'medium';
}

function submitMaterialRequest() {
    const formData = new FormData(document.getElementById('materialForm'));
    const requestData = {
        courseId: formData.get('courseId'),
        materialType: formData.get('materialType'),
        quantity: formData.get('quantity'),
        urgency: formData.get('urgency'),
        description: formData.get('description'),
        timestamp: new Date().toISOString()
    };
    
    // Simulation d'envoi au backend
    console.log('Demande de matériel envoyée:', requestData);
    
    // Sauvegarder dans le localStorage
    saveMaterialRequest(requestData);
    
    // Message de succès
    showNotification('✅ Votre demande de matériel a été envoyée avec succès !\n\nElle sera traitée par l\'administration dans les plus brefs délais.', 'success');
    
    // Fermer le modal
    document.getElementById('materialModal').style.display = 'none';
}

function saveMaterialRequest(requestData) {
    let requests = JSON.parse(localStorage.getItem('materialRequests') || '[]');
    requests.push({
        id: Date.now(),
        ...requestData,
        status: 'pending',
        submittedAt: new Date().toLocaleString('fr-FR')
    });
    localStorage.setItem('materialRequests', JSON.stringify(requests));
}

// ==========================================
// GESTION DES SIGNALEMENTS DE PROBLÈMES
// ==========================================
function setupProblemReporting() {
    const reportButtons = document.querySelectorAll('.btn-report-problem');
    const problemModal = document.getElementById('problemModal');
    const problemCloseModal = problemModal.querySelector('.close-modal');
    const problemCancelBtn = problemModal.querySelector('.btn-cancel');
    const problemForm = document.getElementById('problemForm');
    const problemUrgencyOptions = problemModal.querySelectorAll('.urgency-option');
    
    // Ouvrir le modal de signalement
    reportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            const courseTitle = this.getAttribute('data-course-title');
            const room = this.getAttribute('data-room');
            openProblemModal(courseId, courseTitle, room);
        });
    });
    
    // Fermer le modal
    function closeProblemModal() {
        problemModal.style.display = 'none';
    }
    
    problemCloseModal.addEventListener('click', closeProblemModal);
    problemCancelBtn.addEventListener('click', closeProblemModal);
    
    // Fermer en cliquant en dehors
    problemModal.addEventListener('click', function(e) {
        if (e.target === problemModal) {
            closeProblemModal();
        }
    });
    
    // Gestion de l'urgence
    problemUrgencyOptions.forEach(option => {
        option.addEventListener('click', function() {
            problemUrgencyOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            problemModal.querySelector('input[name="urgency"]').value = this.getAttribute('data-urgency');
        });
    });
    
    // Soumission du formulaire
    problemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitProblemReport();
    });
}

function openProblemModal(courseId, courseTitle, room) {
    const modal = document.getElementById('problemModal');
    document.getElementById('problemCourseTitle').textContent = courseTitle;
    document.getElementById('problemRoom').textContent = room;
    document.getElementById('problemCourseId').value = courseId;
    modal.style.display = 'block';
    
    // Réinitialiser le formulaire
    document.getElementById('problemForm').reset();
    
    // Réinitialiser l'urgence
    modal.querySelectorAll('.urgency-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-urgency') === 'medium') {
            opt.classList.add('selected');
        }
    });
    modal.querySelector('input[name="urgency"]').value = 'medium';
}

function submitProblemReport() {
    const formData = new FormData(document.getElementById('problemForm'));
    const reportData = {
        courseId: formData.get('courseId'),
        problemType: formData.get('problemType'),
        equipment: formData.get('equipment'),
        urgency: formData.get('urgency'),
        description: formData.get('description'),
        needsImmediateAction: formData.get('needsImmediateAction') === 'true',
        room: document.getElementById('problemRoom').textContent,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Simulation d'envoi au backend
    console.log('Signalement de problème envoyé:', reportData);
    
    // Sauvegarder dans le localStorage
    saveProblemReport(reportData);
    
    // Message de succès
    showNotification('🚨 Votre signalement a été envoyé !\n\nL\'équipe technique en a été informée et traitera votre demande rapidement.', 'warning');
    
    // Fermer le modal
    document.getElementById('problemModal').style.display = 'none';
    
    // Si action immédiate nécessaire, alerter l'administration
    if (reportData.needsImmediateAction) {
        alertAdminTeam(reportData);
    }
}

function saveProblemReport(reportData) {
    let reports = JSON.parse(localStorage.getItem('problemReports') || '[]');
    reports.push({
        id: Date.now(),
        ...reportData,
        reportedAt: new Date().toLocaleString('fr-FR')
    });
    localStorage.setItem('problemReports', JSON.stringify(reports));
}

function alertAdminTeam(reportData) {
    // Simulation d'alerte à l'équipe administrative
    console.log('🚨 ALERTE ADMINISTRATION - Problème critique signalé:', reportData);
    
    const adminAlert = {
        type: 'critical_problem',
        data: reportData,
        timestamp: new Date().toISOString(),
        priority: 'high'
    };
    
    // Sauvegarder l'alerte
    let alerts = JSON.parse(localStorage.getItem('adminAlerts') || '[]');
    alerts.push(adminAlert);
    localStorage.setItem('adminAlerts', JSON.stringify(alerts));
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function filterCourses() {
    const statusFilter = document.querySelector('select').value;
    const dateFilter = document.querySelectorAll('select')[1].value;
    const courses = document.querySelectorAll('.course-card');
    
    courses.forEach(course => {
        let showCourse = true;
        const status = course.querySelector('.status-badge').textContent.toLowerCase();
        const courseDate = course.querySelector('.course-date').textContent;
        
        // Filtre par statut
        if (statusFilter !== 'all') {
            const statusMap = {
                'planned': 'planifié',
                'completed': 'terminé', 
                'cancelled': 'annulé'
            };
            if (status !== statusMap[statusFilter]) {
                showCourse = false;
            }
        }
        
        // Filtre par date (simplifié)
        if (dateFilter !== 'all' && showCourse) {
            const today = new Date();
            const courseDateObj = parseCourseDate(courseDate);
            
            if (dateFilter === 'today' && !isToday(courseDateObj)) {
                showCourse = false;
            } else if (dateFilter === 'week' && !isThisWeek(courseDateObj)) {
                showCourse = false;
            } else if (dateFilter === 'month' && !isThisMonth(courseDateObj)) {
                showCourse = false;
            }
        }
        
        course.style.display = showCourse ? 'block' : 'none';
    });
}

function parseCourseDate(dateString) {
    const parts = dateString.split(' ');
    const months = {
        'Jan': 0, 'Fév': 1, 'Mar': 2, 'Avr': 3, 'Mai': 4, 'Juin': 5,
        'Juil': 6, 'Aoû': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Déc': 11
    };
    
    const day = parseInt(parts[1]);
    const month = months[parts[2]];
    const year = 2024;
    
    return new Date(year, month, day);
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isThisWeek(date) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    
    return date >= startOfWeek && date <= endOfWeek;
}

function isThisMonth(date) {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function handleCourseAction(action, courseTitle, courseCard) {
    const actions = {
        'Modifier': () => editCourse(courseTitle),
        'Présence': () => manageAttendance(courseTitle),
        'Annuler': () => cancelCourse(courseTitle, courseCard),
        'Détails': () => showCourseDetails(courseTitle),
        'Statistiques': () => showCourseStats(courseTitle),
        'Dupliquer': () => duplicateCourse(courseTitle),
        'Reprogrammer': () => rescheduleCourse(courseTitle),
        'Notifier': () => notifyStudents(courseTitle),
        'Supprimer': () => deleteCourse(courseTitle, courseCard),
        'Supports': () => manageCourseMaterials(courseTitle)
    };
    
    if (actions[action]) {
        actions[action]();
    } else {
        console.log('Action non gérée:', action);
    }
}

function editCourse(courseTitle) {
    alert(`Modification du cours: ${courseTitle}`);
}

function manageAttendance(courseTitle) {
    alert(`Gestion de la présence pour: ${courseTitle}`);
}

function cancelCourse(courseTitle, courseCard) {
    if (confirm(`Êtes-vous sûr de vouloir annuler le cours "${courseTitle}" ?`)) {
        const statusBadge = courseCard.querySelector('.status-badge');
        statusBadge.textContent = 'Annulé';
        statusBadge.className = 'status-badge status-cancelled';
        alert(`Le cours "${courseTitle}" a été annulé.`);
    }
}

function showCourseDetails(courseTitle) {
    alert(`Détails du cours: ${courseTitle}`);
}

function showCourseStats(courseTitle) {
    alert(`Statistiques du cours: ${courseTitle}`);
}

function duplicateCourse(courseTitle) {
    alert(`Duplication du cours: ${courseTitle}`);
}

function rescheduleCourse(courseTitle) {
    alert(`Reprogrammation du cours: ${courseTitle}`);
}

function notifyStudents(courseTitle) {
    alert(`Notification des étudiants pour: ${courseTitle}`);
}

function deleteCourse(courseTitle, courseCard) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le cours "${courseTitle}" ?`)) {
        courseCard.style.opacity = '0';
        setTimeout(() => {
            courseCard.remove();
            alert(`Le cours "${courseTitle}" a été supprimé.`);
        }, 300);
    }
}

function manageCourseMaterials(courseTitle) {
    alert(`Gestion des supports pour: ${courseTitle}`);
}

function closeAllModals() {
    const modals = document.querySelectorAll('.material-modal, .problem-modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message, type) {
    // Créer une notification toast
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 3000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
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

// Styles pour les animations de notification
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