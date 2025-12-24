// Variables d'état globales
export let conflits = [];
export let currentConflitId = null;
export let currentPage = 1;
export const itemsPerPage = 10;

// Fonctions pour modifier l'état
export function setConflits(newConflits) {
    conflits = newConflits;
}

export function setCurrentConflitId(id) {
    currentConflitId = id;
}

export function setCurrentPage(page) {
    currentPage = page;
}

export function addConflit(conflit) {
    conflits.push(conflit);
}

export function removeConflit(conflitId) {
    const index = conflits.findIndex(c => c.id === conflitId);
    if (index !== -1) {
        conflits.splice(index, 1);
    }
}

export function clearConflits() {
    conflits = [];
}

export function getConflitById(id) {
    return conflits.find(c => c.id === id);
}