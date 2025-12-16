import { API_BASE_URL } from './config.js';
import { showToast, showLoadingState, hideLoadingState, showSuccessState } from './toast.js';
import { switchTab } from './ui.js';

// Redirection selon le rôle
export function redirectToDashboard(role) {
    switch(role.toUpperCase()) { // pour éviter les problèmes de casse
        case 'ADMIN':
            window.location.href = '../admin-management/admin-dashboard.html';
            break;
        case 'FORMATEUR':
            window.location.href = '../instructor-management/instructor-dashbord.html';
            break;
        case 'ETUDIANT':
            window.location.href = '../student-managment/student-dashbord.html';
            break;
        default:
            window.location.href = '../dashboard/dashboard.html';
    }
}

// Gestion du login "passe-partout"
export async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        return showToast('error', 'Erreur', 'Tous les champs sont requis');
    }

    const roles = ['formateur', 'admin', 'etudiant'];

    try {
        let loggedIn = false;

        for (const role of roles) {
            const response = await fetch(`${API_BASE_URL}/${role}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                const normalizedRole = role.toUpperCase();
                localStorage.setItem('authToken', data.token); 
                localStorage.setItem('userRole', normalizedRole);
                redirectToDashboard(normalizedRole);
                loggedIn = true;
                break; // arrêter la boucle si login réussi
            }
        }

        if (!loggedIn) {
            showToast('error', 'Erreur', 'Identifiants invalides');
        }

    } catch (err) {
        console.error(err);
        showToast('error', 'Erreur', 'Problème de connexion au serveur');
    }
}


export async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('registerName')?.value.trim() || '';
    const email = document.getElementById('registerEmail')?.value.trim() || '';
    const telephone = document.getElementById('registerTelephone')?.value.trim() || '';
    const password = document.getElementById('registerPassword')?.value || '';
    const role = document.getElementById('registerRole')?.value || '';

    if (!fullName || !email || !telephone || !password || !role) {
        showToast('error', 'Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
    }

    const nameParts = fullName.split(' ');
    const nom = nameParts[nameParts.length - 1];
    const prenom = nameParts.slice(0, -1).join(' ') || nom;

    if (!validateRegistrationForm({ nom, prenom, email, telephone, password }, role)) return;

    const submitBtn = registerForm.querySelector('.btn-submit');
    showLoadingState(submitBtn);

    try {
        let endpoint = '';
        let requestBody = {};

        if (role === 'formateur') {
            const specialites = Array.from(document.querySelectorAll('#specialitesSection input[name="specialite"]:checked')).map(cb => cb.value);
            endpoint = `${API_BASE_URL}/formateurs`;
            requestBody = { nom, prenom, email, telephone, password, specialite: specialites.join(', '), matricule: generateMatricule('F'), actif: true };
        } else if (role === 'etudiant') {
            const niveau = document.getElementById('etudiantNiveau')?.value || '1';
            endpoint = `${API_BASE_URL}/etudiants`;
            requestBody = { nom, prenom, email, telephone, password, niveau, matricule: generateMatricule('E'), actif: true, groupes: [] };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        hideLoadingState(submitBtn);

        if (response.ok) {
            const userData = await response.json();

            if (role === 'formateur' && userData.id) {
                const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
                console.log('ID formateur:', userData.id);
                await createDisponibilites(userData.id, jours, new FormData(registerForm));
            }

            showSuccessState(submitBtn);
            showToast('success', 'Inscription réussie !', `Bienvenue ${prenom} ${nom} !`);

            setTimeout(() => {
                switchTab('login');
                document.getElementById('loginEmail').value = email;
                resetForm(registerForm);
            }, 2000);
        } else {
            const errorData = await response.text();
            throw new Error(errorData || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        hideLoadingState(submitBtn);
        console.error('Erreur d\'inscription:', error);
        showToast('error', 'Erreur d\'inscription', error.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
}


function validateRegistrationForm(data, role) {
    const { nom, prenom, email, telephone, password } = data;

    if (!nom || !prenom || !email || !telephone || !password || !role) {
        showToast('error', 'Erreur', 'Veuillez remplir tous les champs obligatoires');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('error', 'Erreur', 'Format d\'email invalide');
        return false;
    }

    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(telephone)) {
        showToast('error', 'Erreur', 'Format de téléphone invalide');
        return false;
    }

    if (password.length < 6) {
        showToast('error', 'Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }

    if (role === 'formateur') {
        const specialites = document.querySelectorAll('#specialitesSection input[name="specialite"]:checked');
        if (specialites.length === 0) {
            showToast('error', 'Erreur', 'Veuillez sélectionner au moins une spécialité');
            return false;
        }

        const joursSelectionnes = document.querySelectorAll('.jour-header input[type="checkbox"]:checked');
        if (joursSelectionnes.length === 0) {
            showToast('error', 'Erreur', 'Veuillez sélectionner au moins un jour de disponibilité');
            return false;
        }
    } else if (role === 'etudiant') {
        const niveauSelect = document.getElementById('etudiantNiveau');
        if (!niveauSelect || !niveauSelect.value) {
            showToast('error', 'Erreur', 'Veuillez sélectionner votre niveau d\'études');
            return false;
        }
    }

    return true;
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
}


function generateMatricule(prefix) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `${prefix}${year}${random}`;
}


async function createDisponibilites(formateurId, jours, formData) {
    try {
        for (const jour of jours) {
            const checkbox = document.getElementById(jour);
            if (checkbox && checkbox.checked) {
                const debut = formData.get(`${jour}_debut`) || '08:00';
                const fin = formData.get(`${jour}_fin`) || '17:00';
                
                await fetch(`${API_BASE_URL}/disponibilites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        formateurId: formateurId,
                        jourSemaine: jour.toUpperCase(),
                        heureDebut: debut,
                        heureFin: fin,
                        estDisponible: true
                    })
                });
            }
        }
    } catch (error) {
        console.error('Erreur lors de la création des disponibilités:', error);
    }
}