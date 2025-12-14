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
// VARIABLES GLOBALES ET INITIALISATION
// ==========================================

let currentDate = new Date();
let currentView = 'week';
let courses = [];
let formateurs = [];
let salles = [];
let materiels = [];
let groupes = [];
let matieres = [];

// ==========================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDecorations();
    initializeData();
    initializeEventListeners();
    updateCalendarDisplay();
    updateQuickStats();
});

// ==========================================
// INITIALISATION DES DONNÉES
// ==========================================

function initializeData() {
    // Données de base pour les sélecteurs
    formateurs = [
        { id: 1, nom: 'M. Tounsi', specialite: 'Data Science, IA/ML' },
        { id: 2, nom: 'Mme Mhiri', specialite: 'Communication, Soft Skills' },
        { id: 3, nom: 'M. Ghorbel', specialite: 'IA, Traitement d\'Image' },
        { id: 4, nom: 'M. Feki', specialite: 'Cybersécurité, Réseaux' },
        { id: 5, nom: 'Mme Kallel', specialite: 'Anglais, Méthodologie' },
        { id: 6, nom: 'M. Ben Ammar', specialite: 'Développement Web, Mobile' },
        { id: 7, nom: 'Mme Ben Salah', specialite: 'Design UI/UX, Graphisme' }
    ];

    salles = [
        { id: 1, nom: 'Salle 12', capacite: 25 },
        { id: 2, nom: 'Salle 13', capacite: 30 },
        { id: 3, nom: 'Lab Info 1', capacite: 20 },
        { id: 4, nom: 'Lab Info 2', capacite: 20 },
        { id: 5, nom: 'Salle 14', capacite: 15 },
        { id: 6, nom: 'Salle 15', capacite: 40 },
        { id: 7, nom: 'Lab Cybersécurité', capacite: 12 }
    ];

    materiels = [
        { id: 1, nom: 'PC Portable', quantite: 15 },
        { id: 2, nom: 'Projecteur', quantite: 8 },
        { id: 3, nom: 'Tableau Blanc', quantite: 10 },
        { id: 4, nom: 'PC Gaming', quantite: 5 },
        { id: 5, nom: 'Serveurs GPU', quantite: 2 }
    ];

    groupes = [
        { id: 1, nom: 'DSI-2024-A', effectif: 25 },
        { id: 2, nom: 'DSI-2024-B', effectif: 23 },
        { id: 3, nom: 'WEB-2024-A', effectif: 20 },
        { id: 4, nom: 'IA-2024-A', effectif: 18 },
        { id: 5, nom: 'SEC-2024-A', effectif: 15 },
        { id: 6, nom: 'DESIGN-2024-A', effectif: 12 },
        { id: 7, nom: 'DATA-2024-A', effectif: 22 }
    ];

    matieres = [
        { id: 1, nom: 'Machine Learning', categorie: 'ia' },
        { id: 2, nom: 'Communication', categorie: 'communication' },
        { id: 3, nom: 'Intelligence Artificielle', categorie: 'ia' },
        { id: 4, nom: 'Cybersécurité', categorie: 'securite' },
        { id: 5, nom: 'Anglais Technique', categorie: 'anglais' },
        { id: 6, nom: 'Développement Web', categorie: 'web' },
        { id: 7, nom: 'Design UI/UX', categorie: 'design' }
    ];

    // Charger les cours depuis le localStorage (vide au début)
    loadCourses();
}

// ==========================================
// GESTION DES COURS - TABLE VIDE
// ==========================================

function loadCourses() {
    // Essayer de charger depuis le localStorage
    const savedCourses = localStorage.getItem('centreformation_courses');
    
    if (savedCourses) {
        courses = JSON.parse(savedCourses);
    } else {
        // TABLE VIDE - AUCUNE DONNÉE DE DÉMONSTRATION
        courses = [];
        saveCourses();
    }
}

function saveCourses() {
    localStorage.setItem('centreformation_courses', JSON.stringify(courses));
}

