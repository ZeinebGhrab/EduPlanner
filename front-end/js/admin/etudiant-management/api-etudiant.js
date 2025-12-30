async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include'
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);

        if (response.status === 500) {
            const error = new Error('SERVER_ERROR_500');
            error.status = 500;
            error.data = await response.text().catch(() => 'Server error');
            throw error;
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            if (errorText) {
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.message) errorMessage = errorJson.message;
                    else if (errorJson.error) errorMessage = errorJson.error;
                } catch (e) { }
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = errorText;
            if (errorMessage.includes('Duplicate entry') || errorMessage.includes('already exists')) {
                error.code = 'DUPLICATE_ENTRY';
            }
            throw error;
        }

        if (response.status === 204 || method === 'DELETE') return null;

        const text = await response.text();
        if (!text || text.trim() === '') return null;

        return JSON.parse(text);

    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) error.code = 'CONNECTION_REFUSED';
        else if (error.message.includes('CORS')) error.code = 'CORS_ERROR';
        else if (error.message.includes('404')) error.code = 'ENDPOINT_NOT_FOUND';
        else if (error.message.includes('500') || error.message === 'SERVER_ERROR_500') error.code = 'SERVER_ERROR';
        else if (error.message.includes('405')) error.code = 'METHOD_NOT_ALLOWED';
        throw error;
    }
}


async function checkAPIConnection() {
    const endpoints = [
        { url: API_ENDPOINTS.health, name: 'Health endpoint' },
        { url: `${SPRING_API_URL}/api`, name: 'API base' },
        { url: API_ENDPOINTS.etudiants, name: 'Étudiants endpoint' },
        { url: API_ENDPOINTS.groupes, name: 'Groupes endpoint' }
    ];
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url, { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'include' });
            if (response.ok) return true;
        } catch (error) { continue; }
    }
    return false;
}

function generateUniqueGroupCode() {
    return 'GRP' + Date.now().toString().slice(-6);
}
window.apiRequest = apiRequest;
window.checkAPIConnection = checkAPIConnection;
window.generateUniqueGroupCode = generateUniqueGroupCode;
