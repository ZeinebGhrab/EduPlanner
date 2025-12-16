export function updateStatistics(stats) {
    if (!stats) return;
    const statCards = document.querySelectorAll('.stat-card.main .stat-number');
    if (statCards.length >= 3) {
        statCards[0].textContent = `${stats.totalHeures || 0}h`;
        statCards[1].textContent = `${stats.totalSessions || 0}`;
        statCards[2].textContent = stats.sessionsTerminees || 0;
    }
}