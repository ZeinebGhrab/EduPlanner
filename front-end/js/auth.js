// ==========================================
// VARIABLES GLOBALES
// ==========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const passwordToggles = document.querySelectorAll('.password-toggle');
const roleSelect = document.getElementById('registerRole');
const etudiantSection = document.getElementById('etudiantSection');
const specialitesSection = document.getElementById('specialitesSection');
const disponibilitesSection = document.getElementById('disponibilitesSection');
const loadingOverlay = document.getElementById('loadingOverlay');

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initEventListeners();
    initRealTimeValidation();
    initSections();
    initDisponibilites();
    showWelcomeAnimation();
}

function showWelcomeAnimation() {
    const logo = document.querySelector('.logo');
    logo.style.animation = 'bounceIn 1s ease-out';
}

// ==========================================
// GESTION DES ÉVÉNEMENTS
// ==========================================
function initEventListeners() {
    // Tab buttons
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Password toggle
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => togglePasswordVisibility(toggle));
    });

    // Role change
    roleSelect.addEventListener('change', handleRoleChange);

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Input animations
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ==========================================
// FONCTIONS PRINCIPALES
// ==========================================
function switchTab(tabName) {
    // Animation des boutons
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 8px 25px rgba(28, 199, 241, 0.4)';
        } else {
            btn.classList.remove('active');
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        }
    });

    // Animation des formulaires
    authForms.forEach(form => {
        if (form.id === tabName + 'Form') {
            form.classList.add('active');
            form.style.animation = 'formSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            form.classList.remove('active');
        }
    });

    // Mise à jour du header
    updateHeader(tabName);
}

function updateHeader(tabName) {
    const authTitle = document.querySelector('.auth-title');
    const authSubtitle = document.querySelector('.auth-subtitle');
    
    if (tabName === 'login') {
        authTitle.textContent = 'Bienvenue !';
        authSubtitle.textContent = 'Connectez-vous pour accéder à votre espace';
    } else {
        authTitle.textContent = 'Créer un compte';
        authSubtitle.textContent = 'Rejoignez-nous et commencez votre formation';
    }
    
    // Animation du header
    authTitle.style.animation = 'fadeIn 0.6s ease-out';
    authSubtitle.style.animation = 'fadeIn 0.6s ease-out 0.1s both';
}

function togglePasswordVisibility(toggle) {
    const targetId = toggle.dataset.target;
    const targetInput = document.getElementById(targetId);
    
    if (targetInput.type === 'password') {
        targetInput.type = 'text';
        toggle.innerHTML = '👁️‍🗨️';
        toggle.style.animation = 'bounceIn 0.3s ease-out';
    } else {
        targetInput.type = 'password';
        toggle.innerHTML = '👁️';
        toggle.style.animation = 'bounceIn 0.3s ease-out';
    }
}

function initSections() {
    // Cacher les sections spécifiques au départ
    etudiantSection.classList.add('section-hidden');
    specialitesSection.classList.add('section-hidden');
    disponibilitesSection.classList.add('section-hidden');
}

function initDisponibilites() {
    const joursCheckboxes = document.querySelectorAll('.jour-header input[type="checkbox"]');
    
    joursCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const jourName = this.value.toLowerCase();
            const container = document.getElementById(`${jourName}Container`);
            const debutInput = document.querySelector(`input[name="${jourName}_debut"]`);
            const finInput = document.querySelector(`input[name="${jourName}_fin"]`);
            
            if (container) {
                if (this.checked) {
                    container.classList.add('active');
                    container.style.animation = 'bounceIn 0.4s ease-out';
                } else {
                    container.classList.remove('active');
                }
            }
            
            if (debutInput && finInput) {
                debutInput.disabled = !this.checked;
                finInput.disabled = !this.checked;
            }
        });
        
        // Initialiser l'état des conteneurs
        const jourName = checkbox.value.toLowerCase();
        const container = document.getElementById(`${jourName}Container`);
        if (checkbox.checked && container) {
            container.classList.add('active');
        }
    });
}

function handleRoleChange() {
    const role = roleSelect.value;
    
    // Animation de transition
    roleSelect.style.animation = 'bounceIn 0.4s ease-out';
    
    setTimeout(() => {
        if (role === 'formateur') {
            showSection(specialitesSection);
            showSection(disponibilitesSection);
            hideSection(etudiantSection);
        } else if (role === 'etudiant') {
            showSection(etudiantSection);
            hideSection(specialitesSection);
            hideSection(disponibilitesSection);
        } else {
            hideSection(etudiantSection);
            hideSection(specialitesSection);
            hideSection(disponibilitesSection);
        }
    }, 200);
}