// ==========================================
// GESTION DES ÉVÉNEMENTS
// ==========================================

function initializeEventListeners() {
    // Navigation entre les semaines
    document.getElementById('prevWeek').addEventListener('click', previousWeek);
    document.getElementById('nextWeek').addEventListener('click', nextWeek);

    // Changement de vue (semaine/jour/mois)
    document.querySelectorAll('.view-option').forEach(option => {
        option.addEventListener('click', function() {
            changeView(this.dataset.view);
        });
    });

    // Boutons d'action du header
    document.getElementById('generatePlanning').addEventListener('click', generatePlanning);
    document.getElementById('printPlanning').addEventListener('click', printPlanning);
    document.getElementById('filterPlanning').addEventListener('click', showFilterModal);

    // Modal d'ajout/édition de cours
    document.getElementById('addCourseFab').addEventListener('click', showAddCourseModal);
    document.getElementById('closeCourseModal').addEventListener('click', hideCourseModal);
    document.getElementById('cancelCourse').addEventListener('click', hideCourseModal);
    document.getElementById('courseForm').addEventListener('submit', saveCourse);

    // Modal de suppression de cours
    document.getElementById('closeDeleteCourseModal').addEventListener('click', hideDeleteCourseModal);
    document.getElementById('cancelDeleteCourse').addEventListener('click', hideDeleteCourseModal);
    document.getElementById('confirmDeleteCourse').addEventListener('click', confirmDeleteCourse);

    // Gestion des créneaux vides (ajout de cours)
    document.querySelectorAll('.empty-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            const day = this.dataset.day;
            const timeRange = this.dataset.time;
            showAddCourseModalForSlot(day, timeRange);
        });
    });

    // Gestion du clic en dehors des modals pour les fermer
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            hideCourseModal();
            hideDeleteCourseModal();
        });
    });

    // Initialiser les sélecteurs du formulaire
    initializeFormSelects();
}

// ==========================================
// GESTION DU CALENDRIER ET DE LA NAVIGATION
// ==========================================

function previousWeek() {
    currentDate.setDate(currentDate.getDate() - 7);
    updateCalendarDisplay();
}

function nextWeek() {
    currentDate.setDate(currentDate.getDate() + 7);
    updateCalendarDisplay();
}

function changeView(view) {
    currentView = view;
    
    // Mettre à jour les boutons de vue active
    document.querySelectorAll('.view-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.view === view) {
            option.classList.add('active');
        }
    });

    updateCalendarDisplay();
}

function updateCalendarDisplay() {
    updateWeekDisplay();
    renderCourses();
    updateQuickStats();
}

function updateWeekDisplay() {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 4); // Lundi à vendredi

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const weekText = `Semaine du ${startOfWeek.toLocaleDateString('fr-FR', options)}`;
    
    document.getElementById('currentWeek').textContent = weekText;

    // Mettre à jour les dates des jours
    updateDayDates(startOfWeek);
}

function getStartOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer le lundi
    return new Date(date.setDate(diff));
}

function updateDayDates(startDate) {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    
    days.forEach((day, index) => {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + index);
        
        const dateElement = document.querySelector(`.${day} .day-date`);
        if (dateElement) {
            dateElement.textContent = currentDay.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    });
}

// ==========================================
// GESTION DES COURS - TABLE VIDE
// ==========================================

function saveCourses() {
    localStorage.setItem('centreformation_courses', JSON.stringify(courses));
}

function renderCourses() {
    // Nettoyer les cartes de cours existantes (sauf les créneaux vides)
    document.querySelectorAll('.course-card').forEach(card => {
        card.remove();
    });

    // Afficher les cours pour la semaine actuelle
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    courses.forEach(course => {
        const courseDate = new Date(course.date);
        if (courseDate >= startOfWeek && courseDate <= endOfWeek) {
            displayCourse(course);
        }
    });
}

