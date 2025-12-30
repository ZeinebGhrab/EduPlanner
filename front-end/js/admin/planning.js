
let currentPlanningId = null;
let creneaux = [];
let materiels = [];

function authHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Initialisation de la page planning...");

        await loadCreneaux();
        fillWeekDates();
        await smartLoadPlanning();
        await loadSalles();
        await Promise.all([
            loadSessions(),
            loadFormateurs(),
            loadGroupes(),
            loadMateriels()
        ]);

        fillStatutSelect();
        setupEventListeners();
        setupFilters(); 

        console.log("Initialisation terminée. Planning ID:", currentPlanningId);

    } catch (error) {
        console.error("Erreur lors du chargement initial:", error);
        alert("Erreur de chargement des données. Veuillez rafraîchir la page.");
    }
});

async function loadSessions() {
    if (!currentPlanningId) {
        console.warn("Aucun planning disponible pour charger les sessions");
        return;
    }

    try {
        console.log(" Chargement des sessions pour le planning", currentPlanningId);

        const sessionsRes = await fetch(`${API_BASE}/sessions`, {
            headers: authHeaders()
        });

        if (sessionsRes.ok) {
            const allSessions = await sessionsRes.json();
            console.log(`Total ${allSessions.length} sessions en base`);

            const filteredSessions = allSessions.filter(session =>
                session.planningId === currentPlanningId ||
                session.planning?.id === currentPlanningId
            );

            console.log(`${filteredSessions.length} sessions pour le planning ${currentPlanningId}`);
            
            if (filteredSessions.length > 0) {
                renderSessions(filteredSessions);
            } else {
                renderSessions(allSessions);
            }
            setTimeout(applyFilters, 100);
        } else {
            console.error("Erreur lors du chargement des sessions:", sessionsRes.status);
        }
    } catch (error) {
        console.error("Erreur loadSessions:", error);
    }
}

let currentWeekOffset = 0; 

function fillWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    
    const monday = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setDate(monday.getDate() + (currentWeekOffset * 7));
    
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    
    document.querySelectorAll('.planning-header .day-column').forEach((col, index) => {
        const dateElement = col.querySelector('.day-date');
        if (dateElement) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            
            const jour = String(date.getDate()).padStart(2, '0');
            const mois = String(date.getMonth() + 1).padStart(2, '0');
            const annee = date.getFullYear();
            
            dateElement.textContent = `${jour}/${mois}/${annee}`;
        }
    });
    const periodElement = document.getElementById('currentPeriod');
    if (periodElement) {
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        
        const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        periodElement.textContent = `${formatDate(monday)} - ${formatDate(friday)}`;
    }
    
    console.log('Dates de la semaine remplies (offset:', currentWeekOffset, ')');
}

window.previousPeriod = function() {

    currentWeekOffset--;
    fillWeekDates();
   
};

window.nextPeriod = function() {
    currentWeekOffset++;
    fillWeekDates();
};

window.goToToday = function() {
    console.log('Retour à aujourd\'hui');
    currentWeekOffset = 0;
    fillWeekDates();
};

async function loadCreneaux() {
    try {
        console.log(" API_BASE:", API_BASE);
        
        const res = await fetch(`${API_BASE}/creneaux`, {
            method: 'GET',
            headers: authHeaders(),
            mode: 'cors'
        });

        if (res.ok) {
            creneaux = await res.json();
            console.log(` ${creneaux.length} créneaux chargés`);

            const select = document.getElementById("creneau_ids");
            if (select) {
                select.innerHTML = '<option value="">Sélectionnez un ou plusieurs créneaux</option>';
                creneaux.forEach(c => {
                    const date = c.date || 'Date non définie';
                    const jour = c.jourSemaine || '';
                    const heureDebut = c.heureDebut ? c.heureDebut.substring(0, 5) : '';
                    const heureFin = c.heureFin ? c.heureFin.substring(0, 5) : '';

                    const label = `${date} ${jour} ${heureDebut}-${heureFin}`;
                    select.innerHTML += `<option value="${c.id}">${label}</option>`;
                });
            }
        } else {
            console.warn("Impossible de charger les créneaux");
        }
    } catch (error) {
        console.error("Erreur loadCreneaux:", error);
    }
}

async function loadMateriels() {
    try {
        console.log("Chargement du matériel...");
        const res = await fetch(`${API_BASE}/materiels`, {
            headers: authHeaders()
        });

        if (res.ok) {
            materiels = await res.json();
            console.log(`${materiels.length} matériels chargés`);

            const select = document.getElementById("materiel_requis_ids");
            if (select) {
                select.innerHTML = '<option value="">Sélectionnez du matériel (optionnel)</option>';
                materiels.forEach(m => {
                    const type = m.type ? `(${m.type})` : '';
                    select.innerHTML += `<option value="${m.id}">${m.nom} ${type}</option>`;
                });
            }
        }
    } catch (error) {
        console.error(" Erreur loadMateriels:", error);
    }
}
async function loadSalles() {
    try {
        const res = await fetch(`${API_BASE}/salles`, {
            headers: authHeaders()
        });

        if (res.ok) {
            const salles = await res.json();
            console.log(` ${salles.length} salles chargées`);

            renderSalles(salles);

            await new Promise(resolve => setTimeout(resolve, 100));

            const allSlots = document.querySelectorAll('.time-slot');
            console.log(`${allSlots.length} slots créés dans le DOM`);

            const sessionSalleSelect = document.getElementById("salle_id");
            if (sessionSalleSelect) {
                sessionSalleSelect.innerHTML = '<option value="">Sélectionnez une salle</option>';
                salles.forEach(s => {
                    sessionSalleSelect.innerHTML += `<option value="${s.id}">${s.nom} (Capacité: ${s.capacite})</option>`;
                });
            }
            const filterSalleSelect = document.getElementById("filterSalle");
            if (filterSalleSelect) {
                filterSalleSelect.innerHTML = '<option value="all">Toutes les salles</option>';
                salles.forEach(s => {
                    filterSalleSelect.innerHTML += `<option value="${s.id}">${s.nom} (Cap. ${s.capacite})</option>`;
                });
                
                filterSalleSelect.addEventListener('change', applyFilters);
            }
        }
    } catch (error) {
        console.error("Erreur loadSalles:", error);
    }
}

