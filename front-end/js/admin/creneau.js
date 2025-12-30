const API_CRENEAUX = 'http://localhost:8080/api/creneaux';


function openNewCreneauModal() {
    document.getElementById('creneauForm').reset();
    document.getElementById('creneauModal').classList.add('active');
}


window.openNewCreneauModal = openNewCreneauModal;

function closeCreneauModal() {
    document.getElementById('creneauModal').classList.remove('active');
}

function timeStringToMinutes24h(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

document.getElementById('creneauForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const debut = document.getElementById('creneauDebut').value;
    const fin = document.getElementById('creneauFin').value;
    const debutMinutes = timeStringToMinutes24h(debut);
    const finMinutes = timeStringToMinutes24h(fin);

    if (finMinutes <= debutMinutes) {
        alert("L'heure de fin doit être après l'heure de début");
        return;
    }


    const creneauData = {
        jourSemaine: document.getElementById('creneauJour').value,
        date: document.getElementById('creneauDate').value,
        heureDebut: debut,
        heureFin: fin,
        statut: 'LIBRE'
    };

    console.log('Créneau envoyé :', creneauData);

    try {
        const response = await fetch(API_CRENEAUX, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creneauData)
        });

        if (!response.ok) {
            throw new Error('Erreur création créneau');
        }

        const saved = await response.json();
        console.log('Créneau créé :', saved);

        closeCreneauModal();

        if (typeof loadCreneaux === 'function') {
            loadCreneaux();
        }

    } catch (err) {
        console.error('❌', err);
        alert('Erreur lors de la création du créneau');
    }
});