function showSection(section) {
    section.classList.remove('section-hidden');
    section.classList.add('section-visible');
}

function hideSection(section) {
    section.classList.remove('section-visible');
    section.classList.add('section-hidden');
}

// ==========================================
// VALIDATION EN TEMPS RÉEL
// ==========================================
function initRealTimeValidation() {
    // Validation email
    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.addEventListener('blur', validateEmail);
    });

    // Validation mot de passe
    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
        passwordInput.addEventListener('blur', validatePassword);
    }

    // Validation confirmation mot de passe
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    }

    // Validation téléphone
    const telephoneInput = document.getElementById('registerTelephone');
    if (telephoneInput) {
        telephoneInput.addEventListener('blur', validateTelephone);
    }

    // Validation nom
    const nameInput = document.getElementById('registerName');
    if (nameInput) {
        nameInput.addEventListener('blur', validateName);
    }

    // Validation niveau étudiant
    const niveauInput = document.getElementById('etudiantNiveau');
    if (niveauInput) {
        niveauInput.addEventListener('blur', validateEtudiantNiveau);
    }

    // Validation groupe étudiant
    const groupeInput = document.getElementById('etudiantGroupe');
    if (groupeInput) {
        groupeInput.addEventListener('blur', validateEtudiantGroupe);
    }
}

function validateEmail(e) {
    const input = e.target;
    const value = input.value.trim();
    const validationElement = document.getElementById(input.id + 'Validation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'L\'email est requis');
        markInputInvalid(input);
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        showValidationMessage(validationElement, 'error', 'Format d\'email invalide');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Email valide');
    markInputValid(input);
    return true;
}

function validatePassword(e) {
    const input = e.target;
    const value = input.value;
    const validationElement = document.getElementById(input.id + 'Validation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'Le mot de passe est requis');
        markInputInvalid(input);
        return false;
    }
    
    if (value.length < 6) {
        showValidationMessage(validationElement, 'error', 'Le mot de passe doit contenir au moins 6 caractères');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Mot de passe valide');
    markInputValid(input);
    return true;
}

function validatePasswordStrength(e) {
    const input = e.target;
    const value = input.value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!value) {
        strengthBar.className = 'strength-fill';
        strengthText.textContent = 'Force du mot de passe';
        strengthText.style.color = 'var(--gray)';
        return;
    }
    
    let strength = 0;
    
    if (value.length >= 6) strength += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength += 1;
    if (/\d/.test(value)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(value)) strength += 1;
    
    if (strength <= 1) {
        strengthBar.className = 'strength-fill weak';
        strengthText.textContent = 'Faible';
        strengthText.style.color = '#EF4444';
    } else if (strength <= 3) {
        strengthBar.className = 'strength-fill medium';
        strengthText.textContent = 'Moyen';
        strengthText.style.color = '#FFB800';
    } else {
        strengthBar.className = 'strength-fill strong';
        strengthText.textContent = 'Fort';
        strengthText.style.color = '#77ddbb';
    }
}