async function loadFormateurs() {
    try {
        const res = await fetch(`${API_BASE}/formateurs`, {
            headers: authHeaders()
        });

        if (res.ok) {
            const formateurs = await res.json();
            console.log(` ${formateurs.length} formateurs chargés`);

            const select = document.getElementById("formateur_id");
            if (select) {
                select.innerHTML = '<option value="">Sélectionnez un formateur</option>';
                formateurs.forEach(f => {
                    const specialite = f.specialite ? `(${f.specialite})` : '';
                    select.innerHTML += `<option value="${f.id}">${f.nom} ${f.prenom} ${specialite}</option>`;
                });
            }
        }
    } catch (error) {
        console.error(" Erreur loadFormateurs:", error);
    }
}

async function loadGroupes() {
    try {
        const res = await fetch(`${API_BASE}/groupes`, {
            headers: authHeaders()
        });

        if (res.ok) {
            const groupes = await res.json();
            console.log(`${groupes.length} groupes chargés`);

            const select = document.getElementById("groupe_id");
            if (select) {
                select.innerHTML = '<option value="">Sélectionnez un groupe</option>';
                groupes.forEach(g => {
                    select.innerHTML += `<option value="${g.id}">${g.nom} (${g.effectif}/${g.effectifMax})</option>`;
                });
            }
        }
    } catch (error) {
        console.error("Erreur loadGroupes:", error);
    }
}

function renderSessions(sessions) {
    console.log("Rendu des sessions:", sessions);
    
    document.querySelectorAll(".time-slot").forEach(slot => {
        slot.innerHTML = "";
        slot.classList.remove("has-session");
    });

    if (!Array.isArray(sessions)) {
        console.warn("sessions n'est pas un tableau:", sessions);
        return;
    }

    if (sessions.length === 0) {
        console.warn("Aucune session à afficher");
        return;
    }
    if (!creneaux || creneaux.length === 0) {
        console.warn(' Aucun créneau chargé, impossible de placer les sessions');
        return;
    }

    console.log(`Affichage de ${sessions.length} sessions...`);

    sessions.forEach(session => {
  
        let sessionCreneaux = session.creneauxHoraires || 
                              session.creneaux || 
                              (session.creneau ? [session.creneau] : []);

        if (sessionCreneaux.length === 0) {
            console.warn(` Session ${session.id} sans créneaux`, session);
            return;
        }

        console.log(`Session ${session.id} - AVANT enrichissement:`, sessionCreneaux);

        sessionCreneaux = sessionCreneaux.map(creneau => {
            console.log(`Traitement créneau brut:`, creneau, `Type: ${typeof creneau}`);

            if (typeof creneau === 'number') {
                const fullCreneau = creneaux.find(c => c.id === creneau);
                if (fullCreneau) {
                    console.log(`Créneau ${creneau} enrichi:`, fullCreneau);
                    return fullCreneau;
                }
                console.warn(`Créneau ID ${creneau} non trouvé dans creneaux globaux`);
                return null;
            }

            if (typeof creneau === 'string' && creneau.includes(' - ')) {
                const [heureDebut, heureFin] = creneau.split(' - ').map(h => h.trim());
                console.log(` Parsing string: "${creneau}" → heureDebut: ${heureDebut}, heureFin: ${heureFin}`);
                const matchingCreneaux = creneaux.filter(c => {
                    const cHeureDebut = typeof c.heureDebut === 'string' ? c.heureDebut.substring(0, 5) : null;
                    const cHeureFin = typeof c.heureFin === 'string' ? c.heureFin.substring(0, 5) : null;
                    return cHeureDebut === heureDebut && cHeureFin === heureFin;
                });
                
                if (matchingCreneaux.length > 0) {
                    console.log(`Trouvé ${matchingCreneaux.length} créneaux pour "${creneau}":`, matchingCreneaux);
                    

                    if (session.dateDebut) {
                        const sessionDate = new Date(session.dateDebut);
                        const sessionDateStr = sessionDate.toISOString().split('T')[0]; 

                        const creneauParDate = matchingCreneaux.find(c => {
                            if (c.date) {
                                const creneauDateStr = typeof c.date === 'string' 
                                    ? c.date.split('T')[0] 
                                    : new Date(c.date).toISOString().split('T')[0];
                                return creneauDateStr === sessionDateStr;
                            }
                            return false;
                        });
                        
                        if (creneauParDate) {
                            console.log(` Créneau trouvé par DATE EXACTE (${sessionDateStr}):`, creneauParDate);
                            return creneauParDate;
                        }

                        const joursSemaine = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
                        const jourSession = joursSemaine[sessionDate.getDay()];
                        
                        const creneauParJour = matchingCreneaux.find(c => 
                            c.jourSemaine && c.jourSemaine.toUpperCase() === jourSession
                        );
                        
                        if (creneauParJour) {
                            console.log(` Créneau trouvé par JOUR (${jourSession}):`, creneauParJour);
                            return creneauParJour;
                        }
                        
                        console.warn(`Aucun créneau trouvé pour ${jourSession} (${sessionDateStr}), utilisation du premier`);
                    } else {
                        console.warn(`Session sans dateDebut, utilisation du premier créneau`);
                    }

                    return matchingCreneaux[0];
                }
                
                console.warn(`Aucun créneau trouvé pour "${creneau}"`);
                return null;
            }
            
            if (creneau && typeof creneau === 'object' && !creneau.jourSemaine && creneau.id) {
                const fullCreneau = creneaux.find(c => c.id === creneau.id);
                if (fullCreneau) {
                    console.log(`Créneau ${creneau.id} enrichi avec jourSemaine:`, fullCreneau);
                    return fullCreneau;
                }
                console.warn(`Créneau avec ID ${creneau.id} non trouvé dans creneaux globaux`);
            }

            if (creneau && creneau.jourSemaine) {
                console.log(`Créneau déjà complet:`, creneau);
                return creneau;
            }

            console.warn(`Créneau non enrichi (format inconnu):`, creneau);
            return null;
        }).filter(c => c != null); 

        console.log(` Session ${session.id} - APRÈS enrichissement: ${sessionCreneaux.length} créneaux`, sessionCreneaux);

        sessionCreneaux.forEach(creneau => {
            const slot = findSlotForCreneau(creneau, session);
            if (slot) {
                console.log(` Rendu session ${session.id} "${session.nomCours}" dans slot ${slot.dataset.jour} ${slot.dataset.heure} salle ${slot.dataset.salleId}`);
                renderSessionInSlot(session, slot, creneau);
            } else {
                console.error(`Slot non trouvé pour session ${session.id}:`, {
                    jour: creneau.jourSemaine,
                    heure: creneau.heureDebut,
                    salleId: session.salle?.id || session.salleId
                });
            }
        });
    });
    
    console.log(" Rendu des sessions terminé");
}

