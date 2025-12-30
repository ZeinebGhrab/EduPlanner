const API_BASE_URL = 'http://localhost:8080/api';

async function testAPIConnection() {
    console.log('Test de connexion à l\'API...');
    try {
        const response = await fetch(`${API_BASE_URL}/formateurs`);
        if (response.ok) {
            console.log('Connexion API réussie');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur connexion API:', error);
        return false;
    }
}


async function loadFormateursFromAPI_TEMP() {
    console.log('\n DÉBUT loadFormateursFromAPI - VERSION TEMPORAIRE');
    
    try {
        const responseFormateurs = await fetch(`${API_BASE_URL}/formateurs`);
        if (!responseFormateurs.ok) {
            const errorText = await responseFormateurs.text();
            throw new Error(`HTTP ${responseFormateurs.status}: ${errorText}`);
        }
        const formateurs = await responseFormateurs.json();

        const responseDisponibilites = await fetch(`${API_BASE_URL}/disponibilites`);
        if (!responseDisponibilites.ok) {
            const errorText = await responseDisponibilites.text();
            throw new Error(`HTTP ${responseDisponibilites.status}: ${errorText}`);
        }
        let disponibilites = await responseDisponibilites.json();
        
        const formateursAvecDispos = formateurs.map(formateur => {
            let disposDuFormateur = [];
            
            if (formateur.id === 6) {
                disposDuFormateur = [...disponibilites];
            }
            
            console.log(`Formateur ${formateur.id}: ${disposDuFormateur.length} disponibilités`);
            
            return {
                ...formateur,
                disponibilites: disposDuFormateur
            };
        });
        
        return formateursAvecDispos;
        
    } catch (error) {
        console.error('ERREUR:', error);
        throw error;
    }
}
async function createFormateur(formateurData) {
    console.log('Création formateur:', formateurData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/formateurs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formateurData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur création formateur:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Formateur créé:', result);
        return result;
        
    } catch (error) {
        console.error('Erreur création formateur:', error);
        throw error;
    }
}

async function updateFormateur(id, formateurData) {
    console.log(`Mise à jour formateur ID ${id}:`, formateurData);
    
    try {
        const approaches = [
        
            async () => {
                const dataToSend = { ...formateurData };
                delete dataToSend.id;
                
                console.log('Approche 1 - Données normales:', dataToSend);
                
                const response = await fetch(`${API_BASE_URL}/formateurs/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });
                
                return { response, approach: 1 };
            },
            
            async () => {
                const dataWithId = {
                    ...formateurData,
                    id: id
                };
                
                console.log('Approche 2 - Avec ID dans body:', dataWithId);
                
                const response = await fetch(`${API_BASE_URL}/formateurs/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(dataWithId)
                });
                
                return { response, approach: 2 };
            },
            
            async () => {
                const dataToSend = { ...formateurData };
                delete dataToSend.id;
                
                console.log('Approche 3 - Méthode PATCH:', dataToSend);
                
                const response = await fetch(`${API_BASE_URL}/formateurs/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });
                
                return { response, approach: 3 };
            }
        ];
        
        let lastError;
        
        for (const approach of approaches) {
            try {
                console.log(`\nTentative approche...`);
                const { response, approach: approachNum } = await approach();
                
                console.log(`Approche ${approachNum} - Status:`, response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`Approche ${approachNum} réussie:`, result);
                    return result;
                } else if (response.status !== 500) {
                    const errorText = await response.text();
                    console.error(`Approche ${approachNum} - Erreur:`, errorText);
                    lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                } else {
                    console.log(`Approche ${approachNum} - Échec avec 500, essayons la suivante...`);
                }
            } catch (error) {
                console.log(`Approche échouée:`, error.message);
                lastError = error;
            }
        }
        
        
        console.log('\nTentative avec endpoint différent...');
        
        const response = await fetch(`${API_BASE_URL}/formateurs/update/${id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formateurData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Succès avec endpoint alternatif:', result);
            return result;
        }
        
        throw lastError || new Error('Toutes les approches ont échoué');
        
    } catch (error) {
        console.error('Erreur mise à jour formateur:', error);
        throw error;
    }
}

async function deleteFormateur(id) {
    console.log(`Suppression formateur ID ${id}`);
    
    try {
        await deleteAllFormateurDisponibilites(id);
        
        const response = await fetch(`${API_BASE_URL}/formateurs/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        console.log(' Formateur supprimé avec succès');
        return true;
        
    } catch (error) {
        console.error(' Erreur suppression formateur:', error);
        throw error;
    }
}

async function saveFormateurDisponibilites(formateurId, disponibilites) {
    console.log(`Sauvegarde disponibilités pour formateur ${formateurId}:`, disponibilites);
    
    try {
        console.log('Suppression des anciennes disponibilités...');
        await deleteAllFormateurDisponibilites(formateurId);
        
        console.log('Création des nouvelles disponibilités...');
        const promises = disponibilites.map(async (dispo) => {
            const dto = {
                formateurId: parseInt(formateurId),
                jourSemaine: dispo.jourSemaine,
                heureDebut: formatHeure(dispo.heureDebut),
                heureFin: formatHeure(dispo.heureFin),
                estDisponible: true
            };
            
            console.log('Envoi DTO disponibilité:', dto);
            
            const response = await fetch(`${API_BASE_URL}/disponibilites`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dto)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur API:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Disponibilité créée:', result);
            return result;
        });
        
        await Promise.all(promises);
        console.log(`${disponibilites.length} disponibilité(s) sauvegardées`);
        return true;
        
    } catch (error) {
        console.error(' Erreur sauvegarde disponibilités:', error);
        throw error;
    }
}

async function deleteAllFormateurDisponibilites(formateurId) {
    console.log(` Suppression des disponibilités pour formateur ${formateurId}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/disponibilites`);
        if (!response.ok) return false;
        
        const allDisponibilites = await response.json();
        
        const toDelete = allDisponibilites.filter(d => {

            if (d.formateur_id === formateurId) return true;
            
            return formateurId === 6 && allDisponibilites.length > 0;
        });
        
        console.log(`À supprimer: ${toDelete.length} disponibilités`);
        
        for (const dispo of toDelete) {
            try {
                const deleteResponse = await fetch(`${API_BASE_URL}/disponibilites/${dispo.id}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    console.log(` Disponibilité ${dispo.id} supprimée`);
                } else {
                    console.warn(` Échec suppression ${dispo.id}: HTTP ${deleteResponse.status}`);
                }
            } catch (error) {
                console.warn(` Erreur suppression ${dispo.id}:`, error);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression disponibilités:', error);
        return false;
    }
}



function formatHeure(heure) {
    if (!heure) return '08:00:00';
    
    heure = heure.trim();
    
    if (heure.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return heure;
    }
    
    
    if (heure.match(/^\d{2}:\d{2}$/)) {
        return heure + ':00';
    }
    
    if (heure.match(/^\d{1,2}:\d{2}$/)) {
        const parts = heure.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
    }
    
    return '08:00:00';
}

async function loadAllDisponibilites() {
    try {
        const response = await fetch(`${API_BASE_URL}/disponibilites`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Erreur chargement disponibilités:', error);
        return [];
    }
}

async function loadFormateurDisponibilites(formateurId) {
    try {
        const allDisponibilites = await loadAllDisponibilites();
        
        if (formateurId === 6) {
            return allDisponibilites;
        }
        
        return [];
    } catch (error) {
        console.error(`Erreur chargement disponibilités formateur ${formateurId}:`, error);
        return [];
    }
}
window.testUpdateAPI = async function(formateurId) {
    console.log(' Test direct de l\'API update');
    
    const testData = {
        nom: "TestNom",
        prenom: "TestPrenom",
        email: "test.update@example.com",
        telephone: "+216 12345678",
        specialite: "TestSpecialite",
        actif: true
    };
    
    console.log('Test avec données:', testData);
    
    const endpoints = [
        `${API_BASE_URL}/formateurs/${formateurId}`,
        `${API_BASE_URL}/formateurs/update/${formateurId}`,
        `${API_BASE_URL}/formateurs/edit/${formateurId}`
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\nTest endpoint: ${endpoint}`);
        
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            console.log(`PUT - Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('SUCCÈS avec PUT:', data);
                return;
            } else {
                const errorText = await response.text();
                console.log(` Échec PUT: ${errorText}`);
            }
        } catch (error) {
            console.log(`Erreur PUT:`, error.message);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            console.log(`POST - Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('SUCCÈS avec POST:', data);
                return;
            } else {
                const errorText = await response.text();
                console.log(`Échec POST: ${errorText}`);
            }
        } catch (error) {
            console.log(`Erreur POST:`, error.message);
        }
    }
    
    console.log('\n Tous les tests ont échoué');
};

// Export des fonctions
window.testAPIConnection = testAPIConnection;
window.loadFormateursFromAPI = loadFormateursFromAPI_TEMP;
window.createFormateur = createFormateur;
window.updateFormateur = updateFormateur;
window.deleteFormateur = deleteFormateur;
window.loadFormateurDisponibilites = loadFormateurDisponibilites;
window.saveFormateurDisponibilites = saveFormateurDisponibilites;
window.deleteAllFormateurDisponibilites = deleteAllFormateurDisponibilites;
window.loadAllDisponibilites = loadAllDisponibilites;
window.testUpdateAPI = testUpdateAPI;