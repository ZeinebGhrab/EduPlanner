import { initEventListeners, initRealTimeValidation, initSections, initDisponibilites, showWelcomeAnimation, checkExistingToken } from './events.js';

export function initApp() {
    document.addEventListener('DOMContentLoaded', () => {
        initEventListeners();
        initRealTimeValidation();
        initSections();
        initDisponibilites();
        showWelcomeAnimation();
        checkExistingToken();
    });
}
