document.addEventListener('DOMContentLoaded', () => {
    
    // State: Mock Database of Routes
    const mockDb = [];

    // --- DOM Elements ---
    
    // Route Builder
    const routeForm = document.getElementById('route-form');
    const routeMethod = document.getElementById('route-method');
    const routePath = document.getElementById('route-path');
    const routeSecure = document.getElementById('route-secure');
    const routeResponse = document.getElementById('route-response');
    const routesList = document.getElementById('routes-list');

    // Client Console
    const clientForm = document.getElementById('client-form');
    const clientMethod = document.getElementById('client-method');
    const clientUrl = document.getElementById('client-url');
    const clientHeaders = document.getElementById('client-headers');
    const clientBody = document.getElementById('client-body');

    // Response Viewer
    const responseMeta = document.getElementById('response-meta');
    const resStatus = document.getElementById('res-status');
    const resTime = document.getElementById('res-time');
    const resBody = document.getElementById('res-body');

    // --- 1. Route Builder Logic ---

    routeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const method = routeMethod.value;
        const path = routePath.value.trim();
        const secure = routeSecure.checked;
        const responseJson = routeResponse.value.trim();

        // Validate Path format
        if (!path.startsWith('/')) {
            alert('Endpoint path must start with a forward slash (/). Example: /api/users');
            return;
        }

        // Validate JSON
        let parsedJson = null;
        try {
            parsedJson = JSON.parse(responseJson || '{}');
        } catch (err) {
            alert('Invalid JSON Response Body. Please provide valid JSON.');
            return;
        }

        // Store Route
        const newRoute = {
            id: Date.now().toString(),
            method: method,
            path: path,
            secure: secure,
            response: parsedJson
        };

        // Check if route already exists (overwrite it)
        const existingIndex = mockDb.findIndex(r => r.method === method && r.path === path);
        if (existingIndex > -1) {
            mockDb[existingIndex] = newRoute;
        } else {
            mockDb.push(newRoute);
        }

        renderRoutesList();
        
        // Reset form slightly
        routePath.value = '';
        routeSecure.checked = false;
        alert(`Successfully saved mock route: ${method} ${path}`);
    });

    function renderRoutesList() {
        routesList.innerHTML = '';
        mockDb.forEach(route => {
            const li = document.createElement('li');
            li.className = 'route-item';
            
            const badgeClass = `badge-${route.method.toLowerCase()}`;
            li.innerHTML = `
                <span class="method-badge ${badgeClass}">${route.method}</span>
                <span class="flex-grow">${route.path}</span>
                ${route.secure ? '<i class="fas fa-lock text-muted" title="Requires Bearer Token"></i>' : ''}
            `;
            
            // Clicking a route pre-fills the client
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                clientMethod.value = route.method;
                clientUrl.value = route.path;
                if (route.secure && !clientHeaders.value.includes('Authorization')) {
                    clientHeaders.value = 'Authorization: Bearer test_token\n' + clientHeaders.value;
                }
            });

            routesList.appendChild(li);
        });
    }

    // --- 2. Client Simulator Logic ---

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const method = clientMethod.value;
        const url = clientUrl.value.trim();
        const headersRaw = clientHeaders.value.trim();
        const bodyRaw = clientBody.value.trim();

        // Parse Headers
        const reqHeaders = {};
        if (headersRaw) {
            headersRaw.split('\n').forEach(line => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    reqHeaders[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim();
                }
            });
        }

        // Simulate Network Latency
        const simulatedLatency = Math.floor(Math.random() * 150) + 20; // 20ms - 170ms

        // Process Request
        setTimeout(() => {
            processMockRequest(method, url, reqHeaders, bodyRaw, simulatedLatency);
        }, simulatedLatency);
    });

    function processMockRequest(method, url, headers, bodyRaw, latencyMs) {
        let statusCode = 200;
        let statusText = 'OK';
        let responsePayload = null;

        // 1. Check if method allows body and validate it
        if ((method === 'POST' || method === 'PUT') && bodyRaw) {
            try {
                JSON.parse(bodyRaw);
            } catch (err) {
                statusCode = 400;
                statusText = 'Bad Request';
                responsePayload = { error: 'Invalid JSON payload in request body.' };
                renderResponse(statusCode, statusText, responsePayload, latencyMs);
                return;
            }
        }

        // Extract path (ignore query params for matching)
        const pathOnly = url.split('?')[0];

        // 2. Find Route
        const route = mockDb.find(r => r.method === method && r.path === pathOnly);

        if (!route) {
            statusCode = 404;
            statusText = 'Not Found';
            responsePayload = { error: `Route ${method} ${pathOnly} not defined in Mock Server.` };
            renderResponse(statusCode, statusText, responsePayload, latencyMs);
            return;
        }

        // 3. Security Check (Token Auth Simulation)
        if (route.secure) {
            const authHeader = headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                statusCode = 401;
                statusText = 'Unauthorized';
                responsePayload = { error: 'Missing or invalid Bearer token. Route requires authentication.' };
                renderResponse(statusCode, statusText, responsePayload, latencyMs);
                return;
            }
        }

        // 4. Success Response
        if (method === 'POST') {
            statusCode = 201;
            statusText = 'Created';
        } else if (method === 'DELETE') {
            statusCode = 204;
            statusText = 'No Content';
            responsePayload = null;
        } else {
            statusCode = 200;
            statusText = 'OK';
        }
        
        responsePayload = responsePayload !== null ? responsePayload : route.response;
        
        renderResponse(statusCode, statusText, responsePayload, latencyMs);
    }

    // --- 3. Response Viewer Logic ---

    function renderResponse(code, text, payload, latency) {
        responseMeta.style.display = 'flex';
        
        // Status Badge formatting
        resStatus.textContent = `${code} ${text}`;
        resStatus.className = 'badge';
        
        if (code >= 200 && code < 300) {
            resStatus.classList.add('badge-2xx');
        } else if (code >= 400 && code < 500) {
            resStatus.classList.add('badge-4xx');
        } else if (code >= 500) {
            resStatus.classList.add('badge-5xx');
        }

        // Time
        resTime.textContent = `${latency}ms`;

        // Body formatting
        if (code === 204 || payload === null) {
            resBody.textContent = '// No Content';
        } else {
            resBody.textContent = JSON.stringify(payload, null, 2);
        }
    }

    // Initialize with a default route
    routePath.value = '/api/v1/ping';
    routeResponse.value = '{\n  "status": "success",\n  "message": "pong"\n}';
    routeForm.dispatchEvent(new Event('submit'));
    
    // Clear client form for initial state
    clientUrl.value = '';
    clientHeaders.value = '';
    clientBody.value = '';
});
