import { initEventListeners, initSections, initDisponibilites, showWelcomeAnimation, checkExistingToken } from './ui.js';

export function initApp() {
    document.addEventListener('DOMContentLoaded', () => {
        initEventListeners();
        initSections();
        initDisponibilites();
        showWelcomeAnimation();
        checkExistingToken();
    });
}
