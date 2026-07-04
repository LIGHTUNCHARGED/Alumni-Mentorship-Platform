const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : 'https://alumni-mentorship-platform.onrender.com/api';

const api = {
    async request(method, path, body = null, params = null) {
        let url = `${API_BASE_URL}${path}`;
        
        // Append query params if any
        if (params) {
            const queryParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            }
            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        // Add Bearer token if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            
            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                // If we are not already on login or register or landing pages, redirect
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('register.html') && currentPath !== '/' && !currentPath.includes('index.html')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return null;
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP error! Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            // Return JSON if there is content, else null
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    get(path, params = null) {
        return this.request('GET', path, null, params);
    },

    post(path, body = null) {
        return this.request('POST', path, body);
    },

    put(path, body = null) {
        return this.request('PUT', path, body);
    },

    patch(path, body = null) {
        return this.request('PATCH', path, body);
    },

    delete(path) {
        return this.request('DELETE', path);
    }
};