function findSlotForCreneau(creneau, session) {
    if (!creneau) {
        console.warn(" Créneau null ou undefined");
        return null;
    }

    let jour = creneau.jourSemaine;
    let heureDebut = creneau.heureDebut;

    const salleId = session?.salle?.id || session?.salleId;

    if (typeof heureDebut === 'string') {
        heureDebut = heureDebut.substring(0, 5);
    } else if (Array.isArray(heureDebut)) {
        heureDebut = `${String(heureDebut[0]).padStart(2, '0')}:${String(heureDebut[1]).padStart(2, '0')}`;
    } else if (typeof heureDebut === 'object' && heureDebut !== null) {
        if (heureDebut.hour !== undefined && heureDebut.minute !== undefined) {
            heureDebut = `${String(heureDebut.hour).padStart(2, '0')}:${String(heureDebut.minute).padStart(2, '0')}`;
        }
    }

    if (jour) {
        jour = jour.toUpperCase()
            .replace(/É/g, 'E')
            .replace(/È/g, 'E')
            .replace(/Ç/g, 'C')
            .replace(/À/g, 'A');
    }

    if (!jour || !heureDebut) {
        console.warn(` Créneau incomplet:`, {jour, heureDebut, creneau});
        return null;
    }

    let selector;
    if (salleId) {
        selector = `.time-slot[data-jour="${jour}"][data-heure="${heureDebut}"][data-salle-id="${salleId}"]`;
    } else {
        console.warn(`Session sans salle ID!`, session);
        selector = `.time-slot[data-jour="${jour}"][data-heure="${heureDebut}"]`;
    }

    console.log(`Recherche slot avec sélecteur: ${selector}`);
    const slot = document.querySelector(selector);
    
    if (slot) {
        console.log(`Slot trouvé:`, {
            jour: slot.dataset.jour,
            heure: slot.dataset.heure,
            salleId: slot.dataset.salleId
        });
    } else {
        console.error(`Aucun slot trouvé pour:`, {jour, heureDebut, salleId, selector});
        const allSlots = document.querySelectorAll('.time-slot');
        console.log(`Total slots disponibles: ${allSlots.length}`);
        if (allSlots.length > 0) {
            console.log(`Premier slot exemple:`, {
                jour: allSlots[0].dataset.jour,
                heure: allSlots[0].dataset.heure,
                salleId: allSlots[0].dataset.salleId
            });
        }
    }
    
    return slot;
}


