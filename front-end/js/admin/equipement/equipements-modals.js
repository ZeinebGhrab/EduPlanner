function openAddModal() {
    currentEquipementId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un équipement';
    document.getElementById('submitBtnText').textContent = 'Enregistrer';

    const form = document.getElementById('equipementForm');
    if (form) {
        form.reset();
    }
    const typeOrdinateur = document.querySelector('input[name="type"][value="Ordinateur"]');
    const etatNeuf = document.querySelector('input[name="etat"][value="neuf"]');

    if (typeOrdinateur) typeOrdinateur.checked = true;
    if (etatNeuf) etatNeuf.checked = true;

    document.getElementById('equipementModal').classList.add('active');
}

function openEditModal(id) {
    const equipement = equipements.find(e => e.id === id);
    if (!equipement) {
        showToast('error', 'Erreur', 'Équipement non trouvé');
        return;
    }

    currentEquipementId = id;
    document.getElementById('modalTitle').textContent = 'Modifier l\'équipement';
    document.getElementById('submitBtnText').textContent = 'Mettre à jour';
    document.getElementById('nom').value = equipement.nom;
    document.getElementById('quantite').value = equipement.quantite;
    let typeRadio = document.querySelector(`input[name="type"][value="${equipement.type}"]`);
    if (!typeRadio) {
        typeRadio = document.querySelector('input[name="type"][value="Autre"]');
    }
    if (typeRadio) typeRadio.checked = true;
    let etatRadio = document.querySelector(`input[name="etat"][value="${equipement.etat}"]`);
    if (!etatRadio) {
        etatRadio = document.querySelector('input[name="etat"][value="bon"]');
    }
    if (etatRadio) etatRadio.checked = true;

    document.getElementById('equipementModal').classList.add('active');
}

function closeModal() {
    document.getElementById('equipementModal').classList.remove('active');
    currentEquipementId = null;
}

function openDeleteModal(id, nom) {
    currentEquipementId = id;
    document.getElementById('deleteEquipementName').textContent = nom;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    currentEquipementId = null;
}
// GESTION DU FORMULAIRE

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const typeInput = document.querySelector('input[name="type"]:checked');
    if (!typeInput) {
        showToast('error', 'Erreur', 'Veuillez sélectionner un type d\'équipement');
        return;
    }
    const etatInput = document.querySelector('input[name="etat"]:checked');
    if (!etatInput) {
        showToast('error', 'Erreur', 'Veuillez sélectionner un état');
        return;
    }

    const equipementData = {
        nom: formData.get('nom').trim(),
        type: typeInput.value,
        quantite: parseInt(formData.get('quantite')) || 0,
        etat: etatInput.value
    };
    if (!equipementData.nom) {
        showToast('error', 'Erreur', 'Le nom est requis');
        return;
    }

    if (equipementData.quantite < 0) {
        showToast('error', 'Erreur', 'La quantité ne peut pas être négative');
        return;
    }

    try {
        if (currentEquipementId) {
            await updateEquipement(currentEquipementId, equipementData);
            showToast('success', 'Succès', 'Équipement modifié avec succès');
        } else {
            await createEquipement(equipementData);
            showToast('success', 'Succès', 'Équipement ajouté avec succès');
        }
        await fetchEquipements();
        closeModal();
    } catch (error) {
        showToast('error', 'Erreur', error.message || 'Erreur lors de l\'enregistrement');
    }
}
// SUPPRESSION
async function confirmDelete() {
    if (!currentEquipementId) return;

    const equipementNom = document.getElementById('deleteEquipementName').textContent;

    try {
        await deleteEquipementAPI(currentEquipementId);
        await fetchEquipements();
        closeDeleteModal();

        showToast('success', 'Succès', `"${equipementNom}" a été supprimé`);
    } catch (error) {
        showToast('error', 'Erreur', error.message || 'Erreur lors de la suppression');
        closeDeleteModal();
    }
}