function openAddModal() {
    removeAllToasts();
    closeAllModals();
    currentEtudiantId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un étudiant';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';

    const form = document.getElementById('etudiantForm');
    if (form) {
        form.reset();
        const actifCheckbox = document.getElementById('actif');
        if (actifCheckbox) actifCheckbox.checked = true;

        const telephoneInput = document.getElementById('telephone');
        if (telephoneInput) {
            telephoneInput.placeholder = '+216 XX XXX XXX (obligatoire)';
            telephoneInput.required = true;
        }

        let passwordInput = document.getElementById('password');
        if (!passwordInput) {
            passwordInput = document.createElement('input');
            passwordInput.type = 'hidden';
            passwordInput.id = 'password';
            passwordInput.name = 'password';
            form.appendChild(passwordInput);
        }
        passwordInput.value = 'Etudiant123';
    }

    const modal = document.getElementById('etudiantModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}

function openEditModal(id) {
    removeAllToasts();
    closeAllModals();
    const etudiant = etudiants.find(e => e.id === id);
    if (!etudiant) {
        return;
    }
    currentEtudiantId = id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'étudiant';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';
    document.getElementById('nom').value = etudiant.nom || '';
    document.getElementById('prenom').value = etudiant.prenom || '';
    document.getElementById('email').value = etudiant.email || '';
    document.getElementById('telephone').value = etudiant.telephone || '';
    document.getElementById('matricule').value = etudiant.matricule || '';
    document.getElementById('niveau').value = etudiant.niveau || '';
    const actifCheckbox = document.getElementById('actif');
    if (actifCheckbox) actifCheckbox.checked = etudiant.actif !== false;

    const telephoneInput = document.getElementById('telephone');
    if (telephoneInput) {
        telephoneInput.placeholder = '+216 XX XXX XXX (obligatoire)';
        telephoneInput.required = true;
    }

    const form = document.getElementById('etudiantForm');
    let passwordInput = document.getElementById('password');
    if (!passwordInput) {
        passwordInput = document.createElement('input');
        passwordInput.type = 'hidden';
        passwordInput.id = 'password';
        passwordInput.name = 'password';
        form.appendChild(passwordInput);
    }
    passwordInput.value = etudiant.password || 'Etudiant123';

    const groupeSelect = document.getElementById('groupeSelect');
    if (groupeSelect) {
        groupeSelect.value = ''; 
        if (etudiant.groupes && etudiant.groupes.length > 0) {
            const groupeId = etudiant.groupes[0].id;
            const option = groupeSelect.querySelector(`option[value="${groupeId}"]`);
            if (option) {
                groupeSelect.value = groupeId;
            }
        }
    }
    const modal = document.getElementById('etudiantModal');
    if (modal) {
        modal.classList.add('active');
        
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}
function openDeleteModal(id) {
    removeAllToasts();
    closeAllModals();

    const etudiant = etudiants.find(e => e.id === id);
    if (!etudiant) {
        return;
    }

    currentEtudiantId = id;
    document.getElementById('deleteEtudiantName').textContent =
        `${etudiant.prenom} ${etudiant.nom}`;

    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}
async function openCreateGroupModal() {
    removeAllToasts();
    closeAllModals();
    const codeInput = document.getElementById('groupCode');
    if (codeInput) {
        try {
            showLoading(true, 'Génération du code...');
            const uniqueCode = await generateUniqueGroupCode();
            codeInput.value = uniqueCode;
        } catch (error) {
            console.error('Erreur génération code:', error);
            codeInput.value = 'GRP' + Date.now().toString().slice(-8);
        } finally {
            showLoading(false);
        }
    }

    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}
function closeModal() {
    removeAllToasts();

    const modal = document.getElementById('etudiantModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('etudiantForm');
    if (form) form.reset();
    currentEtudiantId = null;
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');
}
function closeDeleteModal() {
    removeAllToasts();

    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentEtudiantId = null;
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');
}
function closeCreateGroupModal() {
    removeAllToasts();

    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('createGroupForm');
    if (form) form.reset();
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
    document.body.style.overflow = 'auto';
    document.body.classList.remove('modal-open');
}
async function handleFormSubmit(e) {
    e.preventDefault();
    removeAllToasts();

    try {
        const formData = new FormData(e.target);

        const requiredFields = ['nom', 'prenom', 'email', 'matricule', 'niveau', 'telephone'];
        const missingFields = requiredFields.filter(field => !formData.get(field));

        if (missingFields.length > 0) {
            return;
        }

        const email = formData.get('email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return;
        }
        const telephone = formData.get('telephone');
        if (!/^\d{8,}$/.test(telephone.replace(/\D/g, ''))) {
            return;
        }
        const matricule = formData.get('matricule');
        if (!currentEtudiantId) {
            const matriculeExists = etudiants.some(e => e.matricule === matricule);
            if (matriculeExists) {
                return;
            }
        }

        const etudiantData = {
            nom: formData.get('nom'),
            prenom: formData.get('prenom'),
            email: email,
            telephone: telephone,
            matricule: matricule,
            niveau: formData.get('niveau'),
            actif: formData.get('actif') === 'on',
            password: formData.get('motdepasse') || "Etudiant123",
        };

        const groupeValue = formData.get('groupeSelect');
        if (groupeValue && groupeValue !== '' && groupeValue !== 'new') {
            const groupeId = parseInt(groupeValue);
            if (!isNaN(groupeId) && groupeId > 0) {
                const groupe = groupes.find(g => g.id === groupeId);
                if (groupe) {
                    etudiantData.groupes = [{
                        id: groupeId,
                        nom: groupe.nom,
                        code: groupe.code
                    }];
                }
            }
        }

        showLoading(true, currentEtudiantId ? 'Mise à jour...' : 'Création...');

        try {
            let url = API_ENDPOINTS.etudiants;
            let method = 'POST';

            if (currentEtudiantId) {
                url = `${API_ENDPOINTS.etudiants}/${currentEtudiantId}`;
                method = 'PUT';
            }

            const result = await apiRequest(url, method, etudiantData);

            await loadDataFromAPI();
            updateUI();
            updateConnectionStatus();

        } catch (apiError) {
            console.error('Erreur API détaillée:', apiError.message);

            if (apiError.code === 'DUPLICATE_ENTRY') {
                return;
            } else {
                if (currentEtudiantId) {
                    const index = etudiants.findIndex(e => e.id === currentEtudiantId);
                    if (index !== -1) {
                        etudiants[index] = { ...etudiants[index], ...etudiantData, id: currentEtudiantId };
                    }
                } else {
                    const newId = Math.max(...etudiants.map(e => e.id), 0) + 1;
                    etudiantData.id = newId;
                    etudiants.push(etudiantData);
                }
                updateUI();
                updateConnectionStatus();
            }
        }
        closeModal();
    } catch (error) {
        console.error('Erreur formulaire:', error);
    } finally {
        showLoading(false);
    }
}
async function handleCreateGroup(e) {
    e.preventDefault();
    removeAllToasts();
    try {
        const formData = new FormData(e.target);
        const groupName = formData.get('groupName');
        const groupCode = formData.get('groupCode');
        const effectifMax = parseInt(formData.get('effectifMax') || 20);

        if (!groupName || !groupCode) return;

        const groupeExiste = groupes.some(g =>
            g.nom === groupName || g.code === groupCode
        );
        if (groupeExiste) return;

        const groupeData = { nom: groupName, code: groupCode, effectifMax };
        showLoading(true, 'Création du groupe...');

        const result = await apiRequest(API_ENDPOINTS.groupes, 'POST', groupeData);

        if (result && result.id) {
            await loadDataFromAPI();
            updateUI();
            updateConnectionStatus();
            closeCreateGroupModal();
        } else {
            throw new Error('Réponse invalide du serveur');
        }

    } catch (apiError) {
        console.error('Erreur API:', apiError);
    } finally {
        showLoading(false);
    }
}

async function deleteEtudiant() {
    if (!currentEtudiantId) return;
    removeAllToasts();
    showLoading(true, 'Suppression...');

    try {
        await apiRequest(`${API_ENDPOINTS.etudiants}/${currentEtudiantId}`, 'DELETE');
        await loadDataFromAPI();
        updateUI();
        updateConnectionStatus();
        closeDeleteModal();
    } catch (apiError) {
        console.error('Erreur suppression API:', apiError);
    } finally {
        showLoading(false);
    }
}

function showLoading(isLoading, message = 'Chargement...') {
    let indicator = document.getElementById('loadingIndicator');

    if (isLoading) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.className = 'loading-indicator';
            indicator.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(indicator);
        } else {
            indicator.querySelector('span').textContent = message;
        }
    } else if (indicator) {
        indicator.remove();
    }
}
function removeAllToasts() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => toast.remove());
}
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.openCreateGroupModal = openCreateGroupModal;
window.closeAllModals = closeAllModals;