function renderSessionInSlot(session, slot, creneau) {
    console.log(`renderSessionInSlot appelé:`, {
        sessionId: session.id,
        titre: session.nomCours,
        slotData: {jour: slot.dataset.jour, heure: slot.dataset.heure},
        creneau: creneau
    });

    const existingCard = slot.querySelector(`[data-session-id="${session.id}"]`);
    if (existingCard) {
        console.warn(`Session ${session.id} déjà présente dans ce slot, skip`);
        return;
    }
    
    slot.classList.add("has-session");
    
    const titre = session.nomCours || session.titre || "Session";
    const formateurNom = session.formateur?.nom || session.formateurNom || '-';
    const salleNom = session.salle?.nom || session.salleNom || '-';
    const groupeNom = session.groupe?.nom || session.groupeNom || '-';

    let heureDebut = creneau.heureDebut;
    let heureFin = creneau.heureFin;
    
    if (typeof heureDebut === 'string') {
        heureDebut = heureDebut.substring(0, 5);
    } else if (Array.isArray(heureDebut)) {
        heureDebut = `${String(heureDebut[0]).padStart(2, '0')}:${String(heureDebut[1]).padStart(2, '0')}`;
    }
    
    if (typeof heureFin === 'string') {
        heureFin = heureFin.substring(0, 5);
    } else if (Array.isArray(heureFin)) {
        heureFin = `${String(heureFin[0]).padStart(2, '0')}:${String(heureFin[1]).padStart(2, '0')}`;
    }
    
    console.log(` Affichage session "${titre}" dans slot [${slot.dataset.jour}][${slot.dataset.heure}]`);
    
    const statut = (session.statut || 'planifie').toLowerCase().replace(/é/g, 'e');
    
    slot.innerHTML = `
        <div class="session-card ${statut}" data-session-id="${session.id}">
            <div class="session-header">
                <strong class="session-title">${titre}</strong>
                <span class="session-time"> ${heureDebut} - ${heureFin}</span>
            </div>
            <div class="session-info-group">
                <div class="session-info"> ${formateurNom}</div>
                <div class="session-info"> ${salleNom}</div>
                <div class="session-info"> ${groupeNom}</div>
            </div>
            <div class="session-actions">
                <button class="btn-action btn-view" onclick="viewSession(${session.id}); event.stopPropagation();" title="Afficher les détails">
                     Voir
                </button>
                <button class="btn-action btn-edit" onclick="editSession(${session.id}); event.stopPropagation();" title="Modifier la session">
                    Modifier
                </button>
                <button class="btn-action btn-delete" onclick="deleteSession(${session.id}); event.stopPropagation();" title="Supprimer la session">
                    Supprimer
                </button>
            </div>
        </div>
    `;
    
    const sessionCard = slot.querySelector('.session-card');
    if (sessionCard) {
        console.log(`Session card insérée dans le DOM:`, {
            slotId: `${slot.dataset.jour}-${slot.dataset.heure}-${slot.dataset.salleId}`,
            cardHTML: sessionCard.outerHTML.substring(0, 100) + '...',
            visible: window.getComputedStyle(sessionCard).display !== 'none'
        });
    } else {
        console.error(` Session card NON trouvée dans le slot après insertion!`);
    }
}

function generateTimeSlots(salleId) {

    const heuresUniques = new Set();
    const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    
    creneaux.forEach(creneau => {
        if (creneau.heureDebut) {

            const heure = creneau.heureDebut.substring(0, 5); 
            heuresUniques.add(heure);
        }
    });
    

    const heuresSortees = Array.from(heuresUniques).sort();
    console.log(` Génération de ${heuresSortees.length} slots horaires:`, heuresSortees);
    console.log(`CSS Grid: repeat(5, 1fr) = 5 colonnes (5 jours)`);
    

    let slotsHTML = '';
    heuresSortees.forEach(heure => {
        jours.forEach(jour => {
            slotsHTML += `<div class="time-slot" data-jour="${jour}" data-heure="${heure}" data-salle-id="${salleId}"></div>\n`;
        });
    });
    
    console.log(`${heuresSortees.length} lignes × ${jours.length} colonnes = ${heuresSortees.length * jours.length} slots`);
    
    return slotsHTML;
}

function renderSalles(salles) {
    const grid = document.getElementById("planningGrid");
    const template = document.getElementById("salleRowTemplate");

    if (!grid || !template) {
        console.error(" Éléments de grille non trouvés");
        return;
    }

    document.querySelectorAll(".salle-row:not(.template)").forEach(row => row.remove());

    salles.forEach((salle, index) => {
        const row = template.cloneNode(true);
        row.id = `salle-${salle.id}`;
        row.classList.remove("template");
        row.removeAttribute('style'); 
        row.style.display = "grid"; 
        row.style.visibility = "visible";
        row.style.opacity = "1"; 

        row.querySelector(".salle-name").textContent = salle.nom;
        row.querySelector(".salle-capacity").textContent = `Capacité: ${salle.capacite}`;

        const timeGrid = row.querySelector(".time-grid");
        if (timeGrid) {
            timeGrid.removeAttribute('style'); 
            timeGrid.style.display = "grid"; 
            timeGrid.style.visibility = "visible";
            timeGrid.style.opacity = "1"; 
            
        
            const slotsHTML = generateTimeSlots(salle.id);
            timeGrid.innerHTML = slotsHTML;
            
            
            const slots = timeGrid.querySelectorAll(".time-slot");
            slots.forEach(slot => {
                slot.style.display = "block";
                slot.style.visibility = "visible";
                slot.style.opacity = "1";
            });
            
            if (index === 0) {
                console.log(`Salle "${salle.nom}" - ${slots.length} slots créés`);
            }
        }

        grid.appendChild(row);
    });

    console.log(`🏫 ${salles.length} salles rendues avec slots dynamiques`);
}

