// ==========================================
// INITIALISATION DES ÉLÉMENTS DÉCORATIFS
// ==========================================

function initializeDecorations() {
    const bgShapes = document.querySelector('.bg-shapes');
    
    // Ajouter les éléments décoratifs manquants
    const decorations = `
        <!-- Diamond -->
        <div class="deco-diamond"></div>
        
        <!-- Circles -->
        <div class="deco-circle"></div>
        <div class="deco-circle-2"></div>
        <div class="deco-circle-3"></div>
        
        <!-- Plus signs -->
        <div class="deco-plus"></div>
        <div class="deco-plus-2"></div>
        <div class="deco-plus-3"></div>
        
        <!-- Grid patterns -->
        <div class="grid-pattern"></div>
        <div class="grid-pattern-2"></div>
        
        <!-- Lines -->
        <div class="line-deco line-deco-1"></div>
        <div class="line-deco line-deco-2"></div>
        <div class="line-deco line-deco-3"></div>
        <div class="line-deco line-deco-4"></div>
    `;
    
    bgShapes.innerHTML += decorations;
}

// ==========================================
// INITIALISATION PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDecorations();
    initializeApp();
    loadSalles();
    setupEventListeners();
});