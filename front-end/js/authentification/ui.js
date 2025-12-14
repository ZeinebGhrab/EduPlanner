import { tabButtons, authForms, passwordToggles, roleSelect, etudiantSection, specialitesSection, disponibilitesSection } from './config.js';
import { handleLogin, handleRegister } from './auth.js';

export function switchTab(tabName) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    authForms.forEach(form => form.classList.toggle('active', form.id === tabName + 'Form'));
}
export function togglePasswordVisibility(toggle) {
    const targetInput = document.getElementById(toggle.dataset.target);
    if (targetInput) {
        targetInput.type = targetInput.type === 'password' ? 'text' : 'password';
    }
}

export function handleRoleChange() {
    const role = roleSelect.value;
    if (role === 'formateur') {
        showSection(specialitesSection);
        showSection(disponibilitesSection);
        hideSection(etudiantSection);
        document.getElementById('etudiantNiveau').required = false; 
    } else if (role === 'etudiant') {
        showSection(etudiantSection);
        hideSection(specialitesSection);
        hideSection(disponibilitesSection);
        document.getElementById('etudiantNiveau').required = true; 
    } else {
        hideSection(etudiantSection);
        hideSection(specialitesSection);
        hideSection(disponibilitesSection);
        document.getElementById('etudiantNiveau').required = false; 
    }
}


export function showSection(section) { section?.classList.remove('section-hidden'); }
export function hideSection(section) { section?.classList.add('section-hidden'); }


export function checkExistingToken() {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (token && role) redirectToDashboard(role);
}

// ui.js
export function initDisponibilites() {
    const joursCheckboxes = document.querySelectorAll('.jour-header input[type="checkbox"]');
    
    joursCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const jourName = this.value.toLowerCase();
            const container = document.getElementById(`${jourName}Container`);
            const debutInput = document.querySelector(`input[name="${jourName}_debut"]`);
            const finInput = document.querySelector(`input[name="${jourName}_fin"]`);

            if (container) {
                container.classList.toggle('active', this.checked);
            }
            
            if (debutInput && finInput) {
                debutInput.disabled = !this.checked;
                finInput.disabled = !this.checked;
            }
        });

        // Initialiser l'état des conteneurs
        const jourName = checkbox.value.toLowerCase();
        const container = document.getElementById(`${jourName}Container`);
        if (checkbox.checked && container) container.classList.add('active');
    });
}


export function initEventListeners() {
    tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    passwordToggles.forEach(toggle => toggle.addEventListener('click', () => togglePasswordVisibility(toggle)));
    if (roleSelect) roleSelect.addEventListener('change', handleRoleChange);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
}


export function initSections() {
    if (etudiantSection) etudiantSection.classList.add('section-hidden');
    if (specialitesSection) specialitesSection.classList.add('section-hidden');
    if (disponibilitesSection) disponibilitesSection.classList.add('section-hidden');
}

export function showWelcomeAnimation() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.animation = 'bounceIn 1s ease-out';
    }
}