function validateConfirmPassword(e) {
    const input = e.target;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = input.value;
    const validationElement = document.getElementById(input.id + 'Validation');
    
    if (!confirmPassword) {
        showValidationMessage(validationElement, 'error', 'Veuillez confirmer votre mot de passe');
        markInputInvalid(input);
        return false;
    }
    
    if (password !== confirmPassword) {
        showValidationMessage(validationElement, 'error', 'Les mots de passe ne correspondent pas');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Les mots de passe correspondent');
    markInputValid(input);
    return true;
}

function validateTelephone(e) {
    const input = e.target;
    const value = input.value.trim();
    const validationElement = document.getElementById(input.id + 'Validation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'Le téléphone est requis');
        markInputInvalid(input);
        return false;
    }
    
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(value)) {
        showValidationMessage(validationElement, 'error', 'Format de téléphone invalide');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Téléphone valide');
    markInputValid(input);
    return true;
}

function validateName(e) {
    const input = e.target;
    const value = input.value.trim();
    const validationElement = document.getElementById(input.id + 'Validation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'Le nom est requis');
        markInputInvalid(input);
        return false;
    }
    
    if (value.length < 2) {
        showValidationMessage(validationElement, 'error', 'Le nom doit contenir au moins 2 caractères');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Nom valide');
    markInputValid(input);
    return true;
}

function validateEtudiantNiveau(e) {
    const input = e.target;
    const value = input.value;
    const validationElement = document.getElementById('etudiantNiveauValidation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'Le niveau est requis');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Niveau valide');
    markInputValid(input);
    return true;
}

function validateEtudiantGroupe(e) {
    const input = e.target;
    const value = input.value.trim();
    const validationElement = document.getElementById('etudiantGroupeValidation');
    
    if (!value) {
        showValidationMessage(validationElement, 'error', 'Le groupe est requis');
        markInputInvalid(input);
        return false;
    }
    
    if (value.length < 2) {
        showValidationMessage(validationElement, 'error', 'Le groupe doit contenir au moins 2 caractères');
        markInputInvalid(input);
        return false;
    }
    
    showValidationMessage(validationElement, 'success', 'Groupe valide');
    markInputValid(input);
    return true;
}

function markInputValid(input) {
    input.classList.add('valid');
    input.classList.remove('invalid');
    input.style.borderColor = '#77ddbb';
    input.style.boxShadow = '0 0 0 4px rgba(119, 221, 187, 0.1)';
    input.style.animation = 'bounceIn 0.4s ease-out';
}

function markInputInvalid(input) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    input.style.borderColor = '#EF4444';
    input.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
    input.style.animation = 'shake 0.5s ease-out';
}

// Animation shake pour les erreurs
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .validation-message.success {
        color: #77ddbb;
    }
    
    .validation-message.error {
        color: #EF4444;
    }
`;
document.head.appendChild(style);

function showValidationMessage(element, type, message) {
    if (!element) return;
    
    element.innerHTML = `${message}`;
    element.className = `validation-message ${type} show`;
}

// ==========================================
// GESTION DES FORMULAIRES
// ==========================================
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = loginForm.querySelector('.btn-submit');
    
    if (!email || !password) {
        showToast('error', 'Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    showLoadingState(submitBtn);
    
    // Simulation d'une requête API
    setTimeout(() => {
        hideLoadingState(submitBtn);
        showSuccessState(submitBtn);
        
        showToast('success', 'Connexion réussie !', `Bienvenue ${email}`);
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }, 2000);
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const telephone = document.getElementById('registerTelephone').value;
    const role = document.getElementById('registerRole').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = registerForm.querySelector('.btn-submit');
    
    // Validation de base
    if (!name || !email || !telephone || !role || !password || !confirmPassword) {
        showToast('error', 'Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('error', 'Erreur', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        showToast('error', 'Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    // Validation rôle spécifique
    if (role === 'formateur') {
        const specialites = document.querySelectorAll('input[name="specialite"]:checked');
        if (specialites.length === 0) {
            showToast('error', 'Erreur', 'Veuillez sélectionner au moins une spécialité');
            return;
        }
        
        // Validation des disponibilités
        const joursSelectionnes = document.querySelectorAll('.jour-header input[type="checkbox"]:checked');
        if (joursSelectionnes.length === 0) {
            showToast('error', 'Erreur', 'Veuillez sélectionner au moins un jour de disponibilité');
            return;
        }
    } else if (role === 'etudiant') {
        const niveau = document.getElementById('etudiantNiveau').value;
        const groupe = document.getElementById('etudiantGroupe').value;
        
        if (!niveau || !groupe) {
            showToast('error', 'Erreur', 'Veuillez remplir tous les champs étudiant');
            return;
        }
    }
    
    showLoadingState(submitBtn);
    
    // Simulation d'une requête API
    setTimeout(() => {
        hideLoadingState(submitBtn);
        showSuccessState(submitBtn);
        
        showToast('success', 'Inscription réussie !', `Bienvenue ${name} !`);
        
        setTimeout(() => {
            switchTab('login');
            document.getElementById('loginEmail').value = email;
            resetForm(registerForm);
        }, 2000);
    }, 2000);
}

function showLoadingState(button) {
    button.classList.add('loading');
    loadingOverlay.classList.add('active');
}

function hideLoadingState(button) {
    button.classList.remove('loading');
    loadingOverlay.classList.remove('active');
}

function showSuccessState(button) {
    button.classList.add('success');
}

function resetForm(form) {
    form.reset();
    form.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('valid', 'invalid');
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });
    form.querySelectorAll('.validation-message').forEach(msg => {
        msg.classList.remove('show');
    });
    
    // Réinitialiser les disponibilités
    document.querySelectorAll('.jour-disponibilite').forEach(container => {
        container.classList.remove('active');
    });
    document.querySelectorAll('.jour-header input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.value !== 'Lundi' && checkbox.value !== 'Mardi' && 
            checkbox.value !== 'Mercredi' && checkbox.value !== 'Jeudi' && 
            checkbox.value !== 'Vendredi') {
            checkbox.checked = false;
        }
    });
}

function handleKeyboardShortcuts(e) {
    if (e.altKey && e.key === 'l') {
        e.preventDefault();
        switchTab('login');
    }
    if (e.altKey && e.key === 'r') {
        e.preventDefault();
        switchTab('register');
    }
}


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
}