function displayCourse(course) {
    const dayColumn = document.querySelector(`.day-column.${course.jour}`);
    if (!dayColumn) return;

    // Calculer la position et la hauteur basées sur l'heure
    const startMinutes = timeToMinutes(course.debut);
    const endMinutes = timeToMinutes(course.fin);
    const duration = endMinutes - startMinutes;
    
    // Créer la carte du cours
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    courseCard.dataset.courseId = course.id;
    courseCard.style.marginTop = `${((startMinutes - 480) / 60) * 120 + 0.5}rem`; // 8:00 = 480 minutes
    courseCard.style.height = `${(duration / 60) * 120 - 1}rem`;

    // Déterminer la couleur basée sur la catégorie
    const categoryColor = getCategoryColor(course.matiere);
    courseCard.style.borderLeftColor = categoryColor;

    courseCard.innerHTML = `
        <div class="course-time">${course.debut} - ${course.fin}</div>
        <div class="course-title">${course.nom}</div>
        <div class="course-details">
            <div class="detail-item">
                <i class="fas fa-user-tie"></i>
                <span>${course.formateur}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-door-open"></i>
                <span>${course.salle}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-laptop"></i>
                <span>${course.materiel}</span>
            </div>
        </div>
        <div class="course-actions">
            <button class="course-action-btn" data-action="edit" data-course-id="${course.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="course-action-btn" data-action="delete" data-course-id="${course.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Ajouter les écouteurs d'événements pour les boutons d'action
    courseCard.querySelector('[data-action="edit"]').addEventListener('click', function(e) {
        e.stopPropagation();
        editCourse(course.id);
    });

    courseCard.querySelector('[data-action="delete"]').addEventListener('click', function(e) {
        e.stopPropagation();
        showDeleteCourseModal(course.id);
    });

    // Clic sur la carte pour voir les détails
    courseCard.addEventListener('click', function() {
        showCourseDetails(course.id);
    });

    dayColumn.appendChild(courseCard);
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function getCategoryColor(matiere) {
    const matiereObj = matieres.find(m => m.nom === matiere);
    if (!matiereObj) return '#00B8E6';

    const colors = {
        'ia': '#8B5CF6',
        'web': '#06B6D4',
        'data': '#10B981',
        'securite': '#EF4444',
        'communication': '#F59E0B',
        'anglais': '#EC4899',
        'maths': '#6366F1',
        'methodologie': '#14B8A6',
        'design': '#F97316',
        'reseaux': '#8B5CF6'
    };

    return colors[matiereObj.categorie] || '#00B8E6';
}

// ==========================================
// MODAL D'AJOUT/ÉDITION DE COURS
// ==========================================

function showAddCourseModal() {
    const modal = document.getElementById('courseModal');
    const title = document.getElementById('modalCourseTitle');
    const submitText = document.getElementById('submitCourseText');

    title.textContent = 'Ajouter un cours';
    submitText.textContent = 'Enregistrer le cours';
    
    // Réinitialiser le formulaire
    document.getElementById('courseForm').reset();
    document.getElementById('courseForm').dataset.editId = '';
    
    // Définir la date par défaut sur aujourd'hui
    document.getElementById('courseDate').value = formatDateForInput(new Date());
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showAddCourseModalForSlot(day, timeRange) {
    showAddCourseModal();
    
    // Pré-remplir le jour et l'horaire
    const [startTime, endTime] = timeRange.split('-');
    document.getElementById('courseDay').value = day;
    document.getElementById('courseStart').value = startTime;
    document.getElementById('courseEnd').value = endTime;

    // Déterminer la date basée sur le jour de la semaine actuelle
    const dayIndex = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'].indexOf(day);
    if (dayIndex !== -1) {
        const startOfWeek = getStartOfWeek(currentDate);
        const courseDate = new Date(startOfWeek);
        courseDate.setDate(startOfWeek.getDate() + dayIndex);
        
        document.getElementById('courseDate').value = formatDateForInput(courseDate);
    }
}

function editCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById('courseModal');
    const title = document.getElementById('modalCourseTitle');
    const submitText = document.getElementById('submitCourseText');

    title.textContent = 'Modifier le cours';
    submitText.textContent = 'Mettre à jour le cours';
    
    // Remplir le formulaire avec les données du cours
    document.getElementById('courseName').value = course.nom;
    document.getElementById('courseFormateur').value = course.formateur;
    document.getElementById('courseSalle').value = course.salle;
    document.getElementById('courseMateriel').value = course.materiel;
    document.getElementById('courseGroupe').value = course.groupe;
    document.getElementById('courseMatiere').value = course.matiere;
    document.getElementById('courseType').value = course.type;
    document.getElementById('courseDate').value = course.date;
    document.getElementById('courseDay').value = course.jour;
    document.getElementById('courseStart').value = course.debut;
    document.getElementById('courseEnd').value = course.fin;
    document.getElementById('courseNotes').value = course.notes || '';
    
    document.getElementById('courseForm').dataset.editId = courseId;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideCourseModal() {
    const modal = document.getElementById('courseModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function saveCourse(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEdit = form.dataset.editId;
    
    const courseData = {
        nom: form.courseName.value,
        formateur: form.courseFormateur.value,
        salle: form.courseSalle.value,
        materiel: form.courseMateriel.value,
        groupe: form.courseGroupe.value,
        matiere: form.courseMatiere.value,
        type: form.courseType.value,
        date: form.courseDate.value,
        jour: form.courseDay.value,
        debut: form.courseStart.value,
        fin: form.courseEnd.value,
        notes: form.courseNotes.value
    };

    // Validation basique
    if (!courseData.nom || !courseData.formateur || !courseData.salle) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Vérifier les conflits
    const conflicts = checkForConflicts(courseData, isEdit);
    if (conflicts.length > 0) {
        showNotification('Conflit détecté! La salle est déjà occupée à cet horaire.', 'error');
        return;
    }

    if (isEdit) {
        // Mise à jour d'un cours existant
        const courseId = parseInt(isEdit);
        const courseIndex = courses.findIndex(c => c.id === courseId);
        if (courseIndex !== -1) {
            courses[courseIndex] = { ...courses[courseIndex], ...courseData };
            showNotification('Cours mis à jour avec succès!', 'success');
        }
    } else {
        // Ajout d'un nouveau cours
        const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
        courseData.id = newId;
        courses.push(courseData);
        showNotification('Cours ajouté avec succès!', 'success');
    }

    saveCourses();
    hideCourseModal();
    updateCalendarDisplay();
}

// ==========================================
// MODAL DE SUPPRESSION DE COURS
// ==========================================

let courseToDelete = null;

function showDeleteCourseModal(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    courseToDelete = courseId;
    
    const modal = document.getElementById('deleteCourseModal');
    const courseNameElement = document.getElementById('deleteCourseName');
    
    courseNameElement.textContent = course.nom;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideDeleteCourseModal() {
    const modal = document.getElementById('deleteCourseModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    courseToDelete = null;
}

function confirmDeleteCourse() {
    if (courseToDelete) {
        courses = courses.filter(c => c.id !== courseToDelete);
        saveCourses();
        updateCalendarDisplay();
        showNotification('Cours supprimé avec succès!', 'success');
    }
    hideDeleteCourseModal();
}

// ==========================================
// FONCTIONNALITÉS AVANCÉES
// ==========================================

function generatePlanning() {
    showNotification('Génération du planning en cours...', 'info');
    
    // Simulation de génération de planning
    setTimeout(() => {
        showNotification('Planning généré avec succès!', 'success');
        updateQuickStats();
    }, 2000);
}

function printPlanning() {
    showNotification('Préparation de l\'export...', 'info');
    
    // Simulation d'export
    setTimeout(() => {
        window.print();
        showNotification('Planning exporté avec succès!', 'success');
    }, 1000);
}

function showFilterModal() {
    const filterValue = prompt('Filtrer par formateur, salle ou matière:');
    if (filterValue) {
        showNotification(`Filtre appliqué: ${filterValue}`, 'info');
        // Logique de filtrage à implémenter
    }
}

function showCourseDetails(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const detailsHtml = `
        <strong>${course.nom}</strong><br>
        <strong>Formateur:</strong> ${course.formateur}<br>
        <strong>Salle:</strong> ${course.salle}<br>
        <strong>Groupe:</strong> ${course.groupe}<br>
        <strong>Horaire:</strong> ${course.debut} - ${course.fin}<br>
        <strong>Type:</strong> ${getTypeLabel(course.type)}<br>
        ${course.notes ? `<strong>Notes:</strong> ${course.notes}` : ''}
    `;

    showNotification(detailsHtml, 'info', 5000);
}

// ==========================================
// UTILITAIRES ET HELPER FUNCTIONS
// ==========================================

function initializeFormSelects() {
    // Remplir le sélecteur des formateurs
    const formateurSelect = document.getElementById('courseFormateur');
    formateurSelect.innerHTML = '<option value="">Sélectionner un formateur</option>';
    formateurs.forEach(formateur => {
        const option = document.createElement('option');
        option.value = formateur.nom;
        option.textContent = formateur.nom;
        formateurSelect.appendChild(option);
    });

    // Remplir le sélecteur des salles
    const salleSelect = document.getElementById('courseSalle');
    salleSelect.innerHTML = '<option value="">Sélectionner une salle</option>';
    salles.forEach(salle => {
        const option = document.createElement('option');
        option.value = salle.nom;
        option.textContent = `${salle.nom} (${salle.capacite} places)`;
        salleSelect.appendChild(option);
    });

    // Remplir le sélecteur du matériel
    const materielSelect = document.getElementById('courseMateriel');
    materielSelect.innerHTML = '<option value="">Sélectionner du matériel</option>';
    materiels.forEach(materiel => {
        const option = document.createElement('option');
        option.value = materiel.nom;
        option.textContent = `${materiel.nom}`;
        materielSelect.appendChild(option);
    });

    // Remplir le sélecteur des groupes
    const groupeSelect = document.getElementById('courseGroupe');
    groupeSelect.innerHTML = '<option value="">Sélectionner un groupe</option>';
    groupes.forEach(groupe => {
        const option = document.createElement('option');
        option.value = groupe.nom;
        option.textContent = `${groupe.nom} - ${groupe.effectif} étudiants`;
        groupeSelect.appendChild(option);
    });

    // Remplir le sélecteur des matières
    const matiereSelect = document.getElementById('courseMatiere');
    matiereSelect.innerHTML = '<option value="">Sélectionner une matière</option>';
    matieres.forEach(matiere => {
        const option = document.createElement('option');
        option.value = matiere.nom;
        option.textContent = matiere.nom;
        matiereSelect.appendChild(option);
    });

    // Remplir le sélecteur du type de cours
    const typeSelect = document.getElementById('courseType');
    typeSelect.innerHTML = `
        <option value="">Sélectionner un type</option>
        <option value="cours">Cours théorique</option>
        <option value="tp">Travaux pratiques</option>
        <option value="td">Travaux dirigés</option>
        <option value="projet">Projet</option>
        <option value="atelier">Atelier</option>
        <option value="workshop">Workshop</option>
    `;

    // Remplir le sélecteur des jours
    const daySelect = document.getElementById('courseDay');
    daySelect.innerHTML = `
        <option value="">Sélectionner un jour</option>
        <option value="lundi">Lundi</option>
        <option value="mardi">Mardi</option>
        <option value="mercredi">Mercredi</option>
        <option value="jeudi">Jeudi</option>
        <option value="vendredi">Vendredi</option>
    `;
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function getTypeLabel(type) {
    const types = {
        'cours': 'Cours théorique',
        'tp': 'Travaux pratiques',
        'td': 'Travaux dirigés',
        'projet': 'Projet',
        'examen': 'Examen',
        'workshop': 'Workshop',
        'atelier': 'Atelier'
    };
    return types[type] || type;
}

function updateQuickStats() {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const weekCourses = courses.filter(course => {
        const courseDate = new Date(course.date);
        return courseDate >= startOfWeek && courseDate <= endOfWeek;
    });

    // Mettre à jour les statistiques
    document.querySelector('.quick-stats .stat-item:nth-child(1) .stat-number').textContent = weekCourses.length;
    
    const uniqueFormateurs = new Set(weekCourses.map(c => c.formateur));
    document.querySelector('.quick-stats .stat-item:nth-child(2) .stat-number').textContent = uniqueFormateurs.size;
    
    // Calculer le taux d'occupation
    const totalHours = weekCourses.reduce((total, course) => {
        const start = timeToMinutes(course.debut);
        const end = timeToMinutes(course.fin);
        return total + (end - start) / 60;
    }, 0);
    
    const occupationRate = Math.min(95, Math.max(0, Math.round((totalHours / 45) * 100)));
    document.querySelector('.quick-stats .stat-item:nth-child(3) .stat-number').textContent = `${occupationRate}%`;
    
    document.querySelector('.quick-stats .stat-item:nth-child(4) .stat-number').textContent = `${Math.round(totalHours)}h`;
    
    // Total étudiants (basé sur les groupes des cours de la semaine)
    const totalEtudiants = weekCourses.reduce((total, course) => {
        const groupe = groupes.find(g => g.nom === course.groupe);
        return total + (groupe ? groupe.effectif : 0);
    }, 0);
    document.querySelector('.quick-stats .stat-item:nth-child(5) .stat-number').textContent = totalEtudiants;
    
    // Taux de présence (simulé)
    const presenceRate = weekCourses.length > 0 ? Math.min(95, Math.max(85, 100 - (weekCourses.length * 0.5))) : 0;
    document.querySelector('.quick-stats .stat-item:nth-child(6) .stat-number').textContent = `${presenceRate}%`;
}

function showNotification(message, type = 'info', duration = 3000) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `toast ${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: white;
        padding: 1.2rem 1.8rem;
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 3000;
        animation: slideInRight 0.4s ease-out;
        max-width: 400px;
    `;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };

    notification.innerHTML = `
        <i class="${icons[type]}" style="color: ${colors[type]}; font-size: 1.2rem;"></i>
        <div class="toast-content">
            <p style="margin: 0; font-weight: 600; color: var(--dark);">${message}</p>
        </div>
    `;

    document.body.appendChild(notification);

    // Supprimer après la durée spécifiée
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, duration);
}

// ==========================================
// GESTION DES CONFLITS ET VALIDATIONS
// ==========================================

function checkForConflicts(newCourse, editingCourseId = null) {
    const conflicts = courses.filter(course => {
        if (editingCourseId && course.id === editingCourseId) return false;
        
        return course.date === newCourse.date &&
               course.salle === newCourse.salle &&
               timeOverlap(
                   course.debut, course.fin,
                   newCourse.debut, newCourse.fin
               );
    });

    return conflicts;
}

function timeOverlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    
    return (s1 < e2 && e1 > s2);
}

// ==========================================
// STYLES DYNAMIQUES POUR LES NOTIFICATIONS
// ==========================================

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(notificationStyles);

// ==========================================
// SAUVEGARDE ET CHARGEMENT AUTOMATIQUE
// ==========================================

window.addEventListener('beforeunload', function() {
    saveCourses();
});

// ==========================================
// EXPORT DES FONCTIONS POUR DÉBOGAGE
// ==========================================

window.planningApp = {
    courses,
    formateurs,
    salles,
    materiels,
    groupes,
    matieres,
    currentDate,
    addCourse: showAddCourseModal,
    refresh: updateCalendarDisplay
};