function setupEventListeners() {
    const form = document.getElementById("sessionForm");
    if (!form) {
        console.error("Formulaire non trouvé !");
        return;
    }

    console.log(" Écouteur de formulaire configuré");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log(" Début de la soumission du formulaire");

        if (!currentPlanningId) {
            alert("Veuillez d'abord créer ou sélectionner un planning");
            return;
        }

        let submitBtn = null;
        let originalText = '';

        try {
            const modal = document.getElementById("sessionModal");
            const editingSessionId = modal ? modal.dataset.editingSessionId : null;
            const isEditing = !!editingSessionId;
            
            console.log(isEditing ? `Mode édition - Session ID: ${editingSessionId}` : 'Mode création');


            submitBtn = document.getElementById("submitSessionBtn") ||
                form.querySelector('button[type="submit"]');

            if (!submitBtn) {
                console.error(" Bouton submit non trouvé !");
                throw new Error("Erreur d'interface - bouton manquant");
            }

            originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
            submitBtn.disabled = true;

            const validationErrors = validateForm();
            if (validationErrors.length > 0) {
                alert("Erreurs de validation:\n" + validationErrors.join("\n"));
                resetSubmitButton(submitBtn, originalText);
                return;
            }

            const sessionData = prepareSessionData();
            if (!sessionData) {
                resetSubmitButton(submitBtn, originalText);
                return;
            }

            console.log("Envoi des données:", sessionData);

            const url = isEditing 
                ? `${API_BASE}/sessions/${editingSessionId}`
                : `${API_BASE}/sessions`;
            const method = isEditing ? "PUT" : "POST";
            
            const response = await fetch(url, {
                method: method,
                headers: authHeaders(),
                body: JSON.stringify(sessionData)
            });

            resetSubmitButton(submitBtn, originalText);

            await handleResponse(response, sessionData, isEditing);

            if (isEditing && modal) {
                delete modal.dataset.editingSessionId;
                const modalTitle = modal.querySelector('.modal-header h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Créer une Session';
                }
            }

        } catch (error) {
            console.error(" Erreur lors de l'opération:", error);

            if (submitBtn) {
                resetSubmitButton(submitBtn, originalText);
            }

            showNotification(`Erreur: ${error.message}`, "error");
        }
    });
}

function validateForm() {
    const errors = [];

    const creneauSelect = document.getElementById("creneau_ids");
    const selectedCreneaux = Array.from(creneauSelect.selectedOptions)
        .map(opt => parseInt(opt.value))
        .filter(id => !isNaN(id));

    if (selectedCreneaux.length === 0) {
        errors.push("Veuillez sélectionner au moins un créneau");
    }

    const requiredFields = [
        { id: 'nomCours', name: 'Titre de la session' },
        { id: 'formateur_id', name: 'Formateur' },
        { id: 'salle_id', name: 'Salle' },
        { id: 'statut', name: 'Statut' }
    ];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            errors.push(`${field.name} est requis`);
        }
    });

    const duree = parseInt(document.getElementById("duree").value);
    if (isNaN(duree) || duree < 1 || duree > 8) {
        errors.push("La durée doit être entre 1 et 8 heures");
    }

    return errors;
}
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(monday.getDate()).padStart(2, '0');

    return `${year}-${month}-${dayOfMonth}`;
}

async function smartLoadPlanning() {
    try {

        const res = await fetch(`${API_BASE}/plannings`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error("Erreur chargement plannings");

        const plannings = await res.json();

        const aujourdhui = new Date();
        const lundi = getMonday(aujourdhui);
        const lundiProchain = getMonday(new Date(aujourdhui.setDate(aujourdhui.getDate() + 7)));

        console.log("Lundi cette semaine:", lundi);
        console.log("Lundi prochain:", lundiProchain);

        let planningTrouve = null;

        for (const planning of plannings) {
            if (planning.semaine === lundi || planning.semaine === lundiProchain) {
                planningTrouve = planning;
                break;
            }
        }

        if (planningTrouve) {
            currentPlanningId = planningTrouve.id;
            console.log(" Planning trouvé pour la semaine:", planningTrouve.semaine);
        } else {

            console.log("Aucun planning trouvé, création pour cette semaine...");

            if (creneaux.length > 0) {

                const creneauFutur = creneaux.find(c => c.date >= lundi);
                const datePlanning = creneauFutur ? creneauFutur.date : lundi;

                const createRes = await fetch(`${API_BASE}/plannings`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        nom: "Planning " + datePlanning,
                        statut: "EN_COURS",
                        semaine: datePlanning
                    })
                });

                if (createRes.ok) {
                    const newPlanning = await createRes.json();
                    currentPlanningId = newPlanning.id;
                    console.log("Planning créé pour date:", datePlanning);
                }
            } else {

                const createRes = await fetch(`${API_BASE}/plannings`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        nom: "Planning " + lundi,
                        statut: "EN_COURS",
                        semaine: lundi
                    })
                });

                if (createRes.ok) {
                    const newPlanning = await createRes.json();
                    currentPlanningId = newPlanning.id;
                    console.log("Planning créé pour cette semaine:", lundi);
                }
            }
        }

        const planningInput = document.getElementById("planning_id");
        if (planningInput && currentPlanningId) {
            planningInput.value = currentPlanningId;
        }

    } catch (error) {
        console.error("Erreur smartLoadPlanning:", error);

        await loadFirstPlanning();
    }
}


