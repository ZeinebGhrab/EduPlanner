function openAddModal() {
    currentSalleId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter une salle';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';

    const form = document.getElementById('salleForm');
    if (form) {
        form.reset();
    }

    document.getElementById('salleModal').classList.add('active');
}

function showToast(type, title, message) {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(toast);

    toast.style.animation = 'slideInRight 0.4s ease-out';

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function openEditModal(id) {
    const salle = salles.find(s => s.id === id);
    if (!salle) {
        showToast('error', 'Erreur', 'Salle non trouvée');
        return;
    }

    currentSalleId = id;
    document.getElementById('modalTitle').textContent = 'Modifier la salle';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';

    document.getElementById('nom').value = salle.nom;
    document.getElementById('capacite').value = salle.capacite;
    document.getElementById('batiment').value = salle.batiment;
    document.getElementById('type').value = salle.type;

    document.getElementById('salleModal').classList.add('active');
}

function closeModal() {
    document.getElementById('salleModal').classList.remove('active');
    currentSalleId = null;
}
function openDeleteModal(id, nom) {
    currentSalleId = id;
    const deleteSalleName = document.getElementById('deleteSalleName');
    if (deleteSalleName) {
        deleteSalleName.textContent = nom;
    }
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentSalleId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    const salleData = {
        nom: formData.get('nom').trim(),
        capacite: parseInt(formData.get('capacite')) || 0,
        batiment: formData.get('batiment').trim(),
        type: formData.get('type')
    };

    if (!salleData.nom) {
        showToast('error', 'Erreur', 'Le nom est requis');
        return;
    }

    if (salleData.capacite <= 0) {
        showToast('error', 'Erreur', 'La capacité doit être positive');
        return;
    }

    if (!salleData.batiment) {
        showToast('error', 'Erreur', 'Le bâtiment est requis');
        return;
    }

    if (!salleData.type) {
        showToast('error', 'Erreur', 'Le type est requis');
        return;
    }

    try {
        if (currentSalleId) {
            await updateSalle(currentSalleId, salleData);
            showToast('success', 'Succès', 'Salle modifiée avec succès');
        } else {
            await createSalle(salleData);
            showToast('success', 'Succès', 'Salle ajoutée avec succès');
        }

        await fetchSalles();
        closeModal();
    } catch (error) {
        showToast('error', 'Erreur', error.message || 'Erreur lors de l\'enregistrement');
    }
}

async function confirmDelete() {
    if (!currentSalleId) return;

    const salleNom = document.getElementById('deleteSalleName').textContent;

    try {
        await deleteSalleAPI(currentSalleId);
        await fetchSalles();
        closeDeleteModal();
        showToast('success', 'Succès', `"${salleNom}" a été supprimée`);
    } catch (error) {
        showToast('error', 'Erreur', error.message || 'Erreur lors de la suppression');
        closeDeleteModal();
    }
}
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;