// --------------------------
// Styles additionnels
// --------------------------
const style = document.createElement('style');
style.textContent = `
    .no-sessions, .no-data {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        background: rgba(255,255,255,0.9);
        border-radius: 12px;
        margin: 20px 0;
    }
    .no-sessions i, .no-data i {
        font-size: 48px;
        color: #ddd;
        margin-bottom: 15px;
    }
    .no-sessions p, .no-data p {
        font-size: 16px;
        margin: 0;
    }
    .status-completed {
        background-color: #4CAF50 !important;
    }
    .status-ongoing {
        background-color: #FF9800 !important;
    }
    .session-date {
        font-size: 13px;
        color: #666;
        margin-bottom: 5px;
        text-transform: capitalize;
        font-weight: 500;
    }
`;
document.head.appendChild(style);