function prepareSessionData() {
    try {
        const selectedCreneauIds = Array.from(
            document.getElementById("creneau_ids").selectedOptions
        )
            .map(o => parseInt(o.value))
            .filter(id => !isNaN(id));

        if (selectedCreneauIds.length === 0) {
            alert("Veuillez sélectionner au moins un créneau");
            return null;
        }


        const materielRequisIds = Array.from(
            document.getElementById("materiel_requis_ids")?.selectedOptions || []
        )
            .map(o => parseInt(o.value))
            .filter(id => !isNaN(id));

        return {
            nomCours: document.getElementById("nomCours").value.trim(),
            duree: parseInt(document.getElementById("duree").value),
            statut: document.getElementById("statut").value,

            formateurId: parseInt(document.getElementById("formateur_id").value),
            salleId: parseInt(document.getElementById("salle_id").value),
            groupeId: parseInt(document.getElementById("groupe_id").value),
            planningId: currentPlanningId,

            creneauIds: selectedCreneauIds,
            materielRequisIds: materielRequisIds
        };



    } catch (e) {
        console.error(e);
        alert("Erreur préparation des données");
        return null;
    }
}


async function handleResponse(response, sessionData, isEditing = false) {
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    let responseData = null;
    if (isJson) {
        responseData = await response.json();
        console.log("Réponse reçue:", responseData);
    }

    if (response.status === 409) {
        console.log("Conflit détecté");

        if (responseData) {

            const conflits =
                responseData.conflits ||
                (Array.isArray(responseData) ? responseData : []);

            if (conflits.length > 0) {
                afficherConflits(conflits, sessionData);
            } else {
                showNotification("Conflit détecté mais sans détails", "warning");
            }
        } else {
            showNotification(" Conflit détecté", "warning");
        }
        return;
    }
    if (!response.ok) {
        const errorMsg = responseData?.message ||
            responseData?.error ||
            `Erreur ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
    }

    const successMsg = isEditing 
        ? "Session modifiée avec succès !" 
        : "Session créée avec succès !";
    
    console.log(successMsg);

    closeModal();
    document.getElementById("sessionForm").reset();
    await loadSessions();
    showNotification(successMsg, "success");
}

function resetSubmitButton(button, originalText = null) {
    if (!button) return;

    if (originalText) {
        button.innerHTML = originalText;
    } else {
        button.innerHTML = button.innerHTML.replace('fa-spinner fa-spin', 'fa-save');
    }

    button.disabled = false;
}

let pendingSessionData = null;

function afficherConflits(conflits, sessionData) {
    const warningBox = document.getElementById("conflictWarning");
    const messageDiv = warningBox.querySelector(".conflict-message");

    if (!warningBox || !messageDiv) {
        console.error(" Éléments de conflit non trouvés");
        return;
    }

    pendingSessionData = sessionData;

    if (!conflits || conflits.length === 0) {
        warningBox.style.display = "none";
        return;
    }

    warningBox.style.display = "flex";

    const conflictsHtml = conflits.map(c => {
        return `
            <div class="conflict-item">
                <div class="conflict-type">${c.type || 'Conflit'}</div>
                <div class="conflict-description">${c.description || 'Description non disponible'}</div>
                ${c.severite ? `<div class="conflict-severity">Sévérité: ${c.severite}/5</div>` : ''}
            </div>
        `;
    }).join('');

    const html = `
        <div class="conflict-header">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>${conflits.length} conflit(s) détecté(s)</strong>
        </div>
        <div class="conflict-list">
            ${conflictsHtml}
        </div>
        <div class="conflict-actions">
            <button class="btn btn-small btn-secondary" onclick="closeConflictWarning()">
                <i class="fas fa-edit"></i>
                Modifier la session
            </button>
            <button class="btn btn-small btn-warning" onclick="forcerCreationMalgreConflits()">
                <i class="fas fa-exclamation-circle"></i>
                Créer malgré les conflits
            </button>
        </div>
    `;

    messageDiv.innerHTML = html;
}

async function forcerCreationMalgreConflits() {
    if (!pendingSessionData) {
        alert("Aucune donnée de session en attente");
        return;
    }

    try {
        console.log("Tentative de création malgré les conflits...");

        const response = await fetch(`${API_BASE}/sessions`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(pendingSessionData)
        });

        if (response.ok) {
            closeConflictWarning();
            closeModal();
            await loadSessions();
            showNotification("Session créée (conflits ignorés)", "warning");
        } else if (response.status === 409) {
            const errorData = await response.json();
            showNotification("Impossible de créer - conflits persistants", "error");
            afficherConflits(errorData.conflits || [], pendingSessionData);
        } else {
            const error = await response.json();
            throw new Error(error.message || "Échec de la création");
        }
    } catch (error) {
        console.error("Erreur création forcée:", error);
        showNotification(` ${error.message}`, "error");
    }
}

function closeConflictWarning() {
    const warningBox = document.getElementById("conflictWarning");
    if (warningBox) {
        warningBox.style.display = "none";
    }
    pendingSessionData = null;
}

function openAddSessionModal() {
    if (!currentPlanningId) {
        alert("Veuillez attendre le chargement du planning");
        return;
    }

    const form = document.getElementById("sessionForm");
    if (form) {
        form.reset();
    }

    const modal = document.getElementById("sessionModal");

    if (modal) {
        delete modal.dataset.editingSessionId;

        const modalTitle = modal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Créer une Session';
        }
    }

    const creneauSelect = document.getElementById("creneau_ids");
    if (creneauSelect) {
        creneauSelect.selectedIndex = -1;
    }

    const materielSelect = document.getElementById("materiel_requis_ids");
    if (materielSelect) {
        materielSelect.selectedIndex = -1;
    }

    const warningBox = document.getElementById("conflictWarning");
    if (warningBox) {
        warningBox.style.display = "none";
    }

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

window.openAddSessionModal = openAddSessionModal;

async function openEditSessionModal(sessionId) {
    console.log(" Éditer session", sessionId);
    
    try {

        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            headers: authHeaders()
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur serveur: ${response.status}`, errorText);
            alert(`Erreur lors du chargement de la session (${response.status}). Vérifiez que la session existe.`);
            return;
        }
        
        const session = await response.json();
        console.log('Session chargée pour édition:', session);

        const modal = document.getElementById("sessionModal");
        if (!modal) {
            console.error('Modal sessionModal non trouvé');
            alert('Erreur: Modal introuvable');
            return;
        }
        
        modal.classList.add("active");
        document.body.style.overflow = "hidden";

        const modalTitle = modal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = ' Modifier la Session';
        }

        modal.dataset.editingSessionId = sessionId;

        const form = document.getElementById('sessionForm');
        if (!form) {
            console.error('Formulaire non trouvé');
            return;
        }

        const nomCoursInput = form.querySelector('#nomCours');
        if (nomCoursInput) nomCoursInput.value = session.nomCours || '';
        
        const descriptionInput = form.querySelector('#description');
        if (descriptionInput) descriptionInput.value = session.description || '';
        
        const dateDebutInput = form.querySelector('#dateDebut');
        if (dateDebutInput) dateDebutInput.value = session.dateDebut || '';
        
        const dateFinInput = form.querySelector('#dateFin');
        if (dateFinInput) dateFinInput.value = session.dateFin || '';
        
        const dureeInput = form.querySelector('#duree');
        if (dureeInput) dureeInput.value = session.duree || '';
        
        const statutSelect = form.querySelector('#statut');
        if (statutSelect) statutSelect.value = session.statut || '';
    
        const formateurSelect = form.querySelector('#formateur');
        if (formateurSelect && session.formateur) {
            formateurSelect.value = session.formateur.id;
        }
        
        const salleSelect = form.querySelector('#salle');
        if (salleSelect && session.salle) {
            salleSelect.value = session.salle.id;
        }
        
        const groupeSelect = form.querySelector('#groupe');
        if (groupeSelect && session.groupe) {
            groupeSelect.value = session.groupe.id;
        }

        const creneauxSelect = form.querySelector('#creneaux');
        if (creneauxSelect && session.creneaux && session.creneaux.length > 0) {

            Array.from(creneauxSelect.options).forEach(opt => opt.selected = false);

            session.creneaux.forEach(creneau => {
                const creneauId = typeof creneau === 'object' ? creneau.id : creneau;
                const option = creneauxSelect.querySelector(`option[value="${creneauId}"]`);
                if (option) option.selected = true;
            });
        }
        
        console.log(' Formulaire pré-rempli avec les données de la session');
        
    } catch (error) {
        console.error('Erreur lors du chargement de la session:', error);
        alert('Erreur lors du chargement des données de la session');
    }
}

function closeModal() {
    const modal = document.getElementById("sessionModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    closeConflictWarning();
}

function fillStatutSelect() {
    const select = document.getElementById("statut");
    if (!select) {
        console.warn(" Select statut non trouvé");
        return;
    }

    select.innerHTML = `
        <option value="">Sélectionnez un statut</option>
        <option value="PLANIFIE">Planifiée</option>
        <option value="EN_COURS">En cours</option>
        <option value="TERMINE">Terminée</option>
        <option value="ANNULEE">Annulée</option>
    `;
}

function showNotification(message, type = "info") {

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getIconForType(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

   
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

(function addNotificationStyles() {
    if (document.querySelector('#notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .notification-success {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            border-left: 4px solid #2E7D32;
        }
        
        .notification-error {
            background: linear-gradient(135deg, #f44336, #d32f2f);
            border-left: 4px solid #b71c1c;
        }
        
        .notification-warning {
            background: linear-gradient(135deg, #ff9800, #f57c00);
            border-left: 4px solid #e65100;
        }
        
        .notification-info {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            border-left: 4px solid #0D47A1;
        }
        
        .notification button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
            margin-left: auto;
            opacity: 0.8;
        }
        
        .notification button:hover {
            opacity: 1;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        /* Styles pour les conflits */
        .conflict-warning {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 2px solid #ffc107;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            display: none;
            flex-direction: column;
            gap: 10px;
        }
        
        .conflict-header {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #856404;
            font-size: 16px;
        }
        
        .conflict-list {
            max-height: 200px;
            overflow-y: auto;
            padding: 10px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
        }
        
        .conflict-item {
            padding: 10px;
            margin-bottom: 8px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #ff6b6b;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .conflict-type {
            font-weight: bold;
            color: #dc3545;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .conflict-description {
            color: #333;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .conflict-severity {
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
        }
        
        .conflict-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .btn-small {
            padding: 8px 16px;
            font-size: 14px;
        }
        
        select[multiple] {
            min-height: 100px;
            padding: 8px;
        }
        
        select[multiple] option {
            padding: 8px;
            margin: 2px 0;
            border-radius: 4px;
        }
        
        select[multiple] option:checked {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
        }
    `;

    document.head.appendChild(style);
})();

window.closeModal = closeModal;
window.closeConflictWarning = closeConflictWarning;
window.forcerCreationMalgreConflits = forcerCreationMalgreConflits;
window.openEditSessionModal = openEditSessionModal;

window.viewSession = async function(sessionId) {
    try {
        console.log(`Affichage session ${sessionId}`);
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            headers: authHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(` Erreur serveur: ${response.status}`, errorText);
            alert(`Erreur lors du chargement de la session (${response.status}). Vérifiez que la session existe et que vous avez les permissions.`);
            return;
        }
        
        const session = await response.json();
        console.log(' Session chargée:', session);

        const formateurNom = session.formateur ? `${session.formateur.prenom || ''} ${session.formateur.nom || ''}`.trim() : '-';
        const salleNom = session.salle ? session.salle.nom : '-';
        const groupeNom = session.groupe ? session.groupe.nom : '-';

        const formatDate = (date) => {
            if (!date) return '-';
            try {
                const d = new Date(date);
                return d.toLocaleString('fr-FR', { 
                    year: 'numeric', month: '2-digit', day: '2-digit', 
                    hour: '2-digit', minute: '2-digit' 
                });
            } catch {
                return date;
            }
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        modal.innerHTML = `
            <div class="modal-content session-details-modal" style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #333;"> Détails de la Session</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="close-btn" style="background: none; border: none; font-size: 32px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
                </div>
                <div class="modal-body" style="display: grid; gap: 15px;">
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">ID:</strong> <span style="color: #333;">${session.id}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Cours:</strong> <span style="color: #333; font-weight: 600;">${session.nomCours || session.titre || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Description:</strong> <span style="color: #333;">${session.description || '-'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Formateur:</strong> <span style="color: #333;">${formateurNom}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Salle:</strong> <span style="color: #333;">${salleNom}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Groupe:</strong> <span style="color: #333;">${groupeNom}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Statut:</strong> <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #10B981; color: white;">${session.statut || 'PLANIFIE'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Date début:</strong> <span style="color: #333;">${formatDate(session.dateDebut)}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Date fin:</strong> <span style="color: #333;">${formatDate(session.dateFin)}</span>
                    </div>
                    <div class="detail-row" style="display: flex; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="min-width: 140px; color: #555;">Créneaux:</strong> <span style="color: #333;">${(session.creneaux && session.creneaux.length) || 0} créneaux</span>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 24px; border: 1px solid #ccc; background: white; color: #666; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Fermer</button>
                    <button onclick="window.editSession(${sessionId}); this.closest('.modal-overlay').remove();" style="padding: 10px 24px; border: none; background: #3B82F6; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Modifier</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error("Erreur affichage session:", error);
        alert("Erreur lors de l'affichage de la session");
    }
};

window.editSession = async function(sessionId) {
    console.log(` Modification session ${sessionId}`);
    await openEditSessionModal(sessionId);
};

window.deleteSession = async function(sessionId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
        return;
    }
    
    try {
        console.log(` Suppression session ${sessionId}`);
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert(' Session supprimée avec succès');

            if (typeof loadSessions === 'function') {
                await loadSessions();
            }
        } else {
            const error = await response.text();
            alert(` Erreur: ${error}`);
        }
    } catch (error) {
        console.error("Erreur suppression session:", error);
        alert("Erreur lors de la suppression de la session");
    }
};


function setupFilters() {
    const filterSalle = document.getElementById('filterSalle');
    const filterStatut = document.getElementById('filterStatut');
    
    if (filterSalle) {
        filterSalle.addEventListener('change', applyFilters);
    }
    
    if (filterStatut) {
        filterStatut.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const filterSalle = document.getElementById('filterSalle');
    const filterStatut = document.getElementById('filterStatut');
    
    const salleValue = filterSalle ? filterSalle.value : 'all';
    const statutValue = filterStatut ? filterStatut.value : 'all';
    
    console.log(`Application des filtres: Salle=${salleValue}, Statut=${statutValue}`);

    document.querySelectorAll('.salle-row:not(.template)').forEach(salleRow => {
        const salleId = salleRow.id.replace('salle-', '');

        if (salleValue === 'all' || salleValue === salleId) {
            salleRow.style.display = 'grid';

            salleRow.querySelectorAll('.session-card').forEach(card => {

                const cardClasses = Array.from(card.classList);
                const sessionStatut = cardClasses.find(cls => 
                    ['planifie', 'termine', 'annulee', 'confirmee', 'attente'].includes(cls)
                ) || 'planifie';
                

                const normalizedCardStatut = sessionStatut.toLowerCase();
                const normalizedFilterStatut = statutValue.toLowerCase();
                
                let shouldDisplay = false;
                
                if (statutValue === 'all') {
                    shouldDisplay = true;
                } else if (normalizedFilterStatut === 'planifie' && 
                          ['planifie', 'confirmee', 'attente'].includes(normalizedCardStatut)) {
                    shouldDisplay = true;
                } else if (normalizedFilterStatut === 'termine' && 
                          normalizedCardStatut === 'termine') {
                    shouldDisplay = true;
                } else if (normalizedFilterStatut === 'annulee' && 
                          normalizedCardStatut === 'annulee') {
                    shouldDisplay = true;
                } else if (normalizedFilterStatut === normalizedCardStatut) {
                    shouldDisplay = true;
                }
                
                card.style.display = shouldDisplay ? 'block' : 'none';
            });
        } else {
            salleRow.style.display = 'none';
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(setupFilters, 1000);
});
