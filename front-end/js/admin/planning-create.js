

function openPlanningModal() {
    document.getElementById("planningModal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closePlanningModal() {
    document.getElementById("planningModal").classList.remove("active");
    document.body.style.overflow = "auto";
}


document.getElementById("planningForm").addEventListener("submit", async e => {
    e.preventDefault();

    const semaine = document.getElementById("planningSemaine").value;
    if (!semaine) return alert("Semaine requise");


    try {
        const res = await fetch(`${API_BASE}/plannings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                semaine: semaine,
                statut: "BROUILLON"
            })
        });


        if (!res.ok) throw new Error("Erreur création planning");

        const planning = await res.json();
        currentPlanningId = planning.id;

        console.log(" Planning créé :", planning);

        closePlanningModal();
        alert("Planning créé avec succès");


        window.currentPlanningId = currentPlanningId;

    } catch (err) {
        console.error(err);
        alert("Impossible de créer le planning");
    }
});
window.openPlanningModal = function () {
    document.getElementById("planningModal").classList.add("active");
    document.body.style.overflow = "hidden";
};

window.closePlanningModal = function () {
    document.getElementById("planningModal").classList.remove("active");
    document.body.style.overflow = "auto";
